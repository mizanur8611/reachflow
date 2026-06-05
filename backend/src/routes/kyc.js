// src/routes/kyc.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer - memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Helper: buffer to Cloudinary upload
const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `reachflow/${folder}`, resource_type: 'image' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
};

// Admin check middleware (local)
const adminOnly = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    req.userId = decoded.userId;
    req.user = { id: decoded.userId };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ─────────────────────────────────────────
// USER ROUTES
// ─────────────────────────────────────────

// GET /api/kyc/status
router.get('/status', async (req, res) => {
  try {
    const userId = req.userId || req.user?.id;
    const kyc = await prisma.kycVerification.findUnique({
      where: { userId },
    });

    if (!kyc) return res.json({ status: 'NOT_SUBMITTED', kyc: null });
    res.json({ status: kyc.status, kyc });
  } catch (error) {
    console.error('KYC status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/kyc/submit
router.post(
  '/submit',
  upload.fields([
    { name: 'nidFront', maxCount: 1 },
    { name: 'nidBack', maxCount: 1 },
    { name: 'selfie', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const userId = req.userId || req.user?.id;
      const { type, nidNumber } = req.body;

      const existing = await prisma.kycVerification.findUnique({
        where: { userId },
      });

      if (existing && existing.status === 'VERIFIED') {
        return res.status(400).json({ message: 'KYC already verified' });
      }
      if (existing && existing.status === 'PENDING') {
        return res.status(400).json({ message: 'KYC already under review' });
      }

      if (!req.files?.nidFront || !req.files?.nidBack || !req.files?.selfie) {
        return res.status(400).json({ message: 'All 3 images required: nidFront, nidBack, selfie' });
      }

      const [nidFrontUrl, nidBackUrl, selfieUrl] = await Promise.all([
        uploadToCloudinary(req.files.nidFront[0].buffer, 'kyc/nid-front'),
        uploadToCloudinary(req.files.nidBack[0].buffer, 'kyc/nid-back'),
        uploadToCloudinary(req.files.selfie[0].buffer, 'kyc/selfie'),
      ]);

      const kyc = await prisma.kycVerification.upsert({
        where: { userId },
        update: {
          type: type || 'NID',
          nidNumber,
          nidFrontUrl,
          nidBackUrl,
          selfieUrl,
          status: 'PENDING',
          rejectionNote: null,
          submittedAt: new Date(),
          reviewedAt: null,
          reviewedBy: null,
        },
        create: {
          userId,
          type: type || 'NID',
          nidNumber,
          nidFrontUrl,
          nidBackUrl,
          selfieUrl,
          status: 'PENDING',
        },
      });

      await prisma.notification.create({
        data: {
          userId,
          title: 'KYC Submitted',
          message: 'Your KYC documents have been submitted and are under review.',
          type: 'kyc',
        },
      });

      res.status(201).json({ message: 'KYC submitted successfully', kyc });
    } catch (error) {
      console.error('KYC submit error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// ─────────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────────

// GET /api/kyc/admin/list
router.get('/admin/list', adminOnly, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = status ? { status } : {};

    const [kycs, total] = await Promise.all([
      prisma.kycVerification.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true, avatar: true },
          },
        },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.kycVerification.count({ where }),
    ]);

    res.json({
      kycs,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('KYC list error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/kyc/admin/:id
router.get('/admin/:id', adminOnly, async (req, res) => {
  try {
    const kyc = await prisma.kycVerification.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true, avatar: true },
        },
      },
    });

    if (!kyc) return res.status(404).json({ message: 'KYC not found' });
    res.json(kyc);
  } catch (error) {
    console.error('KYC detail error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/kyc/admin/:id/review
router.put('/admin/:id/review', adminOnly, async (req, res) => {
  try {
    const { status, rejectionNote } = req.body;

    if (!['VERIFIED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Status must be VERIFIED or REJECTED' });
    }
    if (status === 'REJECTED' && !rejectionNote) {
      return res.status(400).json({ message: 'Rejection note required when rejecting' });
    }

    const kyc = await prisma.kycVerification.findUnique({
      where: { id: req.params.id },
    });
    if (!kyc) return res.status(404).json({ message: 'KYC not found' });

    const updatedKyc = await prisma.kycVerification.update({
      where: { id: req.params.id },
      data: {
        status,
        rejectionNote: status === 'REJECTED' ? rejectionNote : null,
        reviewedAt: new Date(),
        reviewedBy: req.user.id,
      },
    });

    // Advertiser/Promoter verified status update
    const user = await prisma.user.findUnique({
      where: { id: kyc.userId },
      include: { advertiser: true, promoter: true },
    });

    if (user?.advertiser) {
      await prisma.advertiser.update({
        where: { userId: kyc.userId },
        data: { kycStatus: status, verified: status === 'VERIFIED' },
      });
    }

    if (user?.promoter) {
      await prisma.promoter.update({
        where: { userId: kyc.userId },
        data: { verified: status === 'VERIFIED' },
      });
    }

    await prisma.notification.create({
      data: {
        userId: kyc.userId,
        title: status === 'VERIFIED' ? 'KYC Approved ✅' : 'KYC Rejected ❌',
        message:
          status === 'VERIFIED'
            ? 'Your KYC has been verified successfully!'
            : `Your KYC was rejected. Reason: ${rejectionNote}`,
        type: 'kyc',
      },
    });

    res.json({ message: `KYC ${status.toLowerCase()} successfully`, kyc: updatedKyc });
  } catch (error) {
    console.error('KYC review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
