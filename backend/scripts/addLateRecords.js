import mongoose from "mongoose";
import dotenv from "dotenv";
import Student from "../models/student.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/studentLateTracking';

async function addLateRecords() {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000
    });
    console.log("✅ MongoDB Connected");

    // Get all students
    const students = await Student.find().limit(10); // Add late records to first 10 students
    
    if (students.length === 0) {
      console.log("⚠️  No students found. Please seed the database first.");
      process.exit(0);
    }

    console.log(`\n📝 Adding late records to ${students.length} students...\n`);

    let updatedCount = 0;

    // Add late records from the past week
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const lateDays = Math.floor(Math.random() * 5) + 1; // 1-5 late days
      
      // Create late logs from past 7 days
      const lateLogs = [];
      for (let day = 0; day < lateDays; day++) {
        const date = new Date();
        date.setDate(date.getDate() - day);
        date.setHours(0, 0, 0, 0);
        lateLogs.push({ date });
      }

      // Calculate fines based on unified model (2 excuse days + ₹5/day)
      let totalFine = 0;
      if (lateDays > 2) {
        totalFine = (lateDays - 2) * 5; // ₹5 per day after 2 excuse days
      }

      // Update student
      student.lateDays = lateDays;
      student.lateLogs = lateLogs;
      student.fines = totalFine;
      student.status = lateDays <= 2 ? 'excused' : 'fined';
      student.excuseDaysUsed = Math.min(lateDays, 2);
      
      if (lateDays > 5) {
        student.alertFaculty = true;
      }

      await student.save();
      updatedCount++;

      console.log(`✅ ${student.name} (${student.rollNo}): ${lateDays} late days, ₹${totalFine} fine`);
    }

    console.log(`\n✨ Successfully added late records to ${updatedCount} students!`);
    
    // Show summary
    const stats = await Student.aggregate([
      {
        $group: {
          _id: null,
          totalStudents: { $sum: 1 },
          studentsWithLate: {
            $sum: { $cond: [{ $gt: ["$lateDays", 0] }, 1, 0] }
          },
          totalLateDays: { $sum: "$lateDays" },
          totalFines: { $sum: "$fines" }
        }
      }
    ]);

    if (stats.length > 0) {
      const stat = stats[0];
      console.log("\n📊 Database Summary:");
      console.log(`   Total Students: ${stat.totalStudents}`);
      console.log(`   Students with Late: ${stat.studentsWithLate}`);
      console.log(`   Total Late Days: ${stat.totalLateDays}`);
      console.log(`   Total Fines: ₹${stat.totalFines}`);
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error adding late records:", error.message);
    process.exit(1);
  }
}

addLateRecords();
