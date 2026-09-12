import { Tithes } from "../models/TithesEntry.js";
import { Expense } from "../models/Expense.js";

// The church's cash on hand: approved tithes minus everything spent.
//
// This is the number the UI shows under the amount field on a request form, and
// now also the number that gates how much may be requested. It lived only inside
// getAllTithes until a second caller needed it — the RF create handler, which
// until then took the frontend's word for it.
//
// Note what it does NOT subtract: approved request forms that have no voucher
// yet. Money only leaves the ledger when a voucher records its expense, so a
// request in flight is still counted as available.
export const getAvailableBalance = async () => {
  const [approvedAgg, expenseAgg] = await Promise.all([
    Tithes.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: null, sum: { $sum: "$total" } } },
    ]),
    Expense.aggregate([{ $group: { _id: null, sum: { $sum: "$amount" } } }]),
  ]);

  return (approvedAgg[0]?.sum ?? 0) - (expenseAgg[0]?.sum ?? 0);
};

// Peso formatting that matches what the client already prints in its own
// version of these messages, so the two never disagree in front of a user.
export const peso = (n) =>
  `₱${Number(n || 0).toLocaleString("en-PH", { maximumFractionDigits: 2 })}`;
