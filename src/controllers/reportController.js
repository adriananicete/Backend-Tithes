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

    const generateTithesReport = await Tithes.find(filter).populate(
      "submittedBy",
      "name role",
    );
    if (generateTithesReport.length === 0)
      return res.status(200).json({ message: "Tithes Empty" });

    const workBook = new excel.Workbook();

    const worksheet = workBook.addWorksheet("Sheet 1");

    worksheet.columns = [
      { header: "Entry Date", key: "entryDate", width: 20 },
      { header: "Service Type", key: "serviceType", width: 20 },
      { header: "Total", key: "total", width: 15 },
      { header: "Submitted By", key: "submittedBy", width: 20 },
      { header: "Status", key: "status", width: 15 },
    ];

    generateTithesReport.forEach((item) => {
      worksheet.addRow({
        entryDate: item.entryDate,
        serviceType: item.serviceType,
        total: item.total,
        submittedBy: item.submittedBy?.name || "",
        status: item.status,
      });
    });

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

    const generateTithesReport  = await Tithes.find(filter).populate(
      "submittedBy",
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

    // Headers
    doc
      .fontSize(10)
      .text("Entry Date | Service Type | Total | Submitted By | Status");
    doc.moveDown();

    // Data rows
    generateTithesReport.forEach((item) => {
      doc.text(
        `${item.entryDate} | ${item.serviceType} | ${item.total} | ${item.submittedBy?.name} | ${item.status}`,
      );
    });

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json(error.message);
  }
};

export { getTithesReport, getExpenseReport, exportTithesExcel, exportTithesPDF };
