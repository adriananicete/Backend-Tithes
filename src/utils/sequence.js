import { Counter } from "../models/Counter.js";

// Highest number already issued for a field, read straight off the documents.
// Used only to seed the counter the first time; after that the counter is the
// source of truth and the collection is never scanned again.
const highestIssued = async (model, field) => {
  const docs = await model.find({ [field]: { $ne: null } }).select(field).lean();

  let max = 0;
  for (const doc of docs) {
    // "RF-0042" -> 42. Parsed rather than sorted: padStart(4) stops padding at
    // 10000, so a lexicographic sort would rank "RF-10000" below "RF-9999".
    const n = parseInt(String(doc[field]).split("-")[1], 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return max;
};

// Claims the next number for `key`, seeding from the existing documents on the
// very first call so numbering continues where the old generator left off —
// otherwise the first request form after deploy would be RF-0001 again and
// collide with the live history.
//
// Trade-off worth stating: the number is claimed before the document is saved,
// so a create that fails afterwards leaves a gap. Gaps are harmless in a ledger;
// duplicates are not.
export const nextNumber = async (key, prefix, { model, field }) => {
  const bump = () =>
    Counter.findOneAndUpdate(
      { key },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );

  const existing = await Counter.findOne({ key }).lean();
  if (!existing) {
    const base = await highestIssued(model, field);
    try {
      await Counter.create({ key, seq: base });
    } catch (error) {
      // Another request seeded it first. Same base, so nothing to reconcile.
      if (error?.code !== 11000) throw error;
    }
  }

  let counter;
  try {
    counter = await bump();
  } catch (error) {
    // The upsert has its own narrow race: two callers can both try to insert a
    // missing counter and the unique index rejects one. By then the document
    // exists, so a single retry takes the plain $inc path and succeeds.
    if (error?.code !== 11000) throw error;
    counter = await bump();
  }

  return `${prefix}-${String(counter.seq).padStart(4, "0")}`;
};
