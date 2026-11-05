import Bet from "../models/bet";
import Market from "../models/market";
import User from "../models/user";
import walletEvent from "../models/walletEvent";
import { resolveMarketSchema } from "../types/resolve";
import mongoose from "mongoose";


class appError extends Error {
    constructor(message, statusCode){
        super(message),
        this.statusCode = statusCode
    }
}

const resolveMarket = async(req, res) => {
    let session;

    try{
        const {marketId, resolution}  = resolveMarketSchema.parse(req.body)

        session = await mongoose.startSession();
        session.startTransaction()

        const market = await Market.findById(marketId).session(session);


        if(!market){
            throw new appError("Market not found", 404)
        }

        if(market.creatorId.toString() != req.userId.toString()){
            throw new appError("Only Creator can resolve", 403)
        }

        if(market.resolution != null){
            throw new appError("Market already resolved", 409)
        }

        const bets = await Bet.find({ marketId })
            .select("userId betAmount")
            .session(session)
            .lean()

        const totalBets = bets.reduce(
            (sum, bet) => sum + bet.betAmount,
            0
        )

        if(
            !Number.isFinite(market.initialWager) || market.initialWager <= 0 || !Number.isFinite(totalBets) ||
            totalBets < 0 ||
            bets.some(
                (bet) => !Number.isFinite(bet.betAmount) || 
                bet.betAmount <= 0 || 
                !bet.userId
            )
        ){
            throw new appError("Invalid Market Betting Data", 500)
        }

        if(totalBets > market.initialWager){
            throw new appError("Total bets exceed creator's wager", 500)
        }

        const updatedMarket = await market.findOneAndUpdate(
            {
                _id: marketId,
                creatorId: req.userId,
                resolution: null
            },
            {
                $set: {resolution}
            },
            {
                new: true,
                session
            }
        )

        if(!updatedMarket){
            throw new appError("Market already resolved or unavailable", 409)
        }

        async function creditUser(userId, amount, txType, externalId){
            if(amount <= 0) return;

            const result = await User.updateOne(
                { _id: userId },
                {
                    $inc: {balance: amount}
                },
                { session }
            )

            if(result.matchedCount !== 1){
                throw new appError("User account not found", 500)
            }

            await walletEvent.create(
                [   
                    {
                        userId,
                        tx_type: txType,
                        externalId,
                        amount
                    }
                ],
                { session }
            )
        }

        if(market.side == resolution){

            const creatorPayout = market.initialWager + totalBets

            await creditUser(
                market.creatorId,
                creatorPayout,
                "payout",
                { marketId }
            )
        } else {
            for (const bet of bets) {
                const bettorPayout = bet.betAmount * 2;

                await creditUser(
                    bet.userId,
                    bettorPayout,
                    "payout",
                    {
                        marketId,
                        betId: bet._id
                    }
                )
            }

            const refund = market.initialWager - totalBets;

            if (refund > 0){
                await creditUser(
                    market.creatorId,
                    refund,
                    "refund",
                    { marketId }
                )
            }
        }

        await session.commitTransaction();

        return res.json({
            message: "Market resolved Successfully",
            resolution
        })
        
    } catch(error){
        if(session?.inTransaction()){
            await session.abortTransaction();
        }

        if(error.name === "ZodError"){
            return res.status(400).json({
                error: error.message
            })
        }

        const statusCode = error.statusCode || 500;


        return res.status(statusCode).json({
            error:
                statusCode === 500
                    ? "Internal Server Error"
                    : error.message
        })

    } finally {
        if(session){
            await session.endSession()
        }
    }


}   

export default resolveMarket