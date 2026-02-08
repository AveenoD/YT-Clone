import { Router } from "express"
import {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
} from "../controllers/video.controllers.js"
import  {verifyJWT as authMiddleware}  from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/multer.middleware.js"

const router = Router()

// ============================================
// PUBLIC ROUTES (No Authentication Required)
// ============================================

// Get all videos with search, sort, pagination
router.get(
    "/",
    getAllVideos
)

// Get video by ID (optional authentication)
router.get(
    "/:videoId",
    getVideoById
)

// ============================================
// PROTECTED ROUTES (Authentication Required)
// ============================================

// Publish a new video
router.post(
    "/publish",
    authMiddleware,
    upload.fields([
        { name: "videoFile", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 }
    ]),
    publishAVideo
)

// Update video details (title, description, thumbnail)
router.patch(
    "/:videoId",
    authMiddleware,
    upload.single("thumbnail"), // Optional thumbnail update
    updateVideo
)

// Delete video
router.delete(
    "/:videoId",
    authMiddleware,
    deleteVideo
)

// Toggle publish status (publish/unpublish)
router.patch(
    "/:videoId/publish-status",
    authMiddleware,
    togglePublishStatus
)

export default router