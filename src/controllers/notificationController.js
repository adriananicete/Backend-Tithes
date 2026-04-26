import mongoose from "mongoose";
import { Notification } from "../models/Notification.js";

const getNotifications = async (req, res) => {
  try {
    const getAllNotif = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "Success",
      count: getAllNotif.length,
      data: getAllNotif,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ error: "Invalid Id!" });

    const findId = await Notification.findById(id);
    if (!findId)
      return res.status(400).json({ error: "Notification not found" });

    if (findId.userId.toString() !== req.user.id)
      return res.status(403).json({ error: "Forbidden" });

     await Notification.findByIdAndUpdate(
      id,
      { $set: { isRead: true } },
      { new: true, runValidators: true },
    );

    res.status(200).json({
      status: "Success",
      message: "Mark as read",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { $set: { isRead: true } },
    );

    res.status(200).json({
      status: "Success",
      message: "Mark all as read",
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export { getNotifications, markAsRead, markAllAsRead };
