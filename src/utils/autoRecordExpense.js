import { Expense } from "../models/Expense.js";

// Records the expense that a voucher represents. This is the ONLY automatic
// path from a request to the expense ledger.
//
// It used to swallow its own errors with a console.error, which meant a voucher
// could exist with no matching expense row while the request still returned 200.
// The consequence is not just a missing row: the expense ledger is half of
// availableBalance, so a swallowed failure OVERSTATES what the church has left,
// and the next request form is approved against money that is already spent.
//
// So it throws now. createVoucher rolls the voucher back rather than leaving a
// half-recorded disbursement behind.
export const autoRecordExpense = async (newVoucher) => {
  const newExpense = new Expense({
    source: "voucher",
    linkedId: newVoucher._id,
    amount: newVoucher.amount,
    category: newVoucher.category,
    date: newVoucher.date,
    recordedBy: newVoucher.createdBy,
  });

  await newExpense.save();
  return newExpense;
};
