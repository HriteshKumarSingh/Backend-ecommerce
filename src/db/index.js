import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const connectDB = async() => {
  try {
    const connect = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    console.log("Database connection established successfully");
  } catch (error) {
    console.error("Unable to establish a database connection :: ", error);
  }
};

export { connectDB };
