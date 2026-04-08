import { Expense } from "../models/Expense.js";
import { Tithes } from "../models/TithesEntry.js";
import PDFDocument from "pdfkit";
import excel from "exceljs";

const getTithesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {};

    if (startDate && endDate) {
      filter.entryDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (req.user.role === "member") {
      filter.submittedBy = req.user.id;
    }

    const getAllTithes = await Tithes.find(filter)
      .populate("submittedBy", "name role")
      .populate("reviewedBy", "name role");

    if (getAllTithes.length === 0)
      return res.status(200).json({ message: "No Entry Tithes at the moment" });

    res.status(200).json({
      status: "Success",
      count: getAllTithes.length,
      data: getAllTithes,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

const getExpenseReport = async (req, res) => {
  try {
    if (req.user.role === "member")
      return res.status(403).json({ error: "Forbidden" });

    const { startDate, endDate } = req.query;
    const filter = {};

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const getAllExpense = await Expense.find(filter)
      .populate("recordedBy", "name role")
      .populate("category", "name type")
      .populate("linkedId", "pcfNo amount");

    if (getAllExpense.length === 0)
      return res.status(200).json({ message: "No Expense at the moment" });

    res.status(200).json({
      status: "Success",
      count: getAllExpense.length,
      data: getAllExpense,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

const exportTithesExcel = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {};

    if (startDate && endDate) {
      filter.entryDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const generateTithesReport = await Tithes.find(filter)
      .populate("submittedBy", "name role")
      .populate("reviewedBy", "name role");
    if (generateTithesReport.length === 0)
      return res.status(200).json({ message: "Tithes Empty" });

    const workBook = new excel.Workbook();

    const worksheet = workBook.addWorksheet("Tithes");

    worksheet.columns = [
      { header: "Entry Date", key: "entryDate", width: 20 },
      { header: "Service Type", key: "serviceType", width: 20 },
      { header: "Total", key: "total", width: 15 },
      { header: "Submitted By", key: "submittedBy", width: 20 },
      { header: "Status", key: "status", width: 15 },
      { header: "Reviewed By", key: "reviewedBy", width: 15 },
    ];

    generateTithesReport.forEach((item) => {
      worksheet.addRow({
        entryDate: item.entryDate,
        serviceType: item.serviceType,
        total: item.total,
        submittedBy: item.submittedBy?.name || "",
        status: item.status,
        reviewedBy: item.reviewedBy?.name || "",
      });
    });

    // Una — insert title
    worksheet.insertRow(1, ["JOSCM Tithes Report"]);
    worksheet.mergeCells("A1:F1");
    worksheet.getCell("A1").font = { bold: true, size: 14 };
    worksheet.getCell("A1").alignment = { horizontal: "center" };

    // Pangalawa — style ang header (row 2 na ngayon)
    worksheet.getRow(2).font = { bold: true, color: { argb: "FFFFFFFF" } };
    ["A2", "B2", "C2", "D2", "E2", "F2"].forEach((cellRef) => {
      worksheet.getCell(cellRef).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4F8EF7" },
      };
    });
    worksheet.getRow(2).alignment = { horizontal: "center" };

    // Panghuli — borders
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        ((cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        }),
          (cell.alignment = { horizontal: "center" }));
      });
    });

    // Status color per row
    generateTithesReport.forEach((item, index) => {
      const rowIndex = index + 3; // +3 kasi title + header
      const statusCell = worksheet.getCell(`E${rowIndex}`);

      if (item.status === "approved") {
        statusCell.font = { color: { argb: "FF34D399" }, bold: true };
      } else if (item.status === "pending") {
        statusCell.font = { color: { argb: "FFFBBF24" }, bold: true };
      } else if (item.status === "rejected") {
        statusCell.font = { color: { argb: "FFF87171" }, bold: true };
      }
    });

    // Total balance sa baba
    const lastRow = generateTithesReport.length + 3;
    worksheet.getCell(`C${lastRow}`).value = {
      formula: `SUM(C3:C${lastRow - 1})`,
    };
    worksheet.getCell(`C${lastRow}`).font = { bold: true };
    worksheet.getCell(`B${lastRow}`).value = "Total Balance:";
    worksheet.getCell(`B${lastRow}`).font = { bold: true };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=tithes-report.xlsx",
    );
    await workBook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json(error.message);
  }
};

const centerText = (doc, text, colX, colWidth, y) => {
  const textWidth = doc.widthOfString(String(text));
  const x = colX + (colWidth - textWidth) / 2;
  doc.text(String(text), x, y);
};

const colWidths = {
    date: 100, service: 120, total: 80, 
    submittedBy: 100, status: 80, reviewedBy: 100
}

const exportTithesPDF = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {};

    if (startDate && endDate) {
      filter.entryDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const generateTithesReport = await Tithes.find(filter).populate(
      "submittedBy",
      "name role",
    ).populate(
      "reviewedBy",
      "name role",
    );
    if (generateTithesReport.length === 0)
      return res.status(200).json({ message: "Tithes Empty" });

    const doc = new PDFDocument();

    // I-pipe sa response — hindi sa file system
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=tithes-report.pdf",
    );
    doc.pipe(res);

    // Title
    doc.fontSize(16).text("Tithes Report", { align: "center" });
    doc.moveDown();

    const tableLeft = 26

    // Table coordinates
    const tableTop = 150;
    const col = {
    date: tableLeft,
    service: tableLeft + 100,
    total: tableLeft + 220,
    submittedBy: tableLeft + 300,
    status: tableLeft + 400,
    reviewedBy: tableLeft + 480
}
    const rowHeight = 20;

    // Draw header background
    doc.rect(tableLeft, tableTop, 560, rowHeight).fill("#4F8EF7")
    

    // Header text
    doc.fillColor("white").fontSize(9).font("Helvetica-Bold");
    centerText(doc, "Entry Date", col.date, colWidths.date, tableTop + 5);
    centerText(
      doc,
      "Service Type",
      col.service,
      colWidths.service,
      tableTop + 5,
    );
    centerText(doc, "Total", col.total, colWidths.total, tableTop + 5);
    centerText(
      doc,
      "Submitted By",
      col.submittedBy,
      colWidths.submittedBy,
      tableTop + 5,
    );
    centerText(doc, "Status", col.status, colWidths.status, tableTop + 5);
    centerText(
      doc,
      "Rev. By",
      col.reviewedBy,
      colWidths.reviewedBy,
      tableTop + 5,
    );

    // Data rows
    doc.font("Helvetica").fillColor("black");
    generateTithesReport.forEach((item, index) => {
      const y = tableTop + rowHeight + index * rowHeight;

      if (index % 2 === 0) {
        doc.rect(tableLeft, y, 560, rowHeight).fill("#f0f4ff");
      }

      doc.fillColor("black").fontSize(8);
      // ← palitan mo ang doc.text() ng centerText()
      centerText(
        doc,
        new Date(item.entryDate).toLocaleDateString("en-PH"),
        col.date,
        colWidths.date,
        y + 5,
      );
      centerText(doc, item.serviceType, col.service, colWidths.service, y + 5);
      centerText(
        doc,
        item.total.toLocaleString(),
        col.total,
        colWidths.total,
        y + 5,
      );
      centerText(
        doc,
        item.submittedBy?.name || "",
        col.submittedBy,
        colWidths.submittedBy,
        y + 5,
      );
      centerText(doc, item.status, col.status, colWidths.status, y + 5);
      centerText(
        doc,
        item.reviewedBy?.name || "",
        col.reviewedBy,
        colWidths.reviewedBy,
        y + 5,
      );
    });

    const lastRowY =
      tableTop + rowHeight + generateTithesReport.length * rowHeight + 30;

    doc.fontSize(10).text(
      `Generated: ${new Date().toLocaleDateString("en-PH")}`,
      tableLeft,
      lastRowY, // ← x:50 para left aligned
      { align: "left" },
    );

    const totalBalance = generateTithesReport.reduce(
      (sum, item) => sum + item.total,
      0,
    );

    doc.fontSize(10).text(
      `Total Balance: Php ${totalBalance.toLocaleString()}`,
      tableLeft,
      lastRowY + 20, // ← 20px below generated
      { align: "left" },
    );

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json(error.message);
  }
};

export {
  getTithesReport,
  getExpenseReport,
  exportTithesExcel,
  exportTithesPDF,
};
