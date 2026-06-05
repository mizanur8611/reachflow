// routes/analyticsExport.js
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { generateCampaignExcel } = require("../utils/excelExport");
const { generateCampaignPDF } = require("../utils/pdfExport");

const prisma = new PrismaClient();

// ─── Middleware: Auth check (replace with your actual auth middleware) ───
// This assumes you have a verifyToken middleware that sets req.user
// Example: router.use(verifyToken);

/**
 * GET /api/analytics/export/:campaignId
 * Query params:
 *   - format: "excel" | "pdf" (default: "excel")
 *   - dateFrom: ISO date string (optional)
 *   - dateTo: ISO date string (optional)
 *
 * Access:
 *   - Advertiser: only their own campaigns
 *   - Admin: any campaign
 */
router.get("/export/:campaignId", async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { format = "excel", dateFrom, dateTo } = req.query;
    const userId = req.user?.id;        // from auth middleware
    const userRole = req.user?.role;    // ADMIN | ADVERTISER | PROMOTER

    // ── 1. Fetch Campaign ──
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        advertiser: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        analytics: true,
      },
    });

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    // ── 2. Authorization ──
    if (userRole === "ADVERTISER") {
      const advertiser = await prisma.advertiser.findUnique({ where: { userId } });
      if (!advertiser || campaign.advertiserId !== advertiser.id) {
        return res.status(403).json({ error: "Access denied" });
      }
    } else if (userRole !== "ADMIN") {
      return res.status(403).json({ error: "Access denied" });
    }

    // ── 3. Date filter ──
    const dateFilter = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) dateFilter.lte = new Date(dateTo);

    // ── 4. Fetch Submissions ──
    const submissions = await prisma.submission.findMany({
      where: {
        campaignId,
        ...(dateFrom || dateTo ? { submittedAt: dateFilter } : {}),
      },
      include: {
        promoter: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    // ── 5. Fetch Transactions (campaign-related) ──
    // Get the advertiser's wallet transactions for this campaign
    const advertiserUser = campaign.advertiser?.user;
    let transactions = [];
    if (advertiserUser) {
      const wallet = await prisma.wallet.findUnique({
        where: { userId: advertiserUser.id },
      });
      if (wallet) {
        transactions = await prisma.transaction.findMany({
          where: {
            walletId: wallet.id,
            type: { in: ["CAMPAIGN_PAYMENT", "PLATFORM_FEE"] },
            ...(dateFrom || dateTo ? { createdAt: dateFilter } : {}),
          },
          orderBy: { createdAt: "desc" },
        });
      }
    }

    // ── 6. Prepare data object ──
    const exportData = {
      campaign,
      analytics: campaign.analytics,
      submissions,
      transactions,
    };

    // ── 7. Generate & Send ──
    const safeName = campaign.title.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 40);
    const dateStr = new Date().toISOString().split("T")[0];

    if (format === "pdf") {
      const pdfBuffer = await generateCampaignPDF(exportData);
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ReachFlow_${safeName}_${dateStr}.pdf"`,
        "Content-Length": pdfBuffer.length,
      });
      return res.send(pdfBuffer);
    }

    // Default: Excel
    const excelBuffer = await generateCampaignExcel(exportData);
    res.set({
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="ReachFlow_${safeName}_${dateStr}.xlsx"`,
      "Content-Length": excelBuffer.length,
    });
    return res.send(excelBuffer);

  } catch (error) {
    console.error("Analytics export error:", error);
    res.status(500).json({ error: "Export failed", details: error.message });
  }
});

/**
 * GET /api/analytics/export/promoter/:promoterId
 * Promoter নিজের earnings history export করতে পারবে
 */
router.get("/export/promoter/:promoterId", async (req, res) => {
  try {
    const { promoterId } = req.params;
    const { format = "excel", dateFrom, dateTo } = req.query;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Auth check
    const promoter = await prisma.promoter.findUnique({
      where: { id: promoterId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (!promoter) return res.status(404).json({ error: "Promoter not found" });

    if (userRole === "PROMOTER" && promoter.userId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const dateFilter = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) dateFilter.lte = new Date(dateTo);

    const submissions = await prisma.submission.findMany({
      where: {
        promoterId,
        ...(dateFrom || dateTo ? { submittedAt: dateFilter } : {}),
      },
      include: {
        campaign: { select: { title: true, category: true, commissionType: true } },
      },
      orderBy: { submittedAt: "desc" },
    });

    const wallet = await prisma.wallet.findUnique({ where: { userId: promoter.userId } });
    const transactions = wallet
      ? await prisma.transaction.findMany({
          where: {
            walletId: wallet.id,
            type: { in: ["COMMISSION_EARNED", "WITHDRAWAL"] },
            ...(dateFrom || dateTo ? { createdAt: dateFilter } : {}),
          },
          orderBy: { createdAt: "desc" },
        })
      : [];

    // Build promoter report using ExcelJS
    const { generatePromoterExcel } = require("../utils/excelExport");
    
    const safeName = `Promoter_${promoter.user.name.replace(/[^a-zA-Z0-9]/g, "_")}`;
    const dateStr = new Date().toISOString().split("T")[0];

    if (format === "pdf") {
      // Simple: reuse campaign PDF with promoter context
      const { generatePromoterPDF } = require("../utils/pdfExport");
      const pdfBuffer = await generatePromoterPDF({ promoter, submissions, transactions, wallet });
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ReachFlow_${safeName}_${dateStr}.pdf"`,
      });
      return res.send(pdfBuffer);
    }

    const excelBuffer = await generatePromoterExcel({ promoter, submissions, transactions, wallet });
    res.set({
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="ReachFlow_${safeName}_${dateStr}.xlsx"`,
      "Content-Length": excelBuffer.length,
    });
    return res.send(excelBuffer);

  } catch (error) {
    console.error("Promoter export error:", error);
    res.status(500).json({ error: "Export failed", details: error.message });
  }
});

/**
 * GET /api/analytics/export/admin/overview
 * Admin: full platform overview export
 */
router.get("/export/admin/overview", async (req, res) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== "ADMIN") return res.status(403).json({ error: "Admin only" });

    const { format = "excel", dateFrom, dateTo } = req.query;
    const dateFilter = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) dateFilter.lte = new Date(dateTo);

    const [campaigns, users, transactions, withdrawals] = await Promise.all([
      prisma.campaign.findMany({
        include: { analytics: true, advertiser: { include: { user: { select: { name: true } } } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.findMany({ select: { id: true, name: true, role: true, status: true, createdAt: true } }),
      prisma.transaction.findMany({
        where: dateFrom || dateTo ? { createdAt: dateFilter } : {},
        orderBy: { createdAt: "desc" },
        take: 500,
      }),
      prisma.withdrawal.findMany({
        where: dateFrom || dateTo ? { createdAt: dateFilter } : {},
        include: { promoter: { include: { user: { select: { name: true } } } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const { generateAdminExcel } = require("../utils/excelExport");
    const excelBuffer = await generateAdminExcel({ campaigns, users, transactions, withdrawals });

    const dateStr = new Date().toISOString().split("T")[0];
    res.set({
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="ReachFlow_Admin_Overview_${dateStr}.xlsx"`,
      "Content-Length": excelBuffer.length,
    });
    return res.send(excelBuffer);

  } catch (error) {
    console.error("Admin export error:", error);
    res.status(500).json({ error: "Export failed", details: error.message });
  }
});

module.exports = router;
