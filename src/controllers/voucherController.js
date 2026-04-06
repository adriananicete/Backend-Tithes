import mongoose from "mongoose";
import { RequestForm } from "../models/RequestForm.js";
import { Voucher } from "../models/Voucher.js";
import { autoRecordExpense } from "../utils/autoRecordExpense.js";
import { sendNotification } from "../utils/sendNotification.js";

const getAllVouchers = async (req, res) => {
  try {
    if(!['validator','do','auditor', 'admin'].includes(req.user.role)) return res.status(403).json({error: 'Access Denied'});

    const getAllVoucher = await Voucher.find().populate('rfId', 'rfNo estimatedAmount status').populate('category', 'name type').populate('createdBy', 'name role');
    if(getAllVoucher.length <= 0) return res.status(200).json({message: 'Voucher empty'});

    res.status(200).json({
        status: 'Success',
        count: getAllVoucher.length,
        data: getAllVoucher
    })
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

const createVoucher = async (req, res) => {
  try {
    if (!["validator", "admin"].includes(req.user.role))
      return res.status(403).json({ error: "Unauthorized" });

    const { rfId, category, amount, receipts } = req.body;

    if (!rfId || !category || !amount)
      return res.status(400).json({ error: "All fields required" });
    if(!mongoose.Types.ObjectId.isValid(category)) return res.status(400).json({ error: "Category not match" });
    if(!mongoose.Types.ObjectId.isValid(rfId)) return res.status(400).json({ error: "Request Form not match" });
    if (amount <= 0)
      return res.status(400).json({ error: "Amount must greater than zero" });
    

    const findRequestFormbyId = await RequestForm.findById(rfId);
    if (!findRequestFormbyId)
      return res.status(404).json({ error: "Request form not found" });

    if (findRequestFormbyId.status !== "approved")
      return res.status(400).json({ error: "Request form must be approved" });
    if (findRequestFormbyId.voucherId)
      return res.status(400).json({ error: "Voucher already created" });

    const generatePCFNo = async () => {
      const lastPCF = await Voucher.findOne().sort({ createdAt: -1 });
      let newNumber = 1;

      if (lastPCF && lastPCF.pcfNo) {
        const lastNum = parseInt(lastPCF.pcfNo.split("-")[1], 10);
        if (!isNaN(lastNum)) newNumber = lastNum + 1;
      }

      return `PCF-${String(newNumber).padStart(4, "0")}`;
    };

    const newVoucher = new Voucher({
        pcfNo: await generatePCFNo(),
        rfId: rfId,
        date: Date.now(),
        category: category,
        amount: Number(amount),
        createdBy: req.user.id,
        receipts: receipts || []
    });
    await newVoucher.save()

    await autoRecordExpense(newVoucher);

    const vouch = await RequestForm.findByIdAndUpdate(rfId, {$set: {voucherId: newVoucher._id, status: 'voucher_created'}}, {new: true, runValidators: true});


    await sendNotification({
          userId: vouch.requestedBy,
          message: `Voucher ${newVoucher.pcfNo} has been created for your request ${vouch.rfNo}`,
          type: "info",
          refId: vouch._id,
          refModel: "Voucher",
        });

    res.status(200).json({
        status: 'Success',
        message: `Voucher ${newVoucher.pcfNo} created`,
        data: newVoucher
    })
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export { getAllVouchers, createVoucher };
