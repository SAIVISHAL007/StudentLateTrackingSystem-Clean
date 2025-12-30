import mongoose from "mongoose";
import dotenv from "dotenv";
import Student from "../models/student.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/studentLateTracking';

async function seedDatabase() {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000
    });
    console.log("✅ MongoDB Connected");

    // Read sample data
    const sampleDataPath = path.join(__dirname, "../data/sampleStudents.json");
    const rawData = fs.readFileSync(sampleDataPath, 'utf-8');
    const sampleStudents = JSON.parse(rawData);

    console.log(`\n📝 Loading ${sampleStudents.length} sample students...`);

    // Clear existing sample data (optional - comment out if you want to keep existing)
    const result = await Student.deleteMany({
      rollNo: { $in: sampleStudents.map(s => s.rollNo) }
    });
    console.log(`🗑️  Cleared ${result.deletedCount} existing records`);

    // Insert new sample data
    const inserted = await Student.insertMany(sampleStudents, { ordered: false });
    console.log(`✅ Successfully inserted ${inserted.length} students`);

    // Display summary
    console.log("\n📊 Database Summary:");
    const yearStats = await Student.aggregate([
      {
        $group: {
          _id: "$year",
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const branchStats = await Student.aggregate([
      {
        $group: {
          _id: "$branch",
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    console.log("\n📅 Students by Year:");
    yearStats.forEach(stat => {
      console.log(`   Year ${stat._id}: ${stat.count} students`);
    });

    console.log("\n🏢 Students by Branch:");
    branchStats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} students`);
    });

    const total = await Student.countDocuments();
    console.log(`\n✨ Total Students in Database: ${total}`);
    console.log("\n✅ Database seeding completed successfully!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error.message);
    process.exit(1);
  }
}

seedDatabase();
