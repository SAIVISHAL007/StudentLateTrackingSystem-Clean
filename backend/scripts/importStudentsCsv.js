import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import XLSX from "xlsx";
import Student from "../models/student.js";

dotenv.config();

const DEFAULT_FILE = path.join(process.cwd(), "data", "students_import.csv");
const ALLOWED_BRANCHES = new Set([
  "CSE",
  "CSM",
  "CSD",
  "CSC",
  "ECE",
  "EEE",
  "MECH",
  "CIVIL",
  "IT"
]);

const args = process.argv.slice(2);
const getArgValue = (flag, fallback = null) => {
  const index = args.indexOf(flag);
  if (index === -1 || index + 1 >= args.length) return fallback;
  return args[index + 1];
};

const hasFlag = (flag) => args.includes(flag);

const filePath = getArgValue("--file", DEFAULT_FILE);
const dryRun = hasFlag("--dry-run");
const batchSize = Number(getArgValue("--batch-size", "500"));

const MONGODB_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  "mongodb://localhost:27017/studentLateTracking";

const normalizeRow = (row, rowIndex) => {
  const rollNo = String(row["Roll no"] || row["Roll No"] || row.rollNo || "")
    .trim()
    .toUpperCase();
  const name = String(row["Name of the Student"] || row["Name of the student"] || row.Name || row.name || "").trim();
  const year = Number(row.Year || row.year || 0);
  const semester = Number(row.Sem || row.semester || row.sem || 0);
  const branch = String(row.Branch || row.branch || "").trim().toUpperCase();
  const section = String(row.Section || row.section || "").trim().toUpperCase();

  const errors = [];
  if (!rollNo) errors.push("Missing roll number");
  if (!name) errors.push("Missing name");
  if (!year || year < 1 || year > 4) errors.push("Invalid year");
  if (!semester || semester < 1 || semester > 8) errors.push("Invalid semester");
  if (!branch || !ALLOWED_BRANCHES.has(branch)) errors.push("Invalid branch");
  if (!section) errors.push("Missing section");

  return {
    rowIndex,
    data: { rollNo, name, year, semester, branch, section },
    errors
  };
};

const loadCsv = (inputPath) => {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`CSV file not found: ${inputPath}`);
  }

  const workbook = XLSX.readFile(inputPath, { raw: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet, { defval: "" });
};

const buildBulkOps = (rows) =>
  rows.map((row) => ({
    updateOne: {
      filter: { rollNo: row.rollNo },
      update: {
        $set: {
          name: row.name,
          year: row.year,
          semester: row.semester,
          branch: row.branch,
          section: row.section
        },
        $setOnInsert: {
          lateDays: 0,
          excuseDaysUsed: 0,
          fines: 0,
          consecutiveLateDays: 0,
          limitExceeded: false,
          status: "normal",
          alertFaculty: false
        }
      },
      upsert: true
    }
  }));

const summarizeErrors = (errors, max = 10) => {
  if (errors.length === 0) return;
  console.log(`\n[Warning] ${errors.length} invalid rows (showing up to ${max}):`);
  errors.slice(0, max).forEach((entry) => {
    console.log(`   Row ${entry.rowIndex}: ${entry.errors.join(", ")}`);
  });
};

const runImport = async () => {
  console.log("\n[Import] Student CSV Import\n");
  console.log(`File: ${filePath}`);
  console.log(`Dry Run: ${dryRun ? "Yes" : "No"}`);
  console.log(`Batch Size: ${batchSize}`);

  const rows = loadCsv(filePath);
  console.log(`\n[Parse] Rows found: ${rows.length}`);

  const normalized = rows.map((row, index) => normalizeRow(row, index + 2));
  const validRows = normalized.filter((row) => row.errors.length === 0);
  const invalidRows = normalized.filter((row) => row.errors.length > 0);

  console.log(`[Validation] Valid rows: ${validRows.length}`);
  console.log(`[Validation] Invalid rows: ${invalidRows.length}`);
  summarizeErrors(invalidRows);

  if (dryRun) {
    console.log("\n[DryRun] Complete. No data written.");
    return;
  }

  if (validRows.length === 0) {
    console.log("\n[Warning] No valid rows to import. Aborting.");
    return;
  }

  console.log("\n[Database] Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000
  });
  console.log("[Database] MongoDB Connected");

  let processed = 0;
  let upserted = 0;
  let modified = 0;

  for (let i = 0; i < validRows.length; i += batchSize) {
    const batch = validRows.slice(i, i + batchSize).map((row) => row.data);
    const bulkOps = buildBulkOps(batch);
    const result = await Student.bulkWrite(bulkOps, { ordered: false });

    processed += batch.length;
    upserted += result.upsertedCount || 0;
    modified += result.modifiedCount || 0;

    console.log(`[Batch] ${i / batchSize + 1}: ${batch.length} records processed`);
  }

  console.log("\n[Summary] Import Statistics:");
  console.log(`   Processed: ${processed}`);
  console.log(`   Upserted: ${upserted}`);
  console.log(`   Updated: ${modified}`);
  console.log("\n[Success] Import completed successfully.");

  await mongoose.disconnect();
};

runImport().catch((error) => {
  console.error("\n[Error] Import failed:", error.message);
  process.exit(1);
});
