import mongoose from "mongoose";

const tithesSchema = new mongoose.Schema(
  {
    entryDate: {
      type: Date,
      required: true,
    },
    serviceType: {
      type: String,
      enum: ["Sunday Service", "Special Service", "Anniversay Service"],
      required: true,
    },
    denominations: [
      {
        bill: Number,
        qty: Number,
        subtotal: Number,
      },
    ],
    total: {
      type: Number,
      required: true,
    },
    remarks: {
      type: String,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: 'pending',
      required: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
    rejectionNote: {
      type: String,
    },
  },
  { timestamps: true },
);

export const Tithes = mongoose.model("Tithes", tithesSchema);
