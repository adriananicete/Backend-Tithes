import mongoose from "mongoose";
import { RequestForm } from "../models/RequestForm";

const getAllRequestForms = async (req, res) => {
  try {
    const requestForms = await RequestForm.find()
      .populate("requestedBy", "name role")
      .populate("category", "name type")
      .populate("approvedBy", "name role")
      .populate("validatedBy", "name role");
    if (requestForms.length === 0)
      return res.status(400).json({ message: "Request Form empty" });

    res.status(200).json({
      status: "Success",
      count: requestForms.length,
      data: requestForms,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

const createRequestForm = async (req, res) => {
  try {
    const { entryDate, category, estimatedAmount, attachments } = req.body;

    if (!entryDate) {
      return res.status(400).json({ error: "Entry Date required!" });
    } else if (!category) {
      return res.status(400).json({ error: "Category required!" });
    } else if (!estimatedAmount) {
      return res.status(400).json({ error: "Estimated Amount required!" });
    }

    // RF formatter
    const lastRF = await RequestForm.findOne().sort({ rfNo: -1 });
    const lastNumber = lastRF ? parseInt(lastRF.rfNo.split("-")[1]) : 0;
    const newRfNo = `RF-${String(lastNumber + 1).padStart(4, "0")}`;

    const newRequestForm = new RequestForm({
      rfNo: newRfNo,
      entryDate,
      category,
      estimatedAmount,
      attachments,
      requestedBy: req.user.id,
    });

    await newRequestForm.save();

    res.status(200).json({
      status: "Success",
      message: "Request Form Sent",
      data: {
        newRequestForm,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

const submitRequestForm = async (req, res) => {
  try {
    const { id } = req.params;

    const findRfId = await RequestForm.findById(id);
    if (!findRfId)
      return res.status(404).json({ error: "Request form ID not found" });

    if (findRfId.requestedBy.toString() !== req.user.id)
      return res.status(400).json({ error: "You cannot submit this request" });

    if (findRfId.status !== "draft")
      return res.status(400).json({ error: "Already Submitted" });

    const submittedRequestForm = await RequestForm.findByIdAndUpdate(
      id,
      { $set: { status: "submitted" } },
      { new: true },
    );

    res.status(200).json({
      status: "Success",
      message: "Request Form Submitted",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

const updateRequestForm = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ error: "Invalid ID" });
    const { body } = req;

    const findRequestFormById = await RequestForm.findById(id);
    if (!findRequestFormById)
      return res.status(404).json({ error: "Request Form not found!" });

    if (findRequestFormById.requestedBy.toString() !== req.user.id)
      return res.status(403).json({ error: "Invalid User!" });

    if (findRequestFormById.status !== "draft")
      return res.status(400).json({ error: "Status must be draft" });

    const updatedRequestForm = await RequestForm.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: "Success",
      message: "Updated Successfully",
      data: updatedRequestForm,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

const deleteRequestForm = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ error: "Invalid ID" });

    const findRequestFormById = await RequestForm.findById(id);
    if (!findRequestFormById)
      return res.status(404).json({ error: "Request form not found!" });

    if (findRequestFormById.requestedBy.toString() !== req.user.id)
      return res.status(403).json({ error: "Forbidden" });

    if (findRequestFormById.status !== "draft")
      return res.status(400).json({ error: "Status must be draft" });

    await RequestForm.findByIdAndDelete(id);

    res.status(200).json({
      status: "Success",
      message: "Request Form deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

const validateRequestForm = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ error: "Invalid ID" });

    const findRequestFormById = await RequestForm.findById(id);
    if (!findRequestFormById)
      return res.status(404).json({ error: "Request Form not found" });

    if (findRequestFormById.status !== "submitted")
      return res.status(400).json({ error: "Request Form must be submitted" });

    if (req.user.role !== "validator")
      return res
        .status(403)
        .json({ error: "No permission to validate this request form" });

    const updatedRequestForm = await RequestForm.findByIdAndUpdate(
      id,
      {
        status: "for_approval",
        validatedBy: req.user.id,
        validatedAt: Date.now(),
      },
      { new: true, runValidators: true },
    );

    res.status(200).json({
      status: "Success",
      message: "Request Form validated",
      data: {
        updatedRequestForm,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

const approveRequestForm = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ error: "Invalid ID" });

    const findRequestFormById = await RequestForm.findById(id);
    if (!findRequestFormById)
      return res.status(404).json({ error: "Request Form not found" });

    if (!["admin", "auditor", "pastor"].includes(req.user.role))
      return res.status(400).json({ error: "You cannot approve this request" });

    if (findRequestFormById.status !== "for_approval")
      return res
        .status(400)
        .json({ error: "This request form is not yet validated" });

    const approvedRequestForm = await RequestForm.findByIdAndUpdate(
      id,
      {
        status: "approved",
        approvedBy: req.user.id,
        approvedAt: Date.now(),
      },
      { new: true, runValidators: true },
    ).populate("approvedBy", "name role");

    const { name, role } = approvedRequestForm.approvedBy;

    const responseData = {
      rfNo: approvedRequestForm.id,
        status: approvedRequestForm.status,
        approvedAt: approvedRequestForm.approvedAt,
        approvedBy: { name, role},
    }

    res.status(200).json({
      status: "Success",
      message: "Request Form approved",
      data: responseData,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

const rejectRequestForm = async (req, res) => {
  try {
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

const receivedRequestForm = async (req, res) => {
  try {
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

export {
  getAllRequestForms,
  createRequestForm,
  submitRequestForm,
  updateRequestForm,
  deleteRequestForm,
  validateRequestForm,
  approveRequestForm,
  rejectRequestForm,
  receivedRequestForm,
};
