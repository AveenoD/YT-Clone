import { Router } from "express"
import {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
} from "../controllers/comment.controller.js"
import { authMiddleware } from "../middlewares/auth.middleware.js"

const router = Router()

// Get all comments for a video (with pagination)
router.get("/video/:videoId", getVideoComments)

// Add a comment to a video
router.post("/video/:videoId", authMiddleware, addComment)

// Update a comment
router.patch("/:commentId", authMiddleware, updateComment)

// Delete a comment
router.delete("/:commentId", authMiddleware, deleteComment)

export default router