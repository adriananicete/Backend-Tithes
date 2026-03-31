import mongoose from "mongoose";

const requestFormSchema = new mongoose.Schema({
  rfNo: {
    type: String,
    required: true
  },
  entryDate: {
    type: Date,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  estimatedAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: [
      "draft",
      "submitted",
      "validated",
      "for_approval",
      "approved",
      "rejected",
      "disbursed",
    ],
    default: 'draft'
  },
  attachments: [{type: String}],
  validatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  validatedAt: {
    type: Date,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  approvedAt: {
    type: Date,
  },
  rejectionNote: {
    type: String,
  },
  rejectedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User'
},
rejectedAt: {
  type: Date
},
  voucherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Voucher'
  },
}, {timestamps: true});

export const RequestForm  = mongoose.model(
  "RequestForm",
  requestFormSchema,
);
