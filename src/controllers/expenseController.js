import mongoose from "mongoose";
import { Expense } from "../models/Expense.js";

const getAllExpenses = async (req, res) => {
  try {
    const getAllData = await Expense.find()
      .populate({
        path: "linkedId",
        select: "pcfNo amount rfId",
        populate: {
          path: "rfId",
          select: "rfNo requestedBy approvedBy",
          populate: [
            { path: "requestedBy", select: "name" },
            { path: "approvedBy", select: "name" },
          ],
        },
      })
      .populate("category", "name type")
      .populate("recordedBy", "name role");
    if (getAllData.length === 0)
      return res.status(200).json({ message: "Expense Data empty" });

    res.status(200).json({
      status: "Success",
      count: getAllData.length,
      data: getAllData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

const createManualExpense = async (req, res) => {
  try {

    if(!['admin'].includes(req.user.role)) return res.status(403).json({ error: 'Only admin can create manual expense' });
    const { amount, category, date, remarks } = req.body;

    if(!mongoose.Types.ObjectId.isValid(category)) return res.status(400).json({error: `Invalid Category`});

    if(!amount || !category || !date) return res.status(400).json({ error: 'All fields required' });

    if(amount <= 0) return res.status(400).json({ error: 'Amount must be greater than zero' });

    const newManualExpense = new Expense({
        source: 'manual',
        amount: amount,
        category: category,
        date: date,
        recordedBy: req.user.id,
        remarks: remarks
    });

    await newManualExpense.save()

    res.status(201).json({
        status: 'Success',
        message: 'Manual Expense Created',
        data: newManualExpense
    });


  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export { getAllExpenses, createManualExpense };
