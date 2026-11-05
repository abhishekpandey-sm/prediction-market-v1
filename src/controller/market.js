import Bet from "../models/bet"
import Market from "../models/market"
import User from "../models/user"
import walletEvent from "../models/walletEvent"
import { createMarketSchema, placeBetSchema } from "../types/market"


const getMarket = async(req, res) => {
    try{    
        const markets = await Market.find().populate("creatorId", "username")

        return res.status(200).json(markets)
    }  catch(error){
        return res.status(400).json({
            error: error.message
        })
    }
}


const createMarket = async(req, res) => {

    const session = await mongoose.startSession()

    try{
        const userId = req.userId

        const {success, data} = createMarketSchema.safeParse(req.body)

        if(!success){
            return res.status(400).json({
                error: "Invalid Credentials"
            })
        }


        if(data.expiry <= new Date()){
            return res.status(400).json({
                error: "Invalid Expiry"
            })
        }

        let market;

        await session.withTransaction(async() => {
            const user = await User.findOneAndUpdate({
                _id: userId,
                balance: {$gte: data.initialWager}
            },{
                $inc: {balance: -data.initialWager}
            },{
                new: true,
                session
            })


            if(!user){
                throw new Error("User not found or Insufficient Balance")
            }

            const [createdMarket] = await Market.create(
                [{
                    ...data,
                    cretorId: userId
                }],
                {session}
            )

            market = createdMarket

            await walletEvent.create(
                [{
                    userId: userId,
                    tx_type: "created",
                    externalId: {marketId: market._id},
                    amount: -data.initialWager
                }],
                {session}
            )
        })

        return res.status(201).json({
            id: market._id
        })
        
    } catch(error){
        return res.status(400).json({
            error: error.message
        })
    } finally{
        await session.endSession()
    }
}

const placeBet = async(req, res) => {
    const session = await mongoose.startSession();

    try{
        const {success, data} = placeBetSchema.safeParse(req.body)

        if(!success){
            return res.status(400).json({
                error: "Invalid Inputs"
            })
        }

        const { marketId, amount } = data

        const market = await Market.findById(marketId)

        if(!market){
            return res.status(404).json({
                error: "Market not Found"
            })
        }

        if(market.resolution !== null){
            return res.status(400).json({
                error: "Market already resolved"
            })
        }

        if(market.expiry <= new Date()){
            return res.status(400).json({
                error: "Market Expired"
            })
        }

        if(market.creatorId.toString() == req.userId){
            return res.status(400).json({
                error: "Creator cannot bet on there own market"
            })
        }

        let bet;


        await session.withTransaction(async() => {
            const updatedMarket = await Market.findOneAndUpdate(
                {
                    _id: marketId,
                    resolution: null,
                    expiry: { $gt : new Date() },
                    creatorId: { $ne : req.userId },
                    totalBetAmount: {
                        $lte : market.initialWager - amount
                    }
                },{
                    $inc: {totalBetAmount: amount}
                },{
                    new: true,
                    session
                }
            )

            if(!updatedMarket){
                throw new Error("Market is no longer available for this bet")
            }

            const user = User.findOneAndUpdate(
                {
                    _id: req.userId,
                    balance: {$gte: amount}
                }, {
                    $inc: {balance: -amount}
                }, {
                    new: true,
                    session
                }
            )

            if(!user){
                throw new Error("Insufficient Balance")
            }


            const [createdBet] = await bet.create(
                [{
                    userId: req.userId,
                    marketId,
                    betAmount: amount
                }],
                {session}
            )

            bet = createdBet

            await walletEvent.create(
                [{
                    userId: req.userId,
                    tx_type: "bet",
                    externalId: {
                        betId: bet._id,
                        marketId
                    },
                    amount: -amount
                }],
                { session }
            )
        } )

        return res.status(201).json({
            message: "Bet placed successfully",
            betId: bet._id
        })
    } catch(err){
        const statusCode = 
            err.name === "ZodError" ? 400 : 400

        return res.status(statusCode).json({
            error: err.message
        })
    } finally{
        await session.endSession();
    }
}


const getBets = async(req, res) => {
    try{
        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 10))
        const skip = (page - 1) * limit;


        const [bets, totalBets] = await Promise.all([
            Bet.find({ userId: req.userId })
                .populate("marketId", "title side expiry resolution")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),

            Bet.countDocuments({ userId: req.userId })
        ])

        return res.status(200).json({
            bets,
            pagation: {
                currentPage: page,
                totalPages: Math.ceil(totalBets / limit),
                totalBets,
                limit
            }
        })
    } catch(error){
        console.log("Error: ", error)
        return res.status(500).json({
            error: "Internal Server Error"
        })
    }
}

export {getMarket, createMarket, placeBet, getBets}