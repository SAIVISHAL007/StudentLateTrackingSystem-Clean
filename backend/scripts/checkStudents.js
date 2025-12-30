import mongoose from "mongoose";
import dotenv from "dotenv";
import Student from "../models/student.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/studentLateTracking';

async function checkDatabase() {
  try {
    console.log("🔄 Connecting to MongoDB...");
    console.log("URI:", MONGODB_URI);
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000
    });
    
    console.log("✅ Connected to database:", mongoose.connection.name);
    
    // Get all students
    const allStudents = await Student.find({});
    console.log(`\n📊 Total students in database: ${allStudents.length}\n`);
    
    if (allStudents.length > 0) {
      console.log("📋 All students:");
      allStudents.forEach(s => {
        console.log(`  ${s.rollNo} - ${s.name}`);
        console.log(`    Year: ${s.year}, Branch: ${s.branch}, Semester: ${s.semester || 'N/A'}`);
        console.log(`    Late Days: ${s.lateDays}, Fines: ₹${s.fines}, Status: ${s.status}`);
        console.log(`    Late Logs: ${s.lateLogs?.length || 0} records`);
        console.log('');
      });
    } else {
      console.log("⚠️  No students found in database!");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

checkDatabase();
