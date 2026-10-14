const mongoose = require('mongoose');
const { MONGO_URI } = require('./env');

const connectDB = async (retries = 3, delayMs = 3000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(MONGO_URI);
      console.log(`MongoDB connected: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      console.error(
        `MongoDB connection attempt ${attempt}/${retries} failed: ${error.message}`
      );
      if (attempt < retries) {
        console.log(`Retrying MongoDB connection in ${delayMs / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        console.error('All MongoDB connection attempts exhausted. Exiting process.');
        process.exit(1);
      }
    }
  }
};

module.exports = connectDB;
