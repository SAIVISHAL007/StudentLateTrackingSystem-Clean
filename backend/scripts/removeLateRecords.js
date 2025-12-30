import mongoose from "mongoose";
import dotenv from "dotenv";
import Student from "../models/student.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/studentLateTracking';

async function removeLateRecords() {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000
    });
    console.log("✅ MongoDB Connected");

    console.log("\n📝 Removing all late records from database...\n");

    // Update all students - clear late records and related fields
    const result = await Student.updateMany(
      {},
      {
        $set: {
          lateLogs: [],
          lateDays: 0,
          fines: 0,
          status: 'normal',
          excuseDaysUsed: 0,
          consecutiveLateDays: 0,
          fineHistory: [],
          alertFaculty: false,
          limitExceeded: false
        }
      }
    );

    console.log(`✅ Cleared late records from ${result.modifiedCount} students`);

    // Show summary
    const stats = await Student.aggregate([
      {
        $group: {
          _id: null,
          totalStudents: { $sum: 1 },
          totalLateDays: { $sum: "$lateDays" },
          totalFines: { $sum: "$fines" }
        }
      }
    ]);

    if (stats.length > 0) {
      const stat = stats[0];
      console.log("\n📊 Database Summary:");
      console.log(`   Total Students: ${stat.totalStudents}`);
      console.log(`   Total Late Days: ${stat.totalLateDays}`);
      console.log(`   Total Fines: ₹${stat.totalFines}`);
    }

    console.log("\n✨ Successfully removed all late records!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error removing late records:", error.message);
    process.exit(1);
  }
}

removeLateRecords();
