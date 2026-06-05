// src/routes/rating.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// POST /api/ratings - rating দাও
router.post('/', async (req, res) => {
  try {
    const fromUserId = req.userId;
    const { toUserId, campaignId, score, comment, type } = req.body;

    if (!toUserId || !campaignId || !score || !type) {
      return res.status(400).json({ message: 'toUserId, campaignId, score, type দিতে হবে' });
    }

    if (score < 1 || score > 5) {
      return res.status(400).json({ message: 'Score must be between 1 and 5' });
    }

    if (!['ADVERTISER_TO_PROMOTER', 'PROMOTER_TO_ADVERTISER'].includes(type)) {
      return res.status(400).json({ message: 'Invalid rating type' });
    }

    // Already rated check
    const existing = await prisma.rating.findUnique({
      where: {
        fromUserId_campaignId_type: { fromUserId, campaignId, type },
      },
    });

    if (existing) {
      return res.status(400).json({ message: 'You have already rated for this campaign' });
    }

    const rating = await prisma.rating.create({
      data: { fromUserId, toUserId, campaignId, score, comment, type },
    });

    // Promoter এর average rating update করো
    if (type === 'ADVERTISER_TO_PROMOTER') {
      const promoter = await prisma.promoter.findUnique({ where: { userId: toUserId } });
      if (promoter) {
        const allRatings = await prisma.rating.findMany({
          where: { toUserId, type: 'ADVERTISER_TO_PROMOTER' },
        });
        const avg = allRatings.reduce((sum, r) => sum + r.score, 0) / allRatings.length;
        await prisma.promoter.update({
          where: { userId: toUserId },
          data: { rating: Math.round(avg * 10) / 10 },
        });
      }
    }

    // Notification পাঠাও
    await prisma.notification.create({
      data: {
        userId: toUserId,
        title: '⭐ New Rating Received',
        message: `You received a ${score}-star rating!${comment ? ` "${comment}"` : ''}`,
        type: 'rating',
      },
    });

    res.status(201).json({ message: 'Rating submitted successfully', rating });
  } catch (error) {
    console.error('Rating error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/ratings/user/:userId - কারো ratings দেখো
router.get('/user/:userId', async (req, res) => {
  try {
    const ratings = await prisma.rating.findMany({
      where: { toUserId: req.params.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const avg = ratings.length
      ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
      : 0;

    res.json({
      ratings,
      average: Math.round(avg * 10) / 10,
      total: ratings.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/ratings/campaign/:campaignId - campaign এর ratings
router.get('/campaign/:campaignId', async (req, res) => {
  try {
    const ratings = await prisma.rating.findMany({
      where: { campaignId: req.params.campaignId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ ratings, total: ratings.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/ratings/check - already rated কিনা check করো
router.get('/check', async (req, res) => {
  try {
    const { campaignId, type } = req.query;
    const fromUserId = req.userId;

    const existing = await prisma.rating.findUnique({
      where: {
        fromUserId_campaignId_type: { fromUserId, campaignId, type },
      },
    });

    res.json({ rated: !!existing, rating: existing });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
