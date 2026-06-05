// src/routes/dispute.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

// Admin check middleware
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

// POST /api/disputes - নতুন dispute raise করো
router.post('/', async (req, res) => {
  try {
    const userId = req.userId;
    const { againstId, campaignId, reason, description } = req.body;

    if (!againstId || !reason || !description) {
      return res.status(400).json({ message: 'againstId, reason এবং description দিতে হবে' });
    }

    const dispute = await prisma.dispute.create({
      data: {
        raisedBy: userId,
        againstId,
        campaignId: campaignId || null,
        reason,
        description,
        status: 'OPEN',
      },
    });

    // Admin কে notification
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    await Promise.all(
      admins.map(admin =>
        prisma.notification.create({
          data: {
            userId: admin.id,
            title: '⚠️ New Dispute Filed',
            message: `A new dispute has been raised: ${reason}`,
            type: 'dispute',
          },
        })
      )
    );

    res.status(201).json({ message: 'Dispute submitted successfully', dispute });
  } catch (error) {
    console.error('Dispute create error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/disputes/my - নিজের disputes দেখো
router.get('/my', async (req, res) => {
  try {
    const userId = req.userId;
    const disputes = await prisma.dispute.findMany({
      where: {
        OR: [{ raisedBy: userId }, { againstId: userId }],
      },
      orderBy: { createdAt: 'desc' },
    });

    // User info manually fetch করো
    const disputesWithUsers = await Promise.all(
      disputes.map(async (d) => {
        const raisedByUser = await prisma.user.findUnique({
          where: { id: d.raisedBy },
          select: { id: true, name: true, email: true, role: true },
        });
        const againstUser = await prisma.user.findUnique({
          where: { id: d.againstId },
          select: { id: true, name: true, email: true, role: true },
        });
        const campaign = d.campaignId
          ? await prisma.campaign.findUnique({
              where: { id: d.campaignId },
              select: { id: true, title: true },
            })
          : null;
        return { ...d, raisedByUser, againstUser, campaign };
      })
    );

    res.json({ disputes: disputesWithUsers });
  } catch (error) {
    console.error('Dispute list error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────────

// GET /api/disputes/admin/list - সব disputes (admin only)
router.get('/admin/list', adminOnly, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = status ? { status } : {};

    const disputes = await prisma.dispute.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    });

    const total = await prisma.dispute.count({ where });

    // User info fetch করো
    const disputesWithUsers = await Promise.all(
      disputes.map(async (d) => {
        const raisedByUser = await prisma.user.findUnique({
          where: { id: d.raisedBy },
          select: { id: true, name: true, email: true, role: true },
        });
        const againstUser = await prisma.user.findUnique({
          where: { id: d.againstId },
          select: { id: true, name: true, email: true, role: true },
        });
        const campaign = d.campaignId
          ? await prisma.campaign.findUnique({
              where: { id: d.campaignId },
              select: { id: true, title: true },
            })
          : null;
        return { ...d, raisedByUser, againstUser, campaign };
      })
    );

    res.json({
      disputes: disputesWithUsers,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('Admin dispute list error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/disputes/admin/:id/resolve - dispute resolve করো (admin only)
router.put('/admin/:id/resolve', adminOnly, async (req, res) => {
  try {
    const { status, resolution } = req.body;

    if (!['UNDER_REVIEW', 'RESOLVED', 'CLOSED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const dispute = await prisma.dispute.findUnique({
      where: { id: req.params.id },
    });

    if (!dispute) return res.status(404).json({ message: 'Dispute not found' });

    const updatedDispute = await prisma.dispute.update({
      where: { id: req.params.id },
      data: {
        status,
        resolution: resolution || null,
        resolvedAt: ['RESOLVED', 'CLOSED'].includes(status) ? new Date() : null,
      },
    });

    // দুই পক্ষকে notification
    const notifTitle = status === 'RESOLVED' ? '✅ Dispute Resolved' :
                       status === 'CLOSED' ? '🔒 Dispute Closed' : '🔍 Dispute Under Review';
    const notifMessage = status === 'RESOLVED'
      ? `Your dispute has been resolved. Resolution: ${resolution}`
      : status === 'CLOSED'
      ? 'Your dispute has been closed.'
      : 'Your dispute is now under review by our team.';

    await Promise.all([
      prisma.notification.create({
        data: { userId: dispute.raisedBy, title: notifTitle, message: notifMessage, type: 'dispute' },
      }),
      prisma.notification.create({
        data: { userId: dispute.againstId, title: notifTitle, message: notifMessage, type: 'dispute' },
      }),
    ]);

    res.json({ message: 'Dispute updated successfully', dispute: updatedDispute });
  } catch (error) {
    console.error('Dispute resolve error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
