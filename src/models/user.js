import { Schema } from "mongoose"
import { required } from "zod/mini"

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    balance: {
        type: Number,
        default: 0
    }
})

const User = mongoose.model("User", userSchema)

export default User