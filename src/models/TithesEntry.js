import mongoose from "mongoose";

const tithesSchema = new mongoose.Schema(
  {
    entryDate: {
      type: Date,
      required: true,
    },
    serviceType: {
      type: String,
      // "Anniversay" was a typo carried since the original build, so it lived
      // in the data too. Corrected here; src/scripts/migrateServiceTypeSpelling.js
      // moves the existing rows, which must be run before this deploys or those
      // rows stop satisfying their own schema.
      enum: ["Sunday Service", "Special Service", "Anniversary Service"],
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

// getAllTithes filters by status + entryDate range and sorts by createdAt;
// its balance aggregation does $match { status: "approved" } (the status
// prefix of the compound index covers that). Reports filter entryDate.
tithesSchema.index({ status: 1, createdAt: -1 });
tithesSchema.index({ entryDate: 1 });

export const Tithes = mongoose.model("Tithes", tithesSchema);
