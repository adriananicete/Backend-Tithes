import mongoose from "mongoose";

// Atomic sequence for RF-#### and PCF-#### numbering.
//
// Both numbers used to be produced by reading the newest document and adding
// one. That is racy: two creates landing in the same moment read the same "last"
// row and both claim the next number. It also reissued a number whenever the
// newest document was deleted, quietly reusing a ledger identifier.
//
// $inc inside findOneAndUpdate is resolved by the database, so concurrent
// callers are serialised and each receives a distinct seq. The counter is the
// source of truth, not the documents.
const counterSchema = new mongoose.Schema(
  {
    // 'rfNo' | 'pcfNo'
    key: {
      type: String,
      required: true,
      unique: true,
    },
    seq: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

export const Counter = mongoose.model("Counter", counterSchema);
