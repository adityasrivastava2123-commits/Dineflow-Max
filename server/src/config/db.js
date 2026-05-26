import mongoose from "mongoose";
import logger from "../utils/logger.js";

let mongoConnection = null;

export const connectDB = async () => {
  try {
    if (mongoConnection) {
      return mongoConnection;
    }

    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error("MONGODB_URI environment variable is not set");
    }

    mongoConnection = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      socketTimeoutMS: 45000,
    });

    logger.info("MongoDB Atlas connected successfully");
    return mongoConnection;
  } catch (error) {
    logger.error("MongoDB connection error:", error);
    throw error;
  }
};

export const disconnectDB = async () => {
  try {
    if (mongoConnection) {
      await mongoose.disconnect();
      mongoConnection = null;
      logger.info("MongoDB disconnected");
    }
  } catch (error) {
    logger.error("MongoDB disconnection error:", error);
    throw error;
  }
};

mongoose.connection.on("connected", () => {
  logger.info("Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (error) => {
  logger.error("Mongoose connection error:", error);
});

mongoose.connection.on("disconnected", () => {
  logger.warn("Mongoose disconnected from MongoDB");
});
