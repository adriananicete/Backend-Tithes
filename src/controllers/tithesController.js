import { Tithes } from "../models/TithesEntry.js";
import { sendNotification } from "../utils/sendNotification.js";

const getAllTithes = async (req, res) => {
  try {

    const { startDate, endDate } = req.query;
    const filter = {};

    if(startDate && endDate) {
      filter.entryDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }
    const getAllData = await Tithes.find(filter)
      .populate("submittedBy", "name role")
      .populate("reviewedBy", "name role");

    const tithesTotalBalance = getAllData.reduce((acc, item) => acc + item.total, 0);

    res.status(200).json({
      status: "Success",
      totalBalance: tithesTotalBalance,
      count: getAllData.length,
      data: getAllData,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

const submitTithes = async (req, res) => {
  try {
    const {
      body: { entryDate, serviceType, denominations, total },
    } = req;

    if (!entryDate || !serviceType || !denominations || !total)
      return res.status(400).json({ error: "All fields are required!" });

    if (total <= 0)
      return res.status(400).json({ error: "Tithes must be greater than 0!" });

    const newTithes = new Tithes({
      entryDate,
      serviceType,
      denominations,
      total,
      submittedBy: req.user.id,
    });
    await newTithes.save();

    res.status(201).json({
      status: "Success",
      message: "New Tithes Created, Pending for approval",
      data: {
        newTithes,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

const approveTithes = async (req, res) => {
  try {
    const { id } = req.params;

    const finderTithes = await Tithes.findById(id);
    if (!finderTithes)
      return res.status(404).json({ error: "Tithes Entry not found!" });

    if (finderTithes.submittedBy.toString() === req.user.id)
      return res
        .status(400)
        .json({ error: "Cannot approve your own tithes entry!" });

    if (finderTithes.status === "approved")
      return res.status(400).json({ error: "Already Approved" });

    if (finderTithes.status === "rejected")
      return res.status(400).json({ error: "Already Rejected" });

    const approvedTithes = await Tithes.updateOne(
      { _id: id },
      {
        $set: {
          status: "approved",
          reviewedBy: req.user.id,
          reviewedAt: Date.now(),
        },
      },
    );

    await sendNotification({
      userId: finderTithes.submittedBy,
      message: "Your tithes entry has been approved",
      type: "approval",
      refId: finderTithes._id,
      refModel: "Tithes",
    });

    res.status(200).json({
      status: "Success",
      message: "Tithes Entry Approved!",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

const rejectTithes = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionNote } = req.body;

    const findTithes = await Tithes.findById(id);
    if (!findTithes)
      return res.status(404).json({ error: "Tithes Entry not Found" });

    if (findTithes.status === "approved")
      return res.status(400).json({ error: "Already approved" });

    if (findTithes.status === "rejected")
      return res.status(400).json({ error: "Already rejected" });

    if (!rejectionNote)
      return res.status(404).json({ error: "Need reason for Rejection" });

    const rejectedTithes = await Tithes.updateOne(
      { _id: id },
      {
        $set: {
          status: "rejected",
          reviewedBy: req.user.id,
          reviewedAt: Date.now(),
          rejectionNote: rejectionNote,
        },
      },
      { new: true },
    );

    await sendNotification({
      userId: findTithes.submittedBy,
      message: "Your tithes entry has been rejected",
      type: "rejection",
      refId: findTithes._id,
      refModel: "Tithes",
    });

    res.status(200).json({
      status: "Success",
      message: "Tithes Entry Rejected",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

const updateTithes = async (req, res) => {
  try {
    const { id } = req.params;
    const { body } = req;

    const findyById = await Tithes.findById(id);
    if (!findyById)
      return res.status(404).json({ error: "Tithes entry not found" });

    if (findyById.submittedBy.toString() !== req.user.id)
      return res
        .status(404)
        .json({ error: "The one who submit this can only update this entry" });

    if (findyById.status !== "pending")
      return res
        .status(400)
        .json({ error: "Cannot edit approved/rejected entry" });

    const findTithes = await Tithes.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: "Success",
      message: "Tithes Entry Updated",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

export {
  submitTithes,
  getAllTithes,
  approveTithes,
  rejectTithes,
  updateTithes,
};
