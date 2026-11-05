import mongoose, {Schema} from "mongoose"

const walletEventSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    tx_type: {
        type: String,
        enum: ['onramp', 'created', 'bet', 'payout', 'refund'],
        required: true
    },
    externalId: {
        type: mongoose.Schema.Types.Mixed
    },
    amount: {
        type: Number,
        required: true
    }
})

const walletEvent = mongoose.model("walletEvent", walletEventSchema)

export default walletEvent