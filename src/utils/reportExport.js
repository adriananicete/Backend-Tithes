import excel from "exceljs";

// ---------------------------------------------------------------------------
// Shared report-export builders. No DB access and no `res` handling here —
// controllers fetch + populate the data, call these to build the document,
// then stream it. Used by the tithes/expense exports and the combined report.
// ---------------------------------------------------------------------------

export const CHURCH = "JOSCM";
const CURRENCY_FMT = "#,##0.00";
const HEADER_FILL = "FF4F8EF7";
const BAND_FILL = "FFF0F4FF";
const BORDER = { style: "thin", color: { argb: "FFDDDDDD" } };
const STATUS_COLORS = {
  approved: "FF15803D",
  pending: "FFB45309",
  rejected: "FFB91C1C",
};

export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-PH") : "");

// PDFKit's built-in Helvetica has no peso glyph, so PDFs use a "PHP " prefix.
export const peso = (n) =>
  "PHP " +
  Number(n || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const rangeLine = (startDate, endDate) =>
  startDate && endDate
    ? `Period: ${fmtDate(startDate)} to ${fmtDate(endDate)}`
    : "Period: All dates";

const colLetter = (n) => {
  let s = "";
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
};

// ---- Column definitions (shared by Excel + PDF + JSON mappers) ----
export const TITHES_COLUMNS = [
  { header: "Entry Date", key: "entryDate", width: 18, pdfWidth: 80 },
  { header: "Service Type", key: "serviceType", width: 22, pdfWidth: 110 },
  { header: "Total", key: "total", width: 16, pdfWidth: 80, money: true },
  { header: "Submitted By", key: "submittedBy", width: 20, pdfWidth: 110 },
  { header: "Status", key: "status", width: 14, pdfWidth: 70 },
  { header: "Reviewed By", key: "reviewedBy", width: 20, pdfWidth: 90 },
];

export const EXPENSE_COLUMNS = [
  { header: "Date", key: "date", width: 18, pdfWidth: 75 },
  { header: "PCF No.", key: "pcfNo", width: 16, pdfWidth: 75 },
  { header: "Category", key: "category", width: 20, pdfWidth: 120 },
  { header: "Amount", key: "amount", width: 16, pdfWidth: 85, money: true },
  { header: "Source", key: "source", width: 14, pdfWidth: 70 },
  { header: "Recorded By", key: "recordedBy", width: 20, pdfWidth: 115 },
];

export const mapTithesRows = (docs) =>
  docs.map((t) => ({
    entryDate: fmtDate(t.entryDate),
    serviceType: t.serviceType || "",
    total: t.total || 0,
    submittedBy: t.submittedBy?.name || "",
    status: t.status || "",
    reviewedBy: t.reviewedBy?.name || "",
  }));

export const mapExpenseRows = (docs) =>
  docs.map((e) => ({
    date: fmtDate(e.date),
    pcfNo: e.linkedId?.pcfNo || "N/A",
    category: e.category?.name || "",
    amount: e.amount || 0,
    source: e.source || "",
    recordedBy: e.recordedBy?.name || "",
  }));

export const computeCombinedSummary = (tithes, expenses) => {
  const totalTithes = tithes.reduce((s, t) => s + (t.total || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const byCatMap = {};
  expenses.forEach((e) => {
    const name = e.category?.name || "Uncategorized";
    byCatMap[name] = (byCatMap[name] || 0) + (e.amount || 0);
  });
  const byCategory = Object.entries(byCatMap)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
  return {
    totalTithes,
    totalExpenses,
    net: totalTithes - totalExpenses,
    tithesCount: tithes.length,
    expenseCount: expenses.length,
    byCategory,
  };
};

// ---------------------------------------------------------------------------
// EXCEL
// ---------------------------------------------------------------------------
export function buildExcelSheet(
  ws,
  { reportName, startDate, endDate, columns, rows, totals = [], statusColorKey },
) {
  const colCount = columns.length;
  const lastCol = colLetter(colCount);
  ws.columns = columns.map((c) => ({ key: c.key, width: c.width || 16 }));

  const addTitle = (text, font) => {
    const row = ws.addRow([text]);
    ws.mergeCells(`A${row.number}:${lastCol}${row.number}`);
    const cell = row.getCell(1);
    cell.font = font;
    cell.alignment = { horizontal: "center" };
  };
  addTitle(CHURCH, { bold: true, size: 16 });
  addTitle(reportName, { bold: true, size: 13 });
  addTitle(rangeLine(startDate, endDate), {
    italic: true,
    size: 10,
    color: { argb: "FF666666" },
  });
  addTitle(`Generated: ${fmtDate(new Date())}`, {
    size: 9,
    color: { argb: "FF888888" },
  });

  const headerRow = ws.addRow(columns.map((c) => c.header));
  headerRow.height = 18;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });
  const headerRowNum = headerRow.number;
  const firstDataRow = headerRowNum + 1;

  rows.forEach((r, i) => {
    const row = ws.addRow(r);
    const banded = i % 2 === 1;
    columns.forEach((c, ci) => {
      const cell = row.getCell(ci + 1);
      if (c.money) {
        cell.numFmt = CURRENCY_FMT;
        cell.alignment = { horizontal: "right" };
      } else {
        cell.alignment = { horizontal: "center" };
      }
      if (banded)
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BAND_FILL } };
      if (statusColorKey && c.key === statusColorKey) {
        const argb = STATUS_COLORS[String(r[c.key]).toLowerCase()];
        if (argb) cell.font = { color: { argb }, bold: true };
      }
    });
  });

  const lastDataRow = headerRowNum + rows.length;

  if (rows.length > 0 && totals.length > 0) {
    const totalsRow = ws.addRow([]);
    totals.forEach(({ key, label }) => {
      const ci = columns.findIndex((c) => c.key === key);
      if (ci < 0) return;
      const letter = colLetter(ci + 1);
      const sumCell = totalsRow.getCell(ci + 1);
      sumCell.value = { formula: `SUM(${letter}${firstDataRow}:${letter}${lastDataRow})` };
      sumCell.font = { bold: true };
      sumCell.numFmt = CURRENCY_FMT;
      sumCell.alignment = { horizontal: "right" };
      if (ci > 0) {
        const labelCell = totalsRow.getCell(ci);
        labelCell.value = label;
        labelCell.font = { bold: true };
        labelCell.alignment = { horizontal: "right" };
      }
    });
  }

  const lastRow = ws.lastRow.number;
  for (let r = headerRowNum; r <= lastRow; r++) {
    const row = ws.getRow(r);
    for (let c = 1; c <= colCount; c++) {
      row.getCell(c).border = {
        top: BORDER,
        left: BORDER,
        bottom: BORDER,
        right: BORDER,
      };
    }
  }

  ws.views = [{ state: "frozen", ySplit: headerRowNum }];
  ws.autoFilter = {
    from: { row: headerRowNum, column: 1 },
    to: { row: Math.max(lastDataRow, headerRowNum), column: colCount },
  };
}

// Combined-report "Summary" sheet (key/value totals + by-category table).
export function buildCombinedSummarySheet(ws, { startDate, endDate, summary }) {
  ws.columns = [{ key: "a", width: 28 }, { key: "b", width: 22 }];

  const addTitle = (text, font) => {
    const row = ws.addRow([text]);
    ws.mergeCells(`A${row.number}:B${row.number}`);
    row.getCell(1).font = font;
    row.getCell(1).alignment = { horizontal: "center" };
  };
  addTitle(CHURCH, { bold: true, size: 16 });
  addTitle("Financial Summary", { bold: true, size: 13 });
  addTitle(rangeLine(startDate, endDate), {
    italic: true,
    size: 10,
    color: { argb: "FF666666" },
  });
  addTitle(`Generated: ${fmtDate(new Date())}`, {
    size: 9,
    color: { argb: "FF888888" },
  });
  ws.addRow([]);

  const kv = (label, value, opts = {}) => {
    const row = ws.addRow([label, value]);
    row.getCell(1).font = { bold: !!opts.bold };
    const v = row.getCell(2);
    if (opts.money !== false) {
      v.numFmt = CURRENCY_FMT;
      v.alignment = { horizontal: "right" };
    }
    v.font = {
      bold: !!opts.bold,
      ...(opts.argb ? { color: { argb: opts.argb } } : {}),
    };
  };
  kv("Total Tithes", summary.totalTithes);
  kv("Total Expenses", summary.totalExpenses);
  kv("NET Position", summary.net, {
    bold: true,
    argb: summary.net >= 0 ? "FF15803D" : "FFB91C1C",
  });
  ws.addRow([]);
  kv("Tithes Entries", summary.tithesCount, { money: false });
  kv("Expense Entries", summary.expenseCount, { money: false });
  ws.addRow([]);

  if (summary.byCategory.length) {
    const h = ws.addRow(["Expenses by Category", "Amount"]);
    h.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
    });
    summary.byCategory.forEach((c) => {
      const row = ws.addRow([c.category, c.total]);
      row.getCell(2).numFmt = CURRENCY_FMT;
      row.getCell(2).alignment = { horizontal: "right" };
    });
  }
}

// ---------------------------------------------------------------------------
// PDF
// ---------------------------------------------------------------------------
const ROW_H = 20;
const FOOTER_H = 30;
const PDF_HEADER_FILL = "#4F8EF7";
const PDF_BAND_FILL = "#f0f4ff";

const cellText = (doc, text, x, width, y, align = "center") => {
  const s = String(text ?? "");
  if (align === "right") {
    const tw = doc.widthOfString(s);
    doc.text(s, x + width - tw - 4, y, { lineBreak: false });
  } else if (align === "left") {
    doc.text(s, x + 4, y, { lineBreak: false });
  } else {
    const tw = doc.widthOfString(s);
    doc.text(s, x + Math.max(0, (width - tw) / 2), y, { lineBreak: false });
  }
};

const drawDocHeader = (doc, { reportName, startDate, endDate, left, contentW, y }) => {
  doc.fillColor("#111111").font("Helvetica-Bold").fontSize(18);
  doc.text(CHURCH, left, y, { width: contentW, align: "center" });
  y += 22;
  doc.fontSize(13).text(reportName, left, y, { width: contentW, align: "center" });
  y += 18;
  doc.font("Helvetica").fontSize(9).fillColor("#666666");
  doc.text(rangeLine(startDate, endDate), left, y, { width: contentW, align: "center" });
  y += 12;
  doc.fillColor("#888888");
  doc.text(`Generated: ${fmtDate(new Date())}`, left, y, { width: contentW, align: "center" });
  return y + 20;
};

const drawSummaryBlock = (doc, { summaryBlock, left, y, pageBottom }) => {
  doc.font("Helvetica-Bold").fontSize(12).fillColor("#111111");
  doc.text(summaryBlock.title || "Financial Summary", left, y, { lineBreak: false });
  y += 18;
  doc.fontSize(10);
  summaryBlock.rows.forEach((kv) => {
    doc.font("Helvetica").fillColor("#444444").text(kv.label, left + 4, y, {
      lineBreak: false,
      width: 200,
    });
    doc.font("Helvetica-Bold").fillColor(kv.color || "#111111").text(kv.value, left + 220, y, {
      lineBreak: false,
    });
    y += 16;
  });
  y += 6;
  if (summaryBlock.byCategory && summaryBlock.byCategory.length) {
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#111111");
    doc.text("Expenses by Category", left, y, { lineBreak: false });
    y += 15;
    doc.font("Helvetica").fontSize(9);
    summaryBlock.byCategory.forEach((c) => {
      if (y + 14 > pageBottom) {
        doc.addPage();
        y = doc.page.margins.top;
      }
      doc.fillColor("#444444").text(c.category, left + 4, y, { lineBreak: false, width: 200 });
      doc.fillColor("#111111").text(peso(c.total), left + 220, y, { lineBreak: false });
      y += 14;
    });
  }
  return y + 12;
};

const drawSection = (doc, { section, left, y, pageBottom }) => {
  const { title, columns, rows, totals = [] } = section;
  const widths = columns.map((c) => c.pdfWidth || 80);
  const totalW = widths.reduce((a, b) => a + b, 0);
  const xs = [];
  let cx = left;
  widths.forEach((w) => {
    xs.push(cx);
    cx += w;
  });

  const drawHeaderBand = () => {
    doc.rect(left, y, totalW, ROW_H).fill(PDF_HEADER_FILL);
    doc.fillColor("white").font("Helvetica-Bold").fontSize(9);
    columns.forEach((c, i) =>
      cellText(doc, c.header, xs[i], widths[i], y + 6, c.money ? "right" : "center"),
    );
    y += ROW_H;
  };

  if (y + ROW_H * 2 > pageBottom) {
    doc.addPage();
    y = doc.page.margins.top;
  }
  if (title) {
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#111111").text(title, left, y, {
      lineBreak: false,
    });
    y += 16;
  }
  drawHeaderBand();

  rows.forEach((r, idx) => {
    if (y + ROW_H > pageBottom) {
      doc.addPage();
      y = doc.page.margins.top;
      drawHeaderBand(); // repeat header on each new page
    }
    if (idx % 2 === 1) doc.rect(left, y, totalW, ROW_H).fill(PDF_BAND_FILL);
    doc.fillColor("#111111").font("Helvetica").fontSize(8);
    columns.forEach((c, i) => {
      const raw = r[c.key];
      const val = c.money ? peso(raw) : raw;
      cellText(doc, val, xs[i], widths[i], y + 6, c.money ? "right" : "center");
    });
    y += ROW_H;
  });

  totals.forEach((t) => {
    const ci = columns.findIndex((c) => c.key === t.key);
    if (ci < 0) return;
    const sum = rows.reduce((s, r) => s + (Number(r[t.key]) || 0), 0);
    if (y + ROW_H > pageBottom) {
      doc.addPage();
      y = doc.page.margins.top;
    }
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#111111");
    if (ci > 0) cellText(doc, t.label, xs[ci - 1], widths[ci - 1], y + 6, "right");
    cellText(doc, peso(sum), xs[ci], widths[ci], y + 6, "right");
    y += ROW_H;
  });

  return y;
};

export function renderPdfDoc(doc, { reportName, startDate, endDate, sections = [], summaryBlock }) {
  const left = doc.page.margins.left;
  const contentW = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const pageBottom = doc.page.height - doc.page.margins.bottom - FOOTER_H;

  let y = drawDocHeader(doc, { reportName, startDate, endDate, left, contentW, y: doc.page.margins.top });

  if (summaryBlock) y = drawSummaryBlock(doc, { summaryBlock, left, y, pageBottom });

  sections.forEach((section, i) => {
    if (i > 0) y += 14;
    y = drawSection(doc, { section, left, y, pageBottom });
  });

  // Footer with page numbers — two-pass over the buffered pages.
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    const fy = doc.page.height - doc.page.margins.bottom - 14;
    doc.font("Helvetica").fontSize(8).fillColor("#888888");
    doc.text(`Generated: ${fmtDate(new Date())}`, left, fy, { lineBreak: false });
    doc.text(`Page ${i + 1} of ${range.count}`, left, fy, {
      width: contentW,
      align: "right",
      lineBreak: false,
    });
  }
}
