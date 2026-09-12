// Service-type data cleanup, and the gate that has to pass before the corrected
// enum in models/TithesEntry.js is safe to deploy.
//
// Two things went wrong independently:
//
//   1. "Anniversay Service" — a typo carried in the schema since the original
//      build, so it is in the data too.
//   2. The client's dropdown and the server's enum drifted apart completely.
//      Rows exist with values the schema never allowed (they predate the enum,
//      or were written by a path that skipped validation).
//
// Correcting the enum without moving those rows is the one genuinely bad
// outcome: they would no longer satisfy their own schema and would fail
// validation on their next full save. So this script reports what is actually
// in the database, applies MAPPING, and then FAILS LOUDLY if anything is left
// that the new enum will not accept.
//
// Idempotent — a second run reports 0 rows to move.
//
// Run against the target database:
//   npm run migrate:service-type -- --dry    (read-only: report only)
//   npm run migrate:service-type             (apply MAPPING)
//
// Check which database CONNECTION_STRING points at before running it for real.

import mongoose from "mongoose";
import { pathToFileURL } from "node:url";
import { connectDB } from "../config/db.js";
import { Tithes } from "../models/TithesEntry.js";

// What the corrected schema accepts. Keep in step with TithesEntry.serviceType.
export const ALLOWED_SERVICE_TYPES = [
  "Sunday Service",
  "Special Service",
  "Anniversary Service",
];

// old value -> new value. Extend this when the report below turns up a value
// that is not in ALLOWED_SERVICE_TYPES; every such row needs a decision, and
// guessing one here would rewrite somebody's financial record.
export const MAPPING = {
  "Anniversay Service": "Anniversary Service",
};

// What is actually stored, with counts and money, so a decision about an
// unexpected value can be made against its real weight.
export const reportServiceTypes = async () => {
  const rows = await Tithes.aggregate([
    { $group: { _id: "$serviceType", count: { $sum: 1 }, total: { $sum: "$total" } } },
    { $sort: { count: -1 } },
  ]);

  return rows.map((r) => ({
    serviceType: r._id,
    count: r.count,
    total: r.total,
    allowed: ALLOWED_SERVICE_TYPES.includes(r._id),
    mapped: Object.prototype.hasOwnProperty.call(MAPPING, r._id),
  }));
};

// The caller owns the connection. Separated from the command-line wrapper so a
// check can call it against rows it planted — a migration that runs once, on
// real financial data, is the last place to accept untested code.
export const applyMapping = async () => {
  const applied = [];

  for (const [from, to] of Object.entries(MAPPING)) {
    const before = await Tithes.countDocuments({ serviceType: from });
    if (before === 0) continue;

    // updateMany bypasses the enum validator, which is the point — the reason
    // these rows need moving is precisely that they no longer satisfy it.
    const res = await Tithes.updateMany(
      { serviceType: from },
      { $set: { serviceType: to } },
    );

    // Counted again rather than trusting modifiedCount, so the result reports
    // what is in the database and not what the driver said it did.
    const remaining = await Tithes.countDocuments({ serviceType: from });
    applied.push({ from, to, before, modified: res.modifiedCount, remaining });
  }

  return applied;
};

// Only when executed directly, so importing this file runs nothing.
const executedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (executedDirectly) {
  const dryRun = process.argv.includes("--dry");

  try {
    await connectDB();

    const before = await reportServiceTypes();
    console.log(`\nservice types currently in the database${dryRun ? " (dry run)" : ""}:`);
    for (const r of before) {
      const flag = r.allowed ? "ok" : r.mapped ? "will be migrated" : "NOT IN ENUM";
      console.log(
        `  ${String(r.count).padStart(4)} rows  ₱${String(r.total).padStart(10)}  ` +
          `${JSON.stringify(r.serviceType)}  [${flag}]`,
      );
    }

    if (!dryRun) {
      const applied = await applyMapping();
      if (applied.length === 0) {
        console.log("\nnothing to migrate.");
      } else {
        for (const a of applied) {
          console.log(
            `\nmigrated ${a.modified}/${a.before} rows ` +
              `${JSON.stringify(a.from)} -> ${JSON.stringify(a.to)}` +
              (a.remaining ? ` — ${a.remaining} STILL REMAIN` : ""),
          );
        }
      }
    }

    // The gate. Anything the corrected enum will not accept is named here, and
    // the exit code says the deploy is not safe yet.
    const after = await reportServiceTypes();
    const stragglers = after.filter((r) => !r.allowed);

    if (stragglers.length === 0) {
      console.log("\nPASS — every row matches the corrected enum.");
    } else {
      console.error(
        `\nFAIL — ${stragglers.length} service type(s) the corrected enum rejects:`,
      );
      for (const s of stragglers) {
        console.error(`  ${JSON.stringify(s.serviceType)} — ${s.count} rows, ₱${s.total}`);
      }
      console.error(
        "\nAdd each to MAPPING (or widen ALLOWED_SERVICE_TYPES and the model enum)\n" +
          "before deploying the corrected enum. Until then those rows do not satisfy\n" +
          "their own schema.",
      );
      process.exitCode = 1;
    }
  } catch (error) {
    console.error("migration failed:", error?.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState) await mongoose.disconnect();
  }
}
