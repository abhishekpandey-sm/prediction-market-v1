import {Schema} from "mongoose"

const marketSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    initialWager: {
        type: Number,
        required: true
    },
    side: {
        type: String,
        enum: ['yes', 'no'],
        required: true
    },
    creatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    expiry: {
        type: Date,
        required: true
    },
    resolution: {
        type: String,
        enum: ['yes', 'no', null],
        default: null
    }
})

const Market = mongoose.model('Market', marketSchema)

export default Market