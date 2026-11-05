import jwt from "jsonwebtoken"

function auth(req, res, next) {

    const token = req.headers.authorization?.split(" ")[1]

    if(!token){
        return res.status(400).json({
            error: "Token required"
        })
    }

    try{
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        )

        req.userId = decoded.userId

        next()
    } catch{
        return res.status(400).json({
            error: "Invalid Token"
        })
    }
}

export default auth