import jwt from 'jsonwebtoken'

const authUser = async (req, res, next) => {
    try {
        const { token } = req.headers

        if (!token) {
            return res.json({ success: false, message: 'Not Authorized Login Again' })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        // ✅ Fix: initialize req.body if undefined
        if (!req.body) {
            req.body = {}
        }

        req.body.userId = decoded.id

        next()

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export default authUser