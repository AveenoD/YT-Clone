import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

// Cache the connection to reuse across serverless invocations
let isConnected = false;

const connectDB = async () => {
    mongoose.set("strictQuery", true);

    if (isConnected) {
        console.log("=> Using existing database connection");
        return;
    }

    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`, {
            // These options help with connection stability
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        isConnected = !!connectionInstance.connections[0].readyState;
        console.log(`✅ MongoDB connected! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("❌ MongoDB connection FAILED: ", error);
        // Don't exit the process in serverless, just throw the error
        throw error;
    }
};

export default connectDB;
