import express from "express"
import User from "../models/user"
import mongoose from "mongoose"
import bcrypt from "bcrypt"
import { onrampSchema, signinSchema, signupSchema } from "../types/auth"
import jwt from "jsonwebtoken"
import walletEvent from "../models/walletEvent"


const signup = async (req, res) => {
    try{
        const {success, data} = signupSchema.safeParse(req.body)

        if(!success){
            return res.status(401).json({
                message: "Invalid Credentials"
            })
        }

        const {username, password} = data

        const existingUser = await User.findOne({username})

        if(existingUser){
            return res.status(400).json({
                message: "Invalid Credentials"
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await User.create({
            username,
            password: hashedPassword,
            balance: 0
        })

        return res.status(201).json({
            id: user._id,
            message: "User Signedup Successfully"
        })
    } catch(err){
        return res.status(500).json({
            error: err.message
        })
    }
}

const signin = async (req, res) => {
    try{    
        const {success, data} = signinSchema.safeParse(req.body)

        if(!success){
            return res.status(400).json({
                error: "Invaid Credentials"
            })
        }

        const {username, password} = data

        const user = await User.findOne({username})

        if(!user){
            return res.status(404).json({
                error: "Invali Username or Password"
            })
        }

        const vaildPassword = await bcrypt.compare(password, user.password)

        if(!vaildPassword){
            return res.status(401).json({
                message: "Invalid Username or Password"
            })
        }   

        const token = jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET)

        return res.status(201).json({token})
    } catch(err){
        console.error("Error: ", err.message)
        return res.status(500).json({
            error: err.message || "Internal Server Error"
        })
    }
}


const onramp = async(req, res) => {
    try{    
        const userId = req.userId

        const {success, data} = onrampSchema.safeParse(req.body)

        if(!success){
            return res.status(400).json({
                error: "Invalid Inputs"
            })
        }

        const {amount} = data

        const user = await User.findByIdAndUpdate(userId, 
            {$inc: {balance: amount} },
            {new: true}
        )

        if(!user){
            return res.status(404).json({
                error: "User not found"
            })
        }

        await walletEvent.create({
            userId,
            tx_type: "onramp",
            amount
        })

        return res.status(201).json({
            balance: user.balance
        })

    }catch(err){
        return res.status(400).json({
            error: err.message
        })
    }    
}

const profile = async(req, res) => {
    try{
        const userId = req.userId

        const user = await User.findById(userId).select("-password")

        if(!user){
            return res.status(404).json({
                error: "User not found"
            })
        }

        return res.status(200).json(user)

    } catch(err){
        return res.status(400).json({
            error: err.message
        })
    }
}


const transaction = async(req, res) => {
    try{    
        const userId = req.userId

        const transactionDetails = await walletEvent.findById(userId)

        return res.status(200).json(transactionDetails)
    } catch(error){
        return res.status(400).json({
            error: error.message
        })
    }
}


export {signup, signin, onramp, profile, transaction}