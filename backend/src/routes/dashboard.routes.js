import { Router } from "express"
import { getChannelStats, getChannelVideos } from "../controllers/dashboard.controller.js"
import { authMiddleware } from "../middlewares/auth.middleware.js"

const router = Router()

// Get channel stats (public or authenticated)
router.get("/channel/stats/:channelId", getChannelStats)

// Get channel videos (public)
router.get("/channel/videos/:channelId", getChannelVideos)

export default router