import mongoose from "mongoose";
import { RequestForm } from "../models/RequestForm.js";

const generateRFNo = async () => {
  const lastRF = await RequestForm.findOne().sort({ createdAt: -1 });
  let newNumber = 1;

  if (lastRF && lastRF.rfNo) {
    const lastNum = parseInt(lastRF.rfNo.split("-")[1], 10);
    if (!isNaN(lastNum)) newNumber = lastNum + 1;
  }

  return `RF-${String(newNumber).padStart(4, "0")}`;
};

const getAllRequestForms = async (req, res) => {
  try {
    const requestForms = await RequestForm.find()
      .populate("requestedBy", "name role")
      .populate("category", "name type")
      .populate("approvedBy", "name role")
      .populate("validatedBy", "name role");

      if(requestForms.length === 0) return res.status(404).json({ error: "Request form empty" });

    res.status(200).json({
      status: "Success",
      count: requestForms.length,
      data: requestForms,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

const createRequestForm = async (req, res) => {
  try {
    const { entryDate, category, estimatedAmount, attachments } = req.body;

    if (!entryDate)
      return res.status(400).json({ error: "Entry Date required!" });
    if (!category) return res.status(400).json({ error: "Category required!" });
    if (!estimatedAmount)
      return res.status(400).json({ error: "Estimated Amount required!" });

    const amount = Number(estimatedAmount);
    if (isNaN(amount))
      return res
        .status(400)
        .json({ error: "Estimated Amount must be a number" });
    if (amount <= 0)
      return res
        .status(400)
        .json({ error: "Estimated Amount must be greater than 0" });

    const newRequestForm = new RequestForm({
      rfNo: await generateRFNo(),
      entryDate,
      category,
      estimatedAmount: amount,
      requestedBy: req.user.id,
      attachments: attachments || [],
    });

    await newRequestForm.save();

    res.status(201).json({
      status: "Success",
      message: "Request Form Created",
      data: newRequestForm,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

const submitRequestForm = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ error: "Invalid ID" });

    const requestForm = await RequestForm.findById(id);
    if (!requestForm)
      return res.status(404).json({ error: "Request form not found" });

    if (requestForm.requestedBy.toString() !== req.user.id)
      return res.status(403).json({ error: "You cannot submit this request" });

    if (requestForm.status !== "draft")
      return res
        .status(400)
        .json({ error: "Only draft requests can be submitted" });

    requestForm.status = "submitted";
    await requestForm.save();

    res.status(200).json({
      status: "Success",
      message: "Request Form Submitted",
      data: requestForm,
    });
  } catch (error) {
    console.error(error);
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

    const allowedUpdates = [
      "entryDate",
      "category",
      "estimatedAmount",
      "attachments",
    ];
    const updates = {};
    allowedUpdates.forEach((field) => {
      if (body[field] !== undefined) updates[field] = body[field];
    });

    if (updates.estimatedAmount !== undefined) {
      const amount = Number(updates.estimatedAmount);
      if (isNaN(amount) || amount <= 0)
        return res
          .status(400)
          .json({ error: "Estimated Amount must be a positive number" });
      updates.estimatedAmount = amount;
    }

    const updatedRequestForm = await RequestForm.findByIdAndUpdate(
      id,
      updates,
      {
        new: true,
        runValidators: true,
      },
    );

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

    if (!["validator", "auditor", "admin"].includes(req.user.role))
      return res
        .status(403)
        .json({ error: "No permission to validate this request form" });

    const updatedRequestForm = await RequestForm.findByIdAndUpdate(
      id,
      {
        $set: {
          status: "for_approval",
          validatedBy: req.user.id,
          validatedAt: Date.now(),
        },
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
      return res.status(403).json({ error: "You cannot approve this request" });

    if (findRequestFormById.status !== "for_approval")
      return res
        .status(400)
        .json({ error: "This request form is not yet validated" });

    const approvedRequestForm = await RequestForm.findByIdAndUpdate(
      id,
      {
        $set: {
          status: "approved",
          approvedBy: req.user.id,
          approvedAt: Date.now(),
        },
      },
      { new: true, runValidators: true },
    ).populate("approvedBy", "name role");

    const { name, role } = approvedRequestForm.approvedBy;

    const responseData = {
      rfNo: approvedRequestForm.rfNo,
      status: approvedRequestForm.status,
      approvedAt: approvedRequestForm.approvedAt,
      approvedBy: { name, role },
    };

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
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ error: "Invalid ID" });

    const findRequestFormById = await RequestForm.findById(id);
    if (!findRequestFormById)
      return res.status(404).json({ error: "Request form not found" });

    if (!["admin", "validator", "auditor", "pastor"].includes(req.user.role))
      return res.status(403).json({ error: "Forbidden" });

    if (
      !["submitted", "for_approval"].includes(
        findRequestFormById.status,
      )
    )
      return res.status(400).json({ error: "Cannot reject this status" });

    const { rejectionNote } = req.body;
    if (!rejectionNote)
      return res.status(400).json({ error: "Reason for Rejection" });

    const rejectedRequestForm = await RequestForm.findByIdAndUpdate(
      id,
      {
        $set: {
          status: "rejected",
          rejectionNote: rejectionNote,
          rejectedBy: req.user.id,
          rejectedAt: Date.now(),
        },
      },
      { new: true, runValidators: true },
    ).populate("rejectedBy", "name role");

    res.status(200).json({
      status: "Success",
      message: `Request Form rejected`,
      data: {
        rfNo: rejectedRequestForm.rfNo,
        status: rejectedRequestForm.status,
        rejectedAt: rejectedRequestForm.rejectedAt,
        rejectedBy: {
          name: rejectedRequestForm.rejectedBy.name,
          role: rejectedRequestForm.rejectedBy.role,
        },
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

const receivedRequestForm = async (req, res) => {
  try {
    const { id } = req.params;
    if(!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Bad Request'});

    const findRequestFormById = await RequestForm.findById(id);
    if(!findRequestFormById) return res.status(404).json({error: 'Request form not found'});

    if(findRequestFormById.requestedBy.toString() !== req.user.id) return res.status(403).json({error: 'Only the requestor can confirm receipt'});

    if(findRequestFormById.status !== 'approved') return res.status(400).json({error: 'Request form must be approved before confirming receipt'});

    const disbursedRequestForm = await RequestForm.findByIdAndUpdate(id, { $set: { status: 'disbursed'}}, {new: true, runValidators: true});

    res.status(200).json({
      status: 'Success',
      message: `${disbursedRequestForm.rfNo} disbursed successfully`
    });


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
