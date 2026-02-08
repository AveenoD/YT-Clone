import { Router } from "express"
import {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
} from "../controllers/like.controller.js"
import { authMiddleware } from "../middlewares/auth.middleware.js"

const router = Router()

// Toggle like on video
router.post("/toggle/video/:videoId", authMiddleware, toggleVideoLike)

// Toggle like on comment
router.post("/toggle/comment/:commentId", authMiddleware, toggleCommentLike)

// Toggle like on tweet
router.post("/toggle/tweet/:tweetId", authMiddleware, toggleTweetLike)

// Get all liked videos by user
router.get("/videos/:userId", getLikedVideos)

export default router