import mongoose from "mongoose";
import dotenv from "dotenv";
import Student from "../models/student.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/studentLateTracking';

// List of test student roll numbers
const TEST_ROLL_NUMBERS = [
  "CSE001", "CSE002", "CSE003", "CSE004", "CSE005",
  "CSE101", "CSE102", "CSE103",
  "ECE001", "ECE002", "ECE003", "ECE101",
  "EEE001", "EEE002",
  "MECH001"
];

async function cleanupTestData() {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to database:", mongoose.connection.name);

    console.log("\n🗑️  Removing test/sample students...");
    
    const result = await Student.deleteMany({
      rollNo: { $in: TEST_ROLL_NUMBERS }
    });

    console.log(`✅ Removed ${result.deletedCount} test students`);
    
    // Show remaining students
    const remaining = await Student.countDocuments();
    console.log(`\n📊 Remaining students in database: ${remaining}`);
    
    if (remaining > 0) {
      console.log("\n📋 Remaining students:");
      const students = await Student.find().select("rollNo name year branch").lean();
      students.forEach(s => {
        console.log(`  ${s.rollNo} - ${s.name} (Year: ${s.year}, Branch: ${s.branch})`);
      });
    }

    console.log("\n✅ Cleanup completed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

cleanupTestData();
