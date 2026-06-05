// components/ExportButton.jsx
// Place this in your frontend Next.js project

"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, ChevronDown, Loader2 } from "lucide-react";

/**
 * Analytics Export Button Component
 * 
 * Usage:
 * <ExportButton campaignId="abc123" campaignTitle="My Campaign" />
 * <ExportButton type="promoter" promoterId="xyz456" />
 * <ExportButton type="admin" />
 */
export default function ExportButton({
  type = "campaign",      // "campaign" | "promoter" | "admin"
  campaignId,
  promoterId,
  campaignTitle = "Campaign",
  dateFrom,
  dateTo,
  className = "",
}) {
  const [loading, setLoading] = useState(null); // null | "excel" | "pdf"
  const [open, setOpen] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://reachflow-j34o.onrender.com";

  async function handleExport(format) {
    setLoading(format);
    setOpen(false);

    try {
      // Build URL
      let url = "";
      if (type === "campaign") {
        url = `${API_BASE}/api/analytics/export/${campaignId}?format=${format}`;
      } else if (type === "promoter") {
        url = `${API_BASE}/api/analytics/export/promoter/${promoterId}?format=${format}`;
      } else if (type === "admin") {
        url = `${API_BASE}/api/analytics/export/admin/overview?format=${format}`;
      }

      if (dateFrom) url += `&dateFrom=${dateFrom}`;
      if (dateTo) url += `&dateTo=${dateTo}`;

      // Fetch with auth token
      const token = localStorage.getItem('rf_token')
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Export failed");
      }

      // Trigger download
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;

      const safeTitle = campaignTitle.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 30);
      const dateStr = new Date().toISOString().split("T")[0];
      a.download = `ReachFlow_${safeTitle}_${dateStr}.${format === "pdf" ? "pdf" : "xlsx"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

    } catch (err) {
      console.error("Export error:", err);
      alert(`Export failed: ${err.message}`);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Main Button */}
      <div className="flex rounded-lg overflow-hidden shadow-sm">
        {/* Export label part */}
        <button
          onClick={() => handleExport("excel")}
          disabled={!!loading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium px-4 py-2 transition-colors"
        >
          {loading === "excel" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {loading === "excel" ? "Exporting..." : "Export Excel"}
        </button>

        {/* Dropdown arrow */}
        <button
          onClick={() => setOpen(!open)}
          disabled={!!loading}
          className="bg-indigo-700 hover:bg-indigo-800 disabled:bg-indigo-400 text-white px-2 py-2 border-l border-indigo-500 transition-colors"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Dropdown Menu */}
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />

          <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-20 min-w-[180px] overflow-hidden">
            <button
              onClick={() => handleExport("excel")}
              disabled={!!loading}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
              <div className="text-left">
                <div className="font-medium">Export Excel</div>
                <div className="text-xs text-gray-400">.xlsx • Multiple sheets</div>
              </div>
            </button>

            <div className="h-px bg-gray-100" />

            <button
              onClick={() => handleExport("pdf")}
              disabled={!!loading}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {loading === "pdf" ? (
                <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
              ) : (
                <FileText className="w-4 h-4 text-red-500" />
              )}
              <div className="text-left">
                <div className="font-medium">Export PDF</div>
                <div className="text-xs text-gray-400">.pdf • Print-ready report</div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
