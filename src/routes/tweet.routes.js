import { Router } from "express"
import { 
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
} from "../controllers/tweet.controller.js"
import { authMiddleware } from "../middlewares/auth.middleware.js"

const router = Router()

// Create tweet (requires auth)
router.post("/tweets", authMiddleware, createTweet)

// Get user tweets (public)
router.get("/users/:userId/tweets", getUserTweets)

// Update tweet (requires auth)
router.patch("/tweets/:tweetId", authMiddleware, updateTweet)

// Delete tweet (requires auth)
router.delete("/tweets/:tweetId", authMiddleware, deleteTweet)

export default router