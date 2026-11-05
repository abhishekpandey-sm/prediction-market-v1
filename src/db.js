import mongoose from "mongoose";

const connectToDB = async() => {
    try{
        await mongoose.connect(process.env.MONGO_URI)
        console.log("Connected to Database")
    } catch(err){
        console.error("Connection to DB failed: ", err.message)
        throw err;
    }
}   

export default connectToDB;