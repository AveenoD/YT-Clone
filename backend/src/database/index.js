import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
const connectDB = async () =>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log('⚙ MongoDB connected successfully');
        console.log("✅ Connected to DB:", mongoose.connection.name);
    } catch (error) {
        console.log('Error: MongoDB connection failed: ',error);
        
    }
    mongoose.connection.once("open", async () => {
  console.log("📦 Collection:", User.collection.name);
  console.log("📊 Count:", await User.countDocuments());
});
}

export default connectDB;