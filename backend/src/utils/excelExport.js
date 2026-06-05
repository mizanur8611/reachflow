// utils/excelExport.js
const ExcelJS = require("exceljs");

/**
 * Generate Campaign Analytics Excel
 * @param {Object} data - campaign analytics data
 * @returns {Buffer} Excel file buffer
 */
async function generateCampaignExcel(data) {
  const { campaign, analytics, submissions, transactions, trackingLinks } = data;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ReachFlow";
  workbook.created = new Date();

  // ─── Color Palette ───
  const COLORS = {
    primary: "FF6C63FF",     // ReachFlow purple
    header: "FF2D2D2D",      // Dark header
    subheader: "FF4A4A4A",
    accent: "FF00C9A7",      // Teal accent
    lightBg: "FFF5F5FF",
    white: "FFFFFFFF",
    border: "FFE0E0E0",
    success: "FF00C851",
    warning: "FFFFBB33",
    danger: "FFFF4444",
    textDark: "FF1A1A2E",
    textMid: "FF4A4A68",
  };

  // ─── Helper: Style Header Row ───
  function styleHeaderRow(row, bgColor = COLORS.primary) {
    row.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
      cell.font = { bold: true, color: { argb: COLORS.white }, size: 11 };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.border = {
        top: { style: "thin", color: { argb: COLORS.border } },
        bottom: { style: "thin", color: { argb: COLORS.border } },
        left: { style: "thin", color: { argb: COLORS.border } },
        right: { style: "thin", color: { argb: COLORS.border } },
      };
    });
    row.height = 32;
  }

  // ─── Helper: Style Data Row ───
  function styleDataRow(row, isEven = false) {
    row.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: isEven ? "FFF9F9FF" : COLORS.white },
      };
      cell.font = { color: { argb: COLORS.textDark }, size: 10 };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        bottom: { style: "hair", color: { argb: COLORS.border } },
        left: { style: "hair", color: { argb: COLORS.border } },
        right: { style: "hair", color: { argb: COLORS.border } },
      };
    });
    row.height = 24;
  }

  // ─── Helper: Add Title Block ───
  function addTitleBlock(sheet, title, subtitle, colSpan = 6) {
    sheet.mergeCells(`A1:${String.fromCharCode(64 + colSpan)}1`);
    const titleCell = sheet.getCell("A1");
    titleCell.value = title;
    titleCell.font = { bold: true, size: 16, color: { argb: COLORS.white } };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.primary } };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    sheet.getRow(1).height = 42;

    sheet.mergeCells(`A2:${String.fromCharCode(64 + colSpan)}2`);
    const subCell = sheet.getCell("A2");
    subCell.value = subtitle;
    subCell.font = { size: 10, color: { argb: COLORS.textMid }, italic: true };
    subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.lightBg } };
    subCell.alignment = { vertical: "middle", horizontal: "center" };
    sheet.getRow(2).height = 22;
  }

  // ══════════════════════════════════════════
  // SHEET 1: Campaign Overview
  // ══════════════════════════════════════════
  const overviewSheet = workbook.addWorksheet("📊 Overview", {
    pageSetup: { fitToPage: true, fitToWidth: 1 },
  });
  overviewSheet.columns = [
    { key: "label", width: 28 },
    { key: "value", width: 30 },
    { key: "spacer", width: 4 },
    { key: "label2", width: 28 },
    { key: "value2", width: 30 },
  ];

  addTitleBlock(overviewSheet, "📊 ReachFlow — Campaign Overview", `Generated: ${new Date().toLocaleString("en-BD")}`, 5);

  // Campaign info pairs
  const overviewData = [
    ["Campaign Title", campaign.title, "", "Status", campaign.status],
    ["Category", campaign.category, "", "Commission Type", campaign.commissionType],
    ["Commission Amount", `$${campaign.commissionAmount}`, "", "Max Promoters", campaign.maxPromoters],
    ["Total Budget", `$${campaign.totalBudget}`, "", "Spent Budget", `$${campaign.spentBudget}`],
    ["Start Date", new Date(campaign.startDate).toLocaleDateString("en-BD"), "", "End Date", new Date(campaign.endDate).toLocaleDateString("en-BD")],
    ["Target Platforms", campaign.targetPlatforms?.join(", ") || "-", "", "Target Countries", campaign.targetCountries?.join(", ") || "-"],
    ["Hashtags", campaign.hashtags?.join(" ") || "-", "", "AI Score", campaign.aiScore ? `${campaign.aiScore}/100` : "N/A"],
  ];

  overviewSheet.addRow([]); // spacer
  overviewData.forEach(([l1, v1, , l2, v2], i) => {
    const row = overviewSheet.addRow([l1, v1, "", l2, v2]);
    row.getCell(1).font = { bold: true, color: { argb: COLORS.textMid }, size: 10 };
    row.getCell(2).font = { bold: true, color: { argb: COLORS.textDark }, size: 10 };
    row.getCell(4).font = { bold: true, color: { argb: COLORS.textMid }, size: 10 };
    row.getCell(5).font = { bold: true, color: { argb: COLORS.textDark }, size: 10 };
    [1, 2, 4, 5].forEach((c) => {
      row.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: i % 2 === 0 ? COLORS.white : "FFF5F5FF" } };
      row.getCell(c).alignment = { vertical: "middle", horizontal: "left" };
      row.getCell(c).border = { bottom: { style: "hair", color: { argb: COLORS.border } } };
    });
    row.height = 24;
  });

  // ── Performance KPIs ──
  overviewSheet.addRow([]);
  const kpiTitleRow = overviewSheet.addRow(["📈 Performance Summary"]);
  overviewSheet.mergeCells(`A${kpiTitleRow.number}:E${kpiTitleRow.number}`);
  kpiTitleRow.getCell(1).font = { bold: true, size: 12, color: { argb: COLORS.white } };
  kpiTitleRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.header } };
  kpiTitleRow.getCell(1).alignment = { vertical: "middle", horizontal: "left" };
  kpiTitleRow.height = 30;

  const kpiHeaders = overviewSheet.addRow(["Metric", "Value", "", "Metric", "Value"]);
  styleHeaderRow(kpiHeaders, COLORS.accent);

  const kpiData = [
    ["Total Reach", analytics?.totalReach?.toLocaleString() || "0", "", "Total Clicks", analytics?.totalClicks?.toLocaleString() || "0"],
    ["Total Engagement", analytics?.totalEngagement?.toLocaleString() || "0", "", "Total Conversions", analytics?.totalConversions?.toLocaleString() || "0"],
    ["Total Spent", `$${analytics?.totalSpent?.toFixed(2) || "0.00"}`, "", "ROI", `${analytics?.roi?.toFixed(2) || "0"}%`],
    ["Total Submissions", submissions?.length?.toString() || "0", "", "Approved Submissions", submissions?.filter((s) => s.status === "APPROVED").length?.toString() || "0"],
  ];
  kpiData.forEach(([l1, v1, , l2, v2], i) => {
    const row = overviewSheet.addRow([l1, v1, "", l2, v2]);
    styleDataRow(row, i % 2 === 0);
    row.getCell(1).font = { bold: true, color: { argb: COLORS.textMid }, size: 10 };
    row.getCell(4).font = { bold: true, color: { argb: COLORS.textMid }, size: 10 };
    row.getCell(2).font = { bold: true, color: { argb: COLORS.primary }, size: 11 };
    row.getCell(5).font = { bold: true, color: { argb: COLORS.primary }, size: 11 };
  });

  // ══════════════════════════════════════════
  // SHEET 2: Promoter Performance
  // ══════════════════════════════════════════
  const promoterSheet = workbook.addWorksheet("👥 Promoter Performance");
  promoterSheet.columns = [
    { key: "name", width: 22 },
    { key: "platform", width: 14 },
    { key: "postUrl", width: 32 },
    { key: "status", width: 14 },
    { key: "clicks", width: 12 },
    { key: "reach", width: 12 },
    { key: "engagement", width: 14 },
    { key: "conversions", width: 14 },
    { key: "earned", width: 14 },
    { key: "fraudScore", width: 13 },
    { key: "submittedAt", width: 18 },
  ];

  addTitleBlock(promoterSheet, "👥 Promoter Performance", `Campaign: ${campaign.title}`, 11);
  promoterSheet.addRow([]);

  const pHeaders = promoterSheet.addRow([
    "Promoter", "Platform", "Post URL", "Status",
    "Clicks", "Reach", "Engagement", "Conversions",
    "Earned ($)", "Fraud Score", "Submitted At",
  ]);
  styleHeaderRow(pHeaders);

  submissions?.forEach((sub, i) => {
    const row = promoterSheet.addRow([
      sub.promoter?.user?.name || "Unknown",
      sub.platform || "-",
      sub.postUrl,
      sub.status,
      sub.clicks,
      sub.reach,
      sub.engagement,
      sub.conversions,
      sub.earnedAmount?.toFixed(2),
      sub.fraudScore?.toFixed(1),
      new Date(sub.submittedAt).toLocaleDateString("en-BD"),
    ]);
    styleDataRow(row, i % 2 === 0);

    // Color status cell
    const statusCell = row.getCell(4);
    const statusColors = {
      APPROVED: COLORS.success,
      PENDING: COLORS.warning,
      REJECTED: COLORS.danger,
      FLAGGED: "FFFF6B35",
    };
    statusCell.font = { bold: true, color: { argb: statusColors[sub.status] || COLORS.textDark }, size: 10 };

    // Color fraud score
    const fraudCell = row.getCell(10);
    if (sub.fraudScore > 70) fraudCell.font = { bold: true, color: { argb: COLORS.danger }, size: 10 };
    else if (sub.fraudScore > 40) fraudCell.font = { bold: true, color: { argb: COLORS.warning }, size: 10 };
    else fraudCell.font = { bold: true, color: { argb: COLORS.success }, size: 10 };
  });

  // Totals row
  if (submissions?.length) {
    const totalsRow = promoterSheet.addRow([
      "TOTAL", "", "", "",
      submissions.reduce((s, x) => s + (x.clicks || 0), 0),
      submissions.reduce((s, x) => s + (x.reach || 0), 0),
      submissions.reduce((s, x) => s + (x.engagement || 0), 0),
      submissions.reduce((s, x) => s + (x.conversions || 0), 0),
      submissions.reduce((s, x) => s + (x.earnedAmount || 0), 0).toFixed(2),
      "", "",
    ]);
    totalsRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.header } };
      cell.font = { bold: true, color: { argb: COLORS.white }, size: 10 };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });
    totalsRow.height = 26;
  }

  // ══════════════════════════════════════════
  // SHEET 3: Platform Breakdown
  // ══════════════════════════════════════════
  const platformSheet = workbook.addWorksheet("📱 Platform Breakdown");
  platformSheet.columns = [
    { key: "platform", width: 18 },
    { key: "clicks", width: 14 },
    { key: "reach", width: 14 },
    { key: "engagement", width: 16 },
    { key: "conversions", width: 16 },
    { key: "submissions", width: 16 },
    { key: "earned", width: 16 },
  ];

  addTitleBlock(platformSheet, "📱 Platform Breakdown", `Campaign: ${campaign.title}`, 7);
  platformSheet.addRow([]);

  const platHeaders = platformSheet.addRow(["Platform", "Clicks", "Reach", "Engagement", "Conversions", "Submissions", "Total Earned ($)"]);
  styleHeaderRow(platHeaders);

  // Group by platform
  const byPlatform = analytics?.byPlatform || {};
  const platformData = Object.entries(byPlatform).length
    ? Object.entries(byPlatform)
    : // Fallback: calculate from submissions
      Object.entries(
        submissions?.reduce((acc, sub) => {
          const p = sub.platform || "UNKNOWN";
          if (!acc[p]) acc[p] = { clicks: 0, reach: 0, engagement: 0, conversions: 0, submissions: 0, earned: 0 };
          acc[p].clicks += sub.clicks || 0;
          acc[p].reach += sub.reach || 0;
          acc[p].engagement += sub.engagement || 0;
          acc[p].conversions += sub.conversions || 0;
          acc[p].submissions += 1;
          acc[p].earned += sub.earnedAmount || 0;
          return acc;
        }, {}) || {}
      );

  platformData.forEach(([platform, d], i) => {
    const row = platformSheet.addRow([
      platform,
      d.clicks || 0,
      d.reach || 0,
      d.engagement || 0,
      d.conversions || 0,
      d.submissions || 0,
      (d.earned || 0).toFixed(2),
    ]);
    styleDataRow(row, i % 2 === 0);
    row.getCell(1).font = { bold: true, color: { argb: COLORS.primary }, size: 11 };
  });

  // ══════════════════════════════════════════
  // SHEET 4: Daily Performance
  // ══════════════════════════════════════════
  const dailySheet = workbook.addWorksheet("📅 Daily Performance");
  dailySheet.columns = [
    { key: "date", width: 18 },
    { key: "clicks", width: 14 },
    { key: "reach", width: 14 },
    { key: "conversions", width: 16 },
    { key: "spent", width: 16 },
  ];

  addTitleBlock(dailySheet, "📅 Daily Performance", `Campaign: ${campaign.title}`, 5);
  dailySheet.addRow([]);

  const dailyHeaders = dailySheet.addRow(["Date", "Clicks", "Reach", "Conversions", "Spent ($)"]);
  styleHeaderRow(dailyHeaders);

  const byDay = analytics?.byDay || {};
  const dailyEntries = Object.entries(byDay).sort(([a], [b]) => new Date(a) - new Date(b));

  if (dailyEntries.length) {
    dailyEntries.forEach(([date, d], i) => {
      const row = dailySheet.addRow([
        new Date(date).toLocaleDateString("en-BD"),
        d.clicks || 0,
        d.reach || 0,
        d.conversions || 0,
        (d.spent || 0).toFixed(2),
      ]);
      styleDataRow(row, i % 2 === 0);
    });
  } else {
    const noDataRow = dailySheet.addRow(["No daily data available", "", "", "", ""]);
    dailySheet.mergeCells(`A${noDataRow.number}:E${noDataRow.number}`);
    noDataRow.getCell(1).font = { italic: true, color: { argb: COLORS.textMid } };
    noDataRow.getCell(1).alignment = { horizontal: "center" };
  }

  // ══════════════════════════════════════════
  // SHEET 5: Transaction History
  // ══════════════════════════════════════════
  const txSheet = workbook.addWorksheet("💳 Transactions");
  txSheet.columns = [
    { key: "date", width: 18 },
    { key: "type", width: 20 },
    { key: "amount", width: 14 },
    { key: "method", width: 16 },
    { key: "status", width: 14 },
    { key: "description", width: 30 },
  ];

  addTitleBlock(txSheet, "💳 Transaction History", `Campaign: ${campaign.title}`, 6);
  txSheet.addRow([]);

  const txHeaders = txSheet.addRow(["Date", "Type", "Amount ($)", "Method", "Status", "Description"]);
  styleHeaderRow(txHeaders);

  transactions?.forEach((tx, i) => {
    const row = txSheet.addRow([
      new Date(tx.createdAt).toLocaleDateString("en-BD"),
      tx.type,
      tx.amount?.toFixed(2),
      tx.method,
      tx.status,
      tx.description || "-",
    ]);
    styleDataRow(row, i % 2 === 0);

    const statusCell = row.getCell(5);
    const txColors = { COMPLETED: COLORS.success, PENDING: COLORS.warning, FAILED: COLORS.danger, REFUNDED: "FF9C27B0" };
    statusCell.font = { bold: true, color: { argb: txColors[tx.status] || COLORS.textDark }, size: 10 };
  });

  // ── Return buffer ──
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}


// ══════════════════════════════════════════════════════════════
// PROMOTER EXCEL EXPORT
// ══════════════════════════════════════════════════════════════

async function generatePromoterExcel(data) {
  const { promoter, submissions, transactions, wallet } = data;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ReachFlow";
  workbook.created = new Date();

  const COLORS = {
    primary:   "FF6C63FF",
    header:    "FF2D2D2D",
    accent:    "FF00C9A7",
    lightBg:   "FFF5F5FF",
    white:     "FFFFFFFF",
    border:    "FFE0E0E0",
    success:   "FF00C851",
    warning:   "FFFFBB33",
    danger:    "FFFF4444",
    textDark:  "FF1A1A2E",
    textMid:   "FF4A4A68",
  };

  function styleHeaderRow(row, bgColor = COLORS.primary) {
    row.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
      cell.font = { bold: true, color: { argb: COLORS.white }, size: 11 };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.border = {
        top:    { style: "thin", color: { argb: COLORS.border } },
        bottom: { style: "thin", color: { argb: COLORS.border } },
        left:   { style: "thin", color: { argb: COLORS.border } },
        right:  { style: "thin", color: { argb: COLORS.border } },
      };
    });
    row.height = 32;
  }

  function styleDataRow(row, isEven = false) {
    row.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: isEven ? "FFF9F9FF" : COLORS.white } };
      cell.font = { color: { argb: COLORS.textDark }, size: 10 };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        bottom: { style: "hair", color: { argb: COLORS.border } },
        left:   { style: "hair", color: { argb: COLORS.border } },
        right:  { style: "hair", color: { argb: COLORS.border } },
      };
    });
    row.height = 24;
  }

  function addTitleBlock(sheet, title, subtitle, colSpan = 6) {
    sheet.mergeCells(`A1:${String.fromCharCode(64 + colSpan)}1`);
    const titleCell = sheet.getCell("A1");
    titleCell.value = title;
    titleCell.font = { bold: true, size: 16, color: { argb: COLORS.white } };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.primary } };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    sheet.getRow(1).height = 42;

    sheet.mergeCells(`A2:${String.fromCharCode(64 + colSpan)}2`);
    const subCell = sheet.getCell("A2");
    subCell.value = subtitle;
    subCell.font = { size: 10, color: { argb: COLORS.textMid }, italic: true };
    subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.lightBg } };
    subCell.alignment = { vertical: "middle", horizontal: "center" };
    sheet.getRow(2).height = 22;
  }

  // ── Sheet 1: Promoter Profile & Summary ──
  const profileSheet = workbook.addWorksheet("👤 Profile & Summary");
  profileSheet.columns = [
    { key: "label", width: 26 },
    { key: "value", width: 30 },
    { key: "spacer", width: 4 },
    { key: "label2", width: 26 },
    { key: "value2", width: 30 },
  ];

  addTitleBlock(profileSheet, "👤 ReachFlow — Promoter Earnings Report", `Generated: ${new Date().toLocaleString("en-BD")}`, 5);
  profileSheet.addRow([]);

  const profileData = [
    ["Name",          promoter.user?.name || "-",             "", "Email",          promoter.user?.email || "-"],
    ["Country",       promoter.country || "-",                "", "Verified",        promoter.verified ? "✅ Yes" : "❌ No"],
    ["Niche",         promoter.niche?.join(", ") || "-",      "", "Rating",          `${promoter.rating || 0} / 5`],
    ["Total Followers", (promoter.totalFollowers || 0).toLocaleString(), "", "Avg Engagement", `${promoter.avgEngagement || 0}%`],
    ["Total Earned",  `$${(promoter.totalEarned || 0).toFixed(2)}`, "", "Wallet Balance", `$${(wallet?.balance || 0).toFixed(2)}`],
    ["Pending Balance", `$${(wallet?.pending || 0).toFixed(2)}`, "", "Lifetime Earned", `$${(wallet?.totalEarned || 0).toFixed(2)}`],
  ];

  profileData.forEach(([l1, v1, , l2, v2], i) => {
    const row = profileSheet.addRow([l1, v1, "", l2, v2]);
    row.getCell(1).font = { bold: true, color: { argb: COLORS.textMid }, size: 10 };
    row.getCell(2).font = { bold: true, color: { argb: COLORS.textDark }, size: 11 };
    row.getCell(4).font = { bold: true, color: { argb: COLORS.textMid }, size: 10 };
    row.getCell(5).font = { bold: true, color: { argb: COLORS.textDark }, size: 11 };
    [1, 2, 4, 5].forEach((c) => {
      row.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: i % 2 === 0 ? COLORS.white : "FFF5F5FF" } };
      row.getCell(c).alignment = { vertical: "middle", horizontal: "left" };
      row.getCell(c).border = { bottom: { style: "hair", color: { argb: COLORS.border } } };
    });
    row.height = 26;
  });

  // KPI summary
  profileSheet.addRow([]);
  const kpiTitleRow = profileSheet.addRow(["📈 Campaign Performance Summary"]);
  profileSheet.mergeCells(`A${kpiTitleRow.number}:E${kpiTitleRow.number}`);
  kpiTitleRow.getCell(1).font = { bold: true, size: 12, color: { argb: COLORS.white } };
  kpiTitleRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.header } };
  kpiTitleRow.getCell(1).alignment = { vertical: "middle", horizontal: "left" };
  kpiTitleRow.height = 30;

  const kpiHeaders = profileSheet.addRow(["Metric", "Value", "", "Metric", "Value"]);
  styleHeaderRow(kpiHeaders, COLORS.accent);

  const totalClicks       = submissions?.reduce((s, x) => s + (x.clicks || 0), 0) || 0;
  const totalReach        = submissions?.reduce((s, x) => s + (x.reach || 0), 0) || 0;
  const totalEngagement   = submissions?.reduce((s, x) => s + (x.engagement || 0), 0) || 0;
  const totalConversions  = submissions?.reduce((s, x) => s + (x.conversions || 0), 0) || 0;
  const totalEarned       = submissions?.reduce((s, x) => s + (x.earnedAmount || 0), 0) || 0;
  const approvedCount     = submissions?.filter((s) => s.status === "APPROVED").length || 0;

  const kpiData = [
    ["Total Submissions",  submissions?.length?.toString() || "0", "", "Approved",       approvedCount.toString()],
    ["Total Clicks",       totalClicks.toLocaleString(),            "", "Total Reach",    totalReach.toLocaleString()],
    ["Total Engagement",   totalEngagement.toLocaleString(),        "", "Conversions",    totalConversions.toLocaleString()],
    ["Total Earned",       `$${totalEarned.toFixed(2)}`,            "", "Avg Per Post",   `$${submissions?.length ? (totalEarned / submissions.length).toFixed(2) : "0.00"}`],
  ];

  kpiData.forEach(([l1, v1, , l2, v2], i) => {
    const row = profileSheet.addRow([l1, v1, "", l2, v2]);
    styleDataRow(row, i % 2 === 0);
    row.getCell(1).font = { bold: true, color: { argb: COLORS.textMid }, size: 10 };
    row.getCell(4).font = { bold: true, color: { argb: COLORS.textMid }, size: 10 };
    row.getCell(2).font = { bold: true, color: { argb: COLORS.primary }, size: 12 };
    row.getCell(5).font = { bold: true, color: { argb: COLORS.primary }, size: 12 };
  });

  // ── Sheet 2: Campaign Submissions ──
  const subSheet = workbook.addWorksheet("📋 Submissions");
  subSheet.columns = [
    { key: "campaign",    width: 24 },
    { key: "platform",    width: 14 },
    { key: "status",      width: 14 },
    { key: "postUrl",     width: 30 },
    { key: "clicks",      width: 12 },
    { key: "reach",       width: 12 },
    { key: "engagement",  width: 14 },
    { key: "conversions", width: 14 },
    { key: "earned",      width: 14 },
    { key: "date",        width: 18 },
  ];

  addTitleBlock(subSheet, "📋 Campaign Submissions", `Promoter: ${promoter.user?.name}`, 10);
  subSheet.addRow([]);

  const subHeaders = subSheet.addRow(["Campaign", "Platform", "Status", "Post URL", "Clicks", "Reach", "Engagement", "Conversions", "Earned ($)", "Submitted"]);
  styleHeaderRow(subHeaders);

  submissions?.forEach((sub, i) => {
    const row = subSheet.addRow([
      sub.campaign?.title?.substring(0, 22) || "-",
      sub.platform || "-",
      sub.status,
      sub.postUrl,
      sub.clicks || 0,
      sub.reach || 0,
      sub.engagement || 0,
      sub.conversions || 0,
      (sub.earnedAmount || 0).toFixed(2),
      new Date(sub.submittedAt).toLocaleDateString("en-BD"),
    ]);
    styleDataRow(row, i % 2 === 0);

    const statusCell = row.getCell(3);
    const statusColors = { APPROVED: COLORS.success, PENDING: COLORS.warning, REJECTED: COLORS.danger, FLAGGED: "FFFF6B35" };
    statusCell.font = { bold: true, color: { argb: statusColors[sub.status] || COLORS.textDark }, size: 10 };
  });

  // Totals
  if (submissions?.length) {
    const totRow = subSheet.addRow(["TOTAL", "", "", "", totalClicks, totalReach, totalEngagement, totalConversions, totalEarned.toFixed(2), ""]);
    totRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.header } };
      cell.font = { bold: true, color: { argb: COLORS.white }, size: 10 };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });
    totRow.height = 26;
  }

  // ── Sheet 3: Earnings History (Transactions) ──
  const earningsSheet = workbook.addWorksheet("💰 Earnings & Withdrawals");
  earningsSheet.columns = [
    { key: "date",        width: 18 },
    { key: "type",        width: 22 },
    { key: "amount",      width: 14 },
    { key: "method",      width: 16 },
    { key: "status",      width: 14 },
    { key: "description", width: 30 },
  ];

  addTitleBlock(earningsSheet, "💰 Earnings & Withdrawal History", `Promoter: ${promoter.user?.name}`, 6);
  earningsSheet.addRow([]);

  const earnHeaders = earningsSheet.addRow(["Date", "Type", "Amount ($)", "Method", "Status", "Description"]);
  styleHeaderRow(earnHeaders);

  transactions?.forEach((tx, i) => {
    const row = earningsSheet.addRow([
      new Date(tx.createdAt).toLocaleDateString("en-BD"),
      tx.type,
      (tx.amount || 0).toFixed(2),
      tx.method,
      tx.status,
      tx.description || "-",
    ]);
    styleDataRow(row, i % 2 === 0);

    const typeCell = row.getCell(2);
    if (tx.type === "COMMISSION_EARNED") typeCell.font = { bold: true, color: { argb: COLORS.success }, size: 10 };
    else if (tx.type === "WITHDRAWAL") typeCell.font = { bold: true, color: { argb: "FFFF6B35" }, size: 10 };

    const statusCell = row.getCell(5);
    const txColors = { COMPLETED: COLORS.success, PENDING: COLORS.warning, FAILED: COLORS.danger };
    statusCell.font = { bold: true, color: { argb: txColors[tx.status] || COLORS.textDark }, size: 10 };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

// ══════════════════════════════════════════════════════════════
// ADMIN OVERVIEW EXCEL EXPORT
// ══════════════════════════════════════════════════════════════

async function generateAdminExcel(data) {
  const { campaigns, users, transactions, withdrawals } = data;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ReachFlow";
  workbook.created = new Date();

  const COLORS = {
    primary:  "FF6C63FF",
    header:   "FF2D2D2D",
    accent:   "FF00C9A7",
    lightBg:  "FFF5F5FF",
    white:    "FFFFFFFF",
    border:   "FFE0E0E0",
    success:  "FF00C851",
    warning:  "FFFFBB33",
    danger:   "FFFF4444",
    textDark: "FF1A1A2E",
    textMid:  "FF4A4A68",
  };

  function styleHeaderRow(row, bgColor = COLORS.primary) {
    row.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
      cell.font = { bold: true, color: { argb: COLORS.white }, size: 11 };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.border = {
        top:    { style: "thin", color: { argb: COLORS.border } },
        bottom: { style: "thin", color: { argb: COLORS.border } },
        left:   { style: "thin", color: { argb: COLORS.border } },
        right:  { style: "thin", color: { argb: COLORS.border } },
      };
    });
    row.height = 32;
  }

  function styleDataRow(row, isEven = false) {
    row.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: isEven ? "FFF9F9FF" : COLORS.white } };
      cell.font = { color: { argb: COLORS.textDark }, size: 10 };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        bottom: { style: "hair", color: { argb: COLORS.border } },
        left:   { style: "hair", color: { argb: COLORS.border } },
        right:  { style: "hair", color: { argb: COLORS.border } },
      };
    });
    row.height = 24;
  }

  function addTitleBlock(sheet, title, subtitle, colSpan = 6) {
    sheet.mergeCells(`A1:${String.fromCharCode(64 + colSpan)}1`);
    const titleCell = sheet.getCell("A1");
    titleCell.value = title;
    titleCell.font = { bold: true, size: 16, color: { argb: COLORS.white } };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.primary } };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    sheet.getRow(1).height = 42;

    sheet.mergeCells(`A2:${String.fromCharCode(64 + colSpan)}2`);
    const subCell = sheet.getCell("A2");
    subCell.value = subtitle;
    subCell.font = { size: 10, color: { argb: COLORS.textMid }, italic: true };
    subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.lightBg } };
    subCell.alignment = { vertical: "middle", horizontal: "center" };
    sheet.getRow(2).height = 22;
  }

  // ── Sheet 1: Platform Overview KPIs ──
  const overviewSheet = workbook.addWorksheet("🏠 Platform Overview");
  overviewSheet.columns = [
    { key: "label", width: 28 },
    { key: "value", width: 24 },
    { key: "spacer", width: 4 },
    { key: "label2", width: 28 },
    { key: "value2", width: 24 },
  ];

  addTitleBlock(overviewSheet, "🏠 ReachFlow — Admin Platform Overview", `Generated: ${new Date().toLocaleString("en-BD")}`, 5);
  overviewSheet.addRow([]);

  // Computed stats
  const totalUsers        = users?.length || 0;
  const totalAdvertisers  = users?.filter((u) => u.role === "ADVERTISER").length || 0;
  const totalPromoters    = users?.filter((u) => u.role === "PROMOTER").length || 0;
  const activeUsers       = users?.filter((u) => u.status === "ACTIVE").length || 0;
  const totalCampaigns    = campaigns?.length || 0;
  const activeCampaigns   = campaigns?.filter((c) => c.status === "ACTIVE").length || 0;
  const totalRevenue      = transactions?.filter((t) => t.type === "PLATFORM_FEE" && t.status === "COMPLETED").reduce((s, t) => s + (t.amount || 0), 0) || 0;
  const totalPayouts      = transactions?.filter((t) => t.type === "COMMISSION_EARNED" && t.status === "COMPLETED").reduce((s, t) => s + (t.amount || 0), 0) || 0;
  const pendingWithdrawals = withdrawals?.filter((w) => w.status === "PENDING").length || 0;
  const totalWithdrawals  = withdrawals?.reduce((s, w) => s + (w.amount || 0), 0) || 0;

  const kpiData = [
    ["Total Users",         totalUsers.toLocaleString(),           "", "Active Users",       activeUsers.toLocaleString()],
    ["Total Advertisers",   totalAdvertisers.toLocaleString(),     "", "Total Promoters",    totalPromoters.toLocaleString()],
    ["Total Campaigns",     totalCampaigns.toLocaleString(),       "", "Active Campaigns",   activeCampaigns.toLocaleString()],
    ["Platform Revenue",    `$${totalRevenue.toFixed(2)}`,         "", "Total Payouts",      `$${totalPayouts.toFixed(2)}`],
    ["Pending Withdrawals", pendingWithdrawals.toString(),         "", "Total Withdrawals",  `$${totalWithdrawals.toFixed(2)}`],
    ["Total Transactions",  transactions?.length?.toLocaleString() || "0", "", "Date",       new Date().toLocaleDateString("en-BD")],
  ];

  kpiData.forEach(([l1, v1, , l2, v2], i) => {
    const row = overviewSheet.addRow([l1, v1, "", l2, v2]);
    row.getCell(1).font = { bold: true, color: { argb: COLORS.textMid }, size: 10 };
    row.getCell(2).font = { bold: true, color: { argb: COLORS.primary }, size: 13 };
    row.getCell(4).font = { bold: true, color: { argb: COLORS.textMid }, size: 10 };
    row.getCell(5).font = { bold: true, color: { argb: COLORS.primary }, size: 13 };
    [1, 2, 4, 5].forEach((c) => {
      row.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: i % 2 === 0 ? COLORS.white : "FFF5F5FF" } };
      row.getCell(c).alignment = { vertical: "middle", horizontal: "left" };
      row.getCell(c).border = { bottom: { style: "hair", color: { argb: COLORS.border } } };
    });
    row.height = 30;
  });

  // ── Sheet 2: All Campaigns ──
  const campSheet = workbook.addWorksheet("📣 All Campaigns");
  campSheet.columns = [
    { key: "title",       width: 26 },
    { key: "advertiser",  width: 20 },
    { key: "category",    width: 16 },
    { key: "status",      width: 16 },
    { key: "budget",      width: 14 },
    { key: "spent",       width: 14 },
    { key: "reach",       width: 12 },
    { key: "clicks",      width: 12 },
    { key: "conversions", width: 14 },
    { key: "roi",         width: 10 },
    { key: "createdAt",   width: 16 },
  ];

  addTitleBlock(campSheet, "📣 All Campaigns", `Total: ${totalCampaigns} campaigns`, 11);
  campSheet.addRow([]);

  const campHeaders = campSheet.addRow(["Title", "Advertiser", "Category", "Status", "Budget ($)", "Spent ($)", "Reach", "Clicks", "Conversions", "ROI %", "Created"]);
  styleHeaderRow(campHeaders);

  campaigns?.forEach((c, i) => {
    const row = campSheet.addRow([
      c.title?.substring(0, 24) || "-",
      c.advertiser?.user?.name?.substring(0, 18) || "-",
      c.category || "-",
      c.status,
      (c.totalBudget || 0).toFixed(2),
      (c.spentBudget || 0).toFixed(2),
      c.analytics?.totalReach || 0,
      c.analytics?.totalClicks || 0,
      c.analytics?.totalConversions || 0,
      c.analytics?.roi ? `${c.analytics.roi.toFixed(1)}%` : "0%",
      new Date(c.createdAt).toLocaleDateString("en-BD"),
    ]);
    styleDataRow(row, i % 2 === 0);

    const statusCell = row.getCell(4);
    const statusColors = { ACTIVE: COLORS.success, PENDING_REVIEW: COLORS.warning, COMPLETED: "FF9C27B0", CANCELLED: COLORS.danger, DRAFT: COLORS.textMid, PAUSED: "FFFF6B35" };
    statusCell.font = { bold: true, color: { argb: statusColors[c.status] || COLORS.textDark }, size: 10 };
  });

  // ── Sheet 3: Users ──
  const usersSheet = workbook.addWorksheet("👥 Users");
  usersSheet.columns = [
    { key: "name",      width: 22 },
    { key: "role",      width: 16 },
    { key: "status",    width: 14 },
    { key: "createdAt", width: 18 },
  ];

  addTitleBlock(usersSheet, "👥 All Users", `Total: ${totalUsers} users`, 4);
  usersSheet.addRow([]);

  const userHeaders = usersSheet.addRow(["Name", "Role", "Status", "Joined"]);
  styleHeaderRow(userHeaders);

  users?.forEach((u, i) => {
    const row = usersSheet.addRow([
      u.name,
      u.role,
      u.status,
      new Date(u.createdAt).toLocaleDateString("en-BD"),
    ]);
    styleDataRow(row, i % 2 === 0);

    const roleCell = row.getCell(2);
    const roleColors = { ADMIN: COLORS.danger, ADVERTISER: COLORS.primary, PROMOTER: COLORS.accent };
    roleCell.font = { bold: true, color: { argb: roleColors[u.role] || COLORS.textDark }, size: 10 };

    const statusCell = row.getCell(3);
    const statusColors = { ACTIVE: COLORS.success, SUSPENDED: COLORS.warning, BANNED: COLORS.danger, PENDING: COLORS.textMid };
    statusCell.font = { bold: true, color: { argb: statusColors[u.status] || COLORS.textDark }, size: 10 };
  });

  // ── Sheet 4: Withdrawals ──
  const wdSheet = workbook.addWorksheet("💸 Withdrawals");
  wdSheet.columns = [
    { key: "promoter", width: 22 },
    { key: "amount",   width: 14 },
    { key: "method",   width: 16 },
    { key: "status",   width: 14 },
    { key: "date",     width: 18 },
  ];

  addTitleBlock(wdSheet, "💸 Withdrawal Requests", `Pending: ${pendingWithdrawals}`, 5);
  wdSheet.addRow([]);

  const wdHeaders = wdSheet.addRow(["Promoter", "Amount ($)", "Method", "Status", "Requested At"]);
  styleHeaderRow(wdHeaders);

  withdrawals?.forEach((w, i) => {
    const row = wdSheet.addRow([
      w.promoter?.user?.name || "-",
      (w.amount || 0).toFixed(2),
      w.method,
      w.status,
      new Date(w.createdAt).toLocaleDateString("en-BD"),
    ]);
    styleDataRow(row, i % 2 === 0);

    const statusCell = row.getCell(4);
    const statusColors = { COMPLETED: COLORS.success, PENDING: COLORS.warning, FAILED: COLORS.danger };
    statusCell.font = { bold: true, color: { argb: statusColors[w.status] || COLORS.textDark }, size: 10 };
  });

  // ── Sheet 5: Transactions ──
  const txSheet = workbook.addWorksheet("💳 Transactions");
  txSheet.columns = [
    { key: "date",        width: 18 },
    { key: "type",        width: 22 },
    { key: "amount",      width: 14 },
    { key: "method",      width: 16 },
    { key: "status",      width: 14 },
    { key: "description", width: 30 },
  ];

  addTitleBlock(txSheet, "💳 All Transactions", `Total: ${transactions?.length || 0}`, 6);
  txSheet.addRow([]);

  const txHeaders = txSheet.addRow(["Date", "Type", "Amount ($)", "Method", "Status", "Description"]);
  styleHeaderRow(txHeaders);

  transactions?.forEach((tx, i) => {
    const row = txSheet.addRow([
      new Date(tx.createdAt).toLocaleDateString("en-BD"),
      tx.type,
      (tx.amount || 0).toFixed(2),
      tx.method,
      tx.status,
      tx.description || "-",
    ]);
    styleDataRow(row, i % 2 === 0);

    const typeColors = {
      COMMISSION_EARNED: COLORS.success,
      PLATFORM_FEE:      COLORS.primary,
      WITHDRAWAL:        "FFFF6B35",
      DEPOSIT:           COLORS.accent,
      REFUND:            "FF9C27B0",
    };
    row.getCell(2).font = { bold: true, color: { argb: typeColors[tx.type] || COLORS.textDark }, size: 10 };

    const statusColors = { COMPLETED: COLORS.success, PENDING: COLORS.warning, FAILED: COLORS.danger };
    row.getCell(5).font = { bold: true, color: { argb: statusColors[tx.status] || COLORS.textDark }, size: 10 };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

module.exports = { generateCampaignExcel, generatePromoterExcel, generateAdminExcel };

