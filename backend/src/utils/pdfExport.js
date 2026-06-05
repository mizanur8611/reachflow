// utils/pdfExport.js
const PDFDocument = require("pdfkit");

/**
 * Generate Campaign Analytics PDF
 * @param {Object} data - campaign analytics data
 * @returns {Buffer} PDF buffer
 */
async function generateCampaignPDF(data) {
  const { campaign, analytics, submissions, transactions } = data;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const buffers = [];

    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    // ─── Colors ───
    const C = {
      primary: "#6C63FF",
      dark: "#1A1A2E",
      mid: "#4A4A68",
      light: "#F5F5FF",
      accent: "#00C9A7",
      success: "#00C851",
      warning: "#FFBB33",
      danger: "#FF4444",
      white: "#FFFFFF",
      border: "#E0E0E0",
    };

    const PAGE_W = 515; // usable width

    // ══════════════════════════════
    // HELPER FUNCTIONS
    // ══════════════════════════════

    function hexToRgb(hex) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return [r, g, b];
    }

    function fillColor(hex) { doc.fillColor(hex); return hex; }
    function strokeColor(hex) { doc.strokeColor(hex); return hex; }

    function rect(x, y, w, h, color, radius = 0) {
      doc.roundedRect(x, y, w, h, radius).fill(color);
    }

    function hrLine(y, color = C.border) {
      doc.moveTo(40, y).lineTo(555, y).strokeColor(color).lineWidth(0.5).stroke();
    }

    // ── Page Header ──
    function pageHeader() {
      rect(0, 0, 595, 58, C.primary);
      doc.fontSize(18).fillColor(C.white).font("Helvetica-Bold")
        .text("ReachFlow", 40, 16);
      doc.fontSize(10).fillColor("rgba(255,255,255,0.8)").font("Helvetica")
        .text("Campaign Analytics Report", 40, 38);
      doc.fontSize(9).fillColor("rgba(255,255,255,0.7)")
        .text(`Generated: ${new Date().toLocaleString("en-BD")}`, 0, 22, { align: "right" });
      doc.y = 75;
    }

    // ── Section Title ──
    function sectionTitle(title, y) {
      const sY = y || doc.y + 12;
      rect(40, sY, PAGE_W, 26, C.dark, 4);
      doc.fontSize(11).fillColor(C.white).font("Helvetica-Bold")
        .text(title, 50, sY + 7, { width: PAGE_W - 20 });
      doc.y = sY + 34;
      return doc.y;
    }

    // ── KPI Card ──
    function kpiCard(x, y, w, label, value, color = C.primary) {
      rect(x, y, w, 56, C.light, 6);
      doc.rect(x, y, 4, 56).fill(color);
      doc.fontSize(8).fillColor(C.mid).font("Helvetica")
        .text(label.toUpperCase(), x + 10, y + 10, { width: w - 14 });
      doc.fontSize(18).fillColor(color).font("Helvetica-Bold")
        .text(value, x + 10, y + 24, { width: w - 14 });
    }

    // ── Table ──
    function table(headers, rows, startY, colWidths) {
      const ROW_H = 22;
      let y = startY || doc.y;

      // Check page space
      if (y + ROW_H * (rows.length + 2) > 780) {
        doc.addPage();
        pageHeader();
        y = doc.y;
      }

      const totalW = colWidths.reduce((a, b) => a + b, 0);

      // Header row
      rect(40, y, totalW, ROW_H, C.primary, 3);
      let xPos = 40;
      headers.forEach((h, i) => {
        doc.fontSize(8).fillColor(C.white).font("Helvetica-Bold")
          .text(h, xPos + 4, y + 7, { width: colWidths[i] - 8, align: "center" });
        xPos += colWidths[i];
      });
      y += ROW_H;

      // Data rows
      rows.forEach((row, rIdx) => {
        // Page break check
        if (y + ROW_H > 780) {
          doc.addPage();
          pageHeader();
          y = doc.y;
          // Repeat headers
          rect(40, y, totalW, ROW_H, C.primary, 3);
          xPos = 40;
          headers.forEach((h, i) => {
            doc.fontSize(8).fillColor(C.white).font("Helvetica-Bold")
              .text(h, xPos + 4, y + 7, { width: colWidths[i] - 8, align: "center" });
            xPos += colWidths[i];
          });
          y += ROW_H;
        }

        const rowBg = rIdx % 2 === 0 ? C.white : "#F9F9FF";
        rect(40, y, totalW, ROW_H, rowBg);
        hrLine(y + ROW_H);

        xPos = 40;
        row.forEach((cell, cIdx) => {
          const cellStr = String(cell ?? "-");

          // Status coloring
          let textColor = C.dark;
          if (["APPROVED", "COMPLETED", "ACTIVE"].includes(cellStr)) textColor = C.success;
          else if (["PENDING", "PAUSED"].includes(cellStr)) textColor = C.warning;
          else if (["REJECTED", "FAILED", "BANNED"].includes(cellStr)) textColor = C.danger;
          else if (["FLAGGED"].includes(cellStr)) textColor = "#FF6B35";

          doc.fontSize(8).fillColor(textColor).font(
            ["APPROVED","COMPLETED","ACTIVE","PENDING","PAUSED","REJECTED","FAILED","FLAGGED"].includes(cellStr)
              ? "Helvetica-Bold" : "Helvetica"
          ).text(cellStr, xPos + 4, y + 7, { width: colWidths[cIdx] - 8, align: "center", ellipsis: true });
          xPos += colWidths[cIdx];
        });
        y += ROW_H;
      });

      doc.y = y + 8;
    }

    // ════════════════════════════════════════
    // PAGE 1: Overview + KPIs
    // ════════════════════════════════════════
    pageHeader();

    // Campaign title
    doc.fontSize(16).fillColor(C.dark).font("Helvetica-Bold")
      .text(campaign.title, 40, doc.y, { width: PAGE_W });
    doc.fontSize(10).fillColor(C.mid).font("Helvetica")
      .text(`${campaign.category} • ${campaign.commissionType} • Status: ${campaign.status}`, 40, doc.y + 2);
    doc.y += 20;
    hrLine(doc.y);
    doc.y += 10;

    // Campaign Info grid
    sectionTitle("📋 Campaign Information");

    const infoItems = [
      ["Total Budget", `$${campaign.totalBudget?.toFixed(2)}`],
      ["Spent Budget", `$${campaign.spentBudget?.toFixed(2)}`],
      ["Commission", `$${campaign.commissionAmount} / ${campaign.commissionType}`],
      ["Max Promoters", campaign.maxPromoters],
      ["Start Date", new Date(campaign.startDate).toLocaleDateString("en-BD")],
      ["End Date", new Date(campaign.endDate).toLocaleDateString("en-BD")],
      ["Platforms", campaign.targetPlatforms?.join(", ") || "-"],
      ["Countries", campaign.targetCountries?.join(", ") || "-"],
    ];

    let infoY = doc.y;
    infoItems.forEach((item, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = col === 0 ? 40 : 300;
      const y = infoY + row * 22;
      doc.fontSize(8).fillColor(C.mid).font("Helvetica").text(item[0] + ":", x, y, { width: 120 });
      doc.fontSize(9).fillColor(C.dark).font("Helvetica-Bold").text(String(item[1]), x + 100, y, { width: 140 });
    });
    doc.y = infoY + Math.ceil(infoItems.length / 2) * 22 + 10;

    // KPI Cards
    sectionTitle("📈 Performance Summary");

    const kpis = [
      { label: "Total Reach", value: (analytics?.totalReach || 0).toLocaleString(), color: C.primary },
      { label: "Total Clicks", value: (analytics?.totalClicks || 0).toLocaleString(), color: C.accent },
      { label: "Conversions", value: (analytics?.totalConversions || 0).toLocaleString(), color: C.success },
      { label: "Total Spent", value: `$${(analytics?.totalSpent || 0).toFixed(2)}`, color: "#FF6B35" },
      { label: "ROI", value: `${(analytics?.roi || 0).toFixed(1)}%`, color: C.warning },
      { label: "Engagement", value: (analytics?.totalEngagement || 0).toLocaleString(), color: "#9C27B0" },
    ];

    const cardW = (PAGE_W - 20) / 3;
    const kpiStartY = doc.y;
    kpis.forEach((kpi, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      kpiCard(40 + col * (cardW + 10), kpiStartY + row * 66, cardW, kpi.label, kpi.value, kpi.color);
    });
    doc.y = kpiStartY + Math.ceil(kpis.length / 3) * 66 + 10;

    // ════════════════════════════════════════
    // PAGE 2: Promoter Performance
    // ════════════════════════════════════════
    doc.addPage();
    pageHeader();
    sectionTitle("👥 Promoter Performance");

    const promoterRows = (submissions || []).map((sub) => [
      sub.promoter?.user?.name?.substring(0, 16) || "Unknown",
      sub.platform || "-",
      sub.status,
      sub.clicks || 0,
      sub.reach || 0,
      sub.engagement || 0,
      sub.conversions || 0,
      `$${(sub.earnedAmount || 0).toFixed(2)}`,
      `${(sub.fraudScore || 0).toFixed(0)}%`,
    ]);

    table(
      ["Promoter", "Platform", "Status", "Clicks", "Reach", "Engagement", "Conv.", "Earned", "Fraud"],
      promoterRows,
      doc.y,
      [80, 65, 60, 50, 50, 65, 45, 55, 45]
    );

    // Summary totals
    if (submissions?.length) {
      const totY = doc.y + 4;
      rect(40, totY, PAGE_W, 24, C.dark, 3);
      const totals = [
        `Submissions: ${submissions.length}`,
        `Approved: ${submissions.filter((s) => s.status === "APPROVED").length}`,
        `Total Earned: $${submissions.reduce((s, x) => s + (x.earnedAmount || 0), 0).toFixed(2)}`,
        `Total Clicks: ${submissions.reduce((s, x) => s + (x.clicks || 0), 0).toLocaleString()}`,
      ];
      doc.fontSize(9).fillColor(C.white).font("Helvetica-Bold")
        .text(totals.join("   |   "), 50, totY + 8, { width: PAGE_W - 20, align: "center" });
      doc.y = totY + 32;
    }

    // ════════════════════════════════════════
    // PAGE 3: Platform & Daily Breakdown
    // ════════════════════════════════════════
    doc.addPage();
    pageHeader();
    sectionTitle("📱 Platform Breakdown");

    // Build platform data
    const platformMap = {};
    (submissions || []).forEach((sub) => {
      const p = sub.platform || "UNKNOWN";
      if (!platformMap[p]) platformMap[p] = { clicks: 0, reach: 0, conversions: 0, submissions: 0, earned: 0 };
      platformMap[p].clicks += sub.clicks || 0;
      platformMap[p].reach += sub.reach || 0;
      platformMap[p].conversions += sub.conversions || 0;
      platformMap[p].submissions += 1;
      platformMap[p].earned += sub.earnedAmount || 0;
    });

    const platformRows = Object.entries(platformMap).map(([p, d]) => [
      p, d.submissions, d.clicks, d.reach, d.conversions, `$${d.earned.toFixed(2)}`,
    ]);

    table(
      ["Platform", "Submissions", "Clicks", "Reach", "Conversions", "Total Earned"],
      platformRows.length ? platformRows : [["No data", "-", "-", "-", "-", "-"]],
      doc.y,
      [100, 80, 80, 80, 90, 85]
    );

    // Daily Performance
    sectionTitle("📅 Daily Performance");

    const byDay = analytics?.byDay || {};
    const dailyRows = Object.entries(byDay)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .slice(0, 30)
      .map(([date, d]) => [
        new Date(date).toLocaleDateString("en-BD"),
        d.clicks || 0,
        d.reach || 0,
        d.conversions || 0,
        `$${(d.spent || 0).toFixed(2)}`,
      ]);

    table(
      ["Date", "Clicks", "Reach", "Conversions", "Spent ($)"],
      dailyRows.length ? dailyRows : [["No daily data", "-", "-", "-", "-"]],
      doc.y,
      [120, 100, 100, 110, 85]
    );

    // ════════════════════════════════════════
    // PAGE 4: Transactions
    // ════════════════════════════════════════
    if (transactions?.length) {
      doc.addPage();
      pageHeader();
      sectionTitle("💳 Transaction History");

      const txRows = transactions.map((tx) => [
        new Date(tx.createdAt).toLocaleDateString("en-BD"),
        tx.type,
        `$${tx.amount?.toFixed(2)}`,
        tx.method,
        tx.status,
        (tx.description || "-").substring(0, 20),
      ]);

      table(
        ["Date", "Type", "Amount", "Method", "Status", "Description"],
        txRows,
        doc.y,
        [75, 90, 65, 80, 70, 135]
      );
    }

    // ── Footer on last page ──
    const footerY = 800;
    hrLine(footerY);
    doc.fontSize(8).fillColor(C.mid).font("Helvetica")
      .text("Generated by ReachFlow Analytics Engine  •  Confidential", 40, footerY + 6, {
        align: "center", width: PAGE_W,
      });

    doc.end();
  });
}


// ══════════════════════════════════════════════════════════════
// PROMOTER PDF EXPORT
// ══════════════════════════════════════════════════════════════

async function generatePromoterPDF(data) {
  const { promoter, submissions, transactions, wallet } = data;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const buffers = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    const C = {
      primary: "#6C63FF", dark: "#1A1A2E", mid: "#4A4A68",
      light: "#F5F5FF", accent: "#00C9A7", success: "#00C851",
      warning: "#FFBB33", danger: "#FF4444", white: "#FFFFFF", border: "#E0E0E0",
    };
    const PAGE_W = 515;

    function rect(x, y, w, h, color, radius = 0) {
      doc.roundedRect(x, y, w, h, radius).fill(color);
    }
    function hrLine(y) {
      doc.moveTo(40, y).lineTo(555, y).strokeColor(C.border).lineWidth(0.5).stroke();
    }
    function pageHeader() {
      rect(0, 0, 595, 58, C.accent);
      doc.fontSize(18).fillColor(C.white).font("Helvetica-Bold").text("ReachFlow", 40, 16);
      doc.fontSize(10).fillColor("rgba(255,255,255,0.85)").font("Helvetica").text("Promoter Earnings Report", 40, 38);
      doc.fontSize(9).fillColor("rgba(255,255,255,0.7)").text(`Generated: ${new Date().toLocaleString("en-BD")}`, 0, 22, { align: "right" });
      doc.y = 75;
    }
    function sectionTitle(title) {
      const sY = doc.y + 10;
      rect(40, sY, PAGE_W, 26, C.dark, 4);
      doc.fontSize(11).fillColor(C.white).font("Helvetica-Bold").text(title, 50, sY + 7, { width: PAGE_W - 20 });
      doc.y = sY + 34;
    }
    function kpiCard(x, y, w, label, value, color) {
      rect(x, y, w, 56, C.light, 6);
      doc.rect(x, y, 4, 56).fill(color);
      doc.fontSize(8).fillColor(C.mid).font("Helvetica").text(label.toUpperCase(), x + 10, y + 10, { width: w - 14 });
      doc.fontSize(17).fillColor(color).font("Helvetica-Bold").text(value, x + 10, y + 24, { width: w - 14 });
    }
    function table(headers, rows, colWidths) {
      const ROW_H = 22;
      let y = doc.y;
      if (y + ROW_H * (rows.length + 2) > 780) { doc.addPage(); pageHeader(); y = doc.y; }
      const totalW = colWidths.reduce((a, b) => a + b, 0);

      rect(40, y, totalW, ROW_H, C.accent, 3);
      let xPos = 40;
      headers.forEach((h, i) => {
        doc.fontSize(8).fillColor(C.white).font("Helvetica-Bold")
          .text(h, xPos + 4, y + 7, { width: colWidths[i] - 8, align: "center" });
        xPos += colWidths[i];
      });
      y += ROW_H;

      rows.forEach((row, rIdx) => {
        if (y + ROW_H > 780) {
          doc.addPage(); pageHeader(); y = doc.y;
          rect(40, y, totalW, ROW_H, C.accent, 3);
          xPos = 40;
          headers.forEach((h, i) => {
            doc.fontSize(8).fillColor(C.white).font("Helvetica-Bold")
              .text(h, xPos + 4, y + 7, { width: colWidths[i] - 8, align: "center" });
            xPos += colWidths[i];
          });
          y += ROW_H;
        }
        rect(40, y, totalW, ROW_H, rIdx % 2 === 0 ? C.white : "#F9F9FF");
        hrLine(y + ROW_H);
        xPos = 40;
        row.forEach((cell, cIdx) => {
          const cellStr = String(cell ?? "-");
          let textColor = C.dark;
          if (["APPROVED", "COMPLETED"].includes(cellStr)) textColor = C.success;
          else if (["PENDING"].includes(cellStr)) textColor = C.warning;
          else if (["REJECTED", "FAILED"].includes(cellStr)) textColor = C.danger;
          doc.fontSize(8).fillColor(textColor)
            .font(["APPROVED","COMPLETED","PENDING","REJECTED","FAILED"].includes(cellStr) ? "Helvetica-Bold" : "Helvetica")
            .text(cellStr, xPos + 4, y + 7, { width: colWidths[cIdx] - 8, align: "center", ellipsis: true });
          xPos += colWidths[cIdx];
        });
        y += ROW_H;
      });
      doc.y = y + 8;
    }

    // ── Page 1: Profile + KPIs ──
    pageHeader();
    doc.fontSize(16).fillColor(C.dark).font("Helvetica-Bold").text(promoter.user?.name || "Promoter", 40, doc.y);
    doc.fontSize(10).fillColor(C.mid).font("Helvetica")
      .text(`${promoter.country || "-"}  •  Niche: ${promoter.niche?.join(", ") || "-"}  •  Rating: ${promoter.rating || 0}/5`, 40, doc.y + 2);
    doc.y += 18;
    hrLine(doc.y);
    doc.y += 10;

    sectionTitle("👤 Profile Summary");
    const infoItems = [
      ["Email", promoter.user?.email || "-"], ["Verified", promoter.verified ? "Yes" : "No"],
      ["Total Followers", (promoter.totalFollowers || 0).toLocaleString()], ["Avg Engagement", `${promoter.avgEngagement || 0}%`],
      ["Wallet Balance", `$${(wallet?.balance || 0).toFixed(2)}`], ["Pending Balance", `$${(wallet?.pending || 0).toFixed(2)}`],
      ["Lifetime Earned", `$${(wallet?.totalEarned || 0).toFixed(2)}`], ["Total Earned", `$${(promoter.totalEarned || 0).toFixed(2)}`],
    ];
    let infoY = doc.y;
    infoItems.forEach(([label, value], i) => {
      const col = i % 2, x = col === 0 ? 40 : 300, y = infoY + Math.floor(i / 2) * 22;
      doc.fontSize(8).fillColor(C.mid).font("Helvetica").text(label + ":", x, y, { width: 110 });
      doc.fontSize(9).fillColor(C.dark).font("Helvetica-Bold").text(String(value), x + 100, y, { width: 140 });
    });
    doc.y = infoY + Math.ceil(infoItems.length / 2) * 22 + 10;

    sectionTitle("📈 Performance KPIs");
    const totalEarned   = submissions?.reduce((s, x) => s + (x.earnedAmount || 0), 0) || 0;
    const totalClicks   = submissions?.reduce((s, x) => s + (x.clicks || 0), 0) || 0;
    const totalReach    = submissions?.reduce((s, x) => s + (x.reach || 0), 0) || 0;
    const approvedCount = submissions?.filter((s) => s.status === "APPROVED").length || 0;

    const kpis = [
      { label: "Total Submissions", value: String(submissions?.length || 0), color: C.primary },
      { label: "Approved",          value: String(approvedCount),             color: C.success },
      { label: "Total Earned",      value: `$${totalEarned.toFixed(2)}`,      color: "#FF6B35" },
      { label: "Total Clicks",      value: totalClicks.toLocaleString(),      color: C.accent },
      { label: "Total Reach",       value: totalReach.toLocaleString(),       color: "#9C27B0" },
      { label: "Avg Per Post",      value: `$${submissions?.length ? (totalEarned / submissions.length).toFixed(2) : "0.00"}`, color: C.warning },
    ];
    const cardW = (PAGE_W - 20) / 3;
    const kpiStartY = doc.y;
    kpis.forEach((kpi, i) => {
      kpiCard(40 + (i % 3) * (cardW + 10), kpiStartY + Math.floor(i / 3) * 66, cardW, kpi.label, kpi.value, kpi.color);
    });
    doc.y = kpiStartY + Math.ceil(kpis.length / 3) * 66 + 10;

    // ── Page 2: Submissions ──
    doc.addPage();
    pageHeader();
    sectionTitle("📋 Campaign Submissions");
    const subRows = (submissions || []).map((s) => [
      s.campaign?.title?.substring(0, 16) || "-",
      s.platform || "-", s.status,
      s.clicks || 0, s.reach || 0, s.conversions || 0,
      `$${(s.earnedAmount || 0).toFixed(2)}`,
      new Date(s.submittedAt).toLocaleDateString("en-BD"),
    ]);
    table(["Campaign", "Platform", "Status", "Clicks", "Reach", "Conv.", "Earned", "Date"],
          subRows.length ? subRows : [["No submissions", "-", "-", "-", "-", "-", "-", "-"]],
          [90, 65, 60, 50, 50, 45, 60, 75]);

    // ── Transactions ──
    if (transactions?.length) {
      sectionTitle("💰 Earnings & Withdrawal History");
      const txRows = transactions.map((tx) => [
        new Date(tx.createdAt).toLocaleDateString("en-BD"),
        tx.type, `$${(tx.amount || 0).toFixed(2)}`, tx.method, tx.status,
      ]);
      table(["Date", "Type", "Amount", "Method", "Status"], txRows, [85, 120, 70, 90, 80]);
    }

    // Footer
    hrLine(800);
    doc.fontSize(8).fillColor(C.mid).font("Helvetica")
      .text("Generated by ReachFlow Analytics Engine  •  Confidential", 40, 806, { align: "center", width: PAGE_W });

    doc.end();
  });
}

module.exports = { generateCampaignPDF, generatePromoterPDF };
