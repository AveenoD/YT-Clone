import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { isValidObjectId } from "mongoose"

// ============================================
// GET CHANNEL STATS
// ============================================

const getChannelStats = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    // ============================================
    // 1. VALIDATE CHANNEL ID
    // ============================================

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }

    // ============================================
    // 2. PARALLEL QUERIES FOR ALL METRICS
    // ============================================

    const [
        totalVideos,
        totalSubscribers,
        totalLikes,
        totalComments,
        totalViews,
        publishedVideos,
        unpublishedVideos
    ] = await Promise.all([
        // Total videos by channel
        Video.countDocuments({ owner: channelId }),
        
        // Total subscribers
        Subscription.countDocuments({ channel: channelId }),
        
        // Total likes on channel's videos
        Like.aggregate([
            {
                $match: {
                    video: { $exists: true, $ne: null }
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "video",
                    foreignField: "_id",
                    as: "videoDetails"
                }
            },
            { $unwind: "$videoDetails" },
            { $match: { "videoDetails.owner": new mongoose.Types.ObjectId(channelId) } },
            { $count: "totalLikes" }
        ]).then(result => result[0]?.totalLikes || 0),
        
        // Total comments on channel's videos
        Comment.aggregate([
            {
                $match: {
                    video: { $exists: true }
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "video",
                    foreignField: "_id",
                    as: "videoDetails"
                }
            },
            { $unwind: "$videoDetails" },
            { $match: { "videoDetails.owner": new mongoose.Types.ObjectId(channelId) } },
            { $count: "totalComments" }
        ]).then(result => result[0]?.totalComments || 0),
        
        // Total views on channel's videos
        Video.aggregate([
            { $match: { owner: new mongoose.Types.ObjectId(channelId) } },
            { $group: { _id: null, totalViews: { $sum: "$viewsCount" } } }
        ]).then(result => result[0]?.totalViews || 0),
        
        // Published videos count
        Video.countDocuments({ owner: channelId, isPublished: true }),
        
        // Unpublished videos count
        Video.countDocuments({ owner: channelId, isPublished: false })
    ])

    // ============================================
    // 3. BUILD STATS OBJECT
    // ============================================

    const channelStats = {
        totalVideos,
        totalSubscribers,
        totalLikes,
        totalComments,
        totalViews,
        publishedVideos,
        unpublishedVideos,
        averageViewsPerVideo: totalVideos > 0 ? Math.round(totalViews / totalVideos) : 0,
        engagementRate: totalVideos > 0 ? parseFloat(((totalLikes + totalComments) / totalVideos).toFixed(2)) : 0
    }

    // ============================================
    // 4. SEND RESPONSE
    // ============================================

    return res.status(200).json(
        new ApiResponse(
            200,
            channelStats,
            "Channel stats fetched successfully"
        )
    )
})

// ============================================
// GET CHANNEL VIDEOS
// ============================================

const getChannelVideos = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    const { page = 1, limit = 10, sortBy = "createdAt", sortType = "desc" } = req.query

    // ============================================
    // 1. VALIDATE CHANNEL ID
    // ============================================

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }

    // ============================================
    // 2. SETUP PAGINATION
    // ============================================

    const pageNum = parseInt(page, 10)
    const limitNum = Math.max(1, Math.min(parseInt(limit, 10), 50))
    const skip = (pageNum - 1) * limitNum

    // ============================================
    // 3. VALIDATE SORT PARAMETERS
    // ============================================

    const validSortFields = ["createdAt", "viewsCount", "duration", "title"]
    const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt"
    const sortDirection = sortType === "asc" ? 1 : -1

    // ============================================
    // 4. BUILD AGGREGATION PIPELINE
    // ============================================

    const pipeline = []

    // Match videos by channel owner
    pipeline.push({
        $match: {
            owner: new mongoose.Types.ObjectId(channelId),
            isPublished: true
        }
    })

    // Sort
    pipeline.push({
        $sort: { [sortField]: sortDirection }
    })

    // Pagination: skip
    pipeline.push({ $skip: skip })

    // Pagination: limit
    pipeline.push({ $limit: limitNum })

    // Lookup owner
    pipeline.push({
        $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner"
        }
    })

    // Unwind owner
    pipeline.push({
        $unwind: {
            path: "$owner",
            preserveNullAndEmptyArrays: true
        }
    })

    // Lookup like count
    pipeline.push({
        $lookup: {
            from: "likes",
            let: { videoId: "$_id" },
            pipeline: [
                {
                    $match: {
                        $expr: { $eq: ["$video", "$$videoId"] }
                    }
                },
                { $count: "count" }
            ],
            as: "likeCount"
        }
    })

    // Unwind likeCount
    pipeline.push({
        $unwind: {
            path: "$likeCount",
            preserveNullAndEmptyArrays: true
        }
    })

    // Lookup comment count
    pipeline.push({
        $lookup: {
            from: "comments",
            let: { videoId: "$_id" },
            pipeline: [
                {
                    $match: {
                        $expr: { $eq: ["$video", "$$videoId"] }
                    }
                },
                { $count: "count" }
            ],
            as: "commentCount"
        }
    })

    // Unwind commentCount
    pipeline.push({
        $unwind: {
            path: "$commentCount",
            preserveNullAndEmptyArrays: true
        }
    })

    // Project final fields
    pipeline.push({
        $project: {
            _id: 1,
            title: 1,
            description: 1,
            videoFile: 1,
            thumbnail: 1,
            duration: 1,
            viewsCount: 1,
            isPublished: 1,
            createdAt: 1,
            updatedAt: 1,
            owner: {
                _id: "$owner._id",
                username: "$owner.username",
                fullName: "$owner.fullName",
                avatar: "$owner.avatar"
            },
            likeCount: { $ifNull: ["$likeCount.count", 0] },
            commentCount: { $ifNull: ["$commentCount.count", 0] }
        }
    })

    // ============================================
    // 5. EXECUTE PARALLEL QUERIES
    // ============================================

    const [videos, totalVideos] = await Promise.all([
        Video.aggregate(pipeline),
        Video.countDocuments({ owner: channelId, isPublished: true })
    ])

    // ============================================
    // 6. BUILD PAGINATION METADATA
    // ============================================

    const totalPages = Math.ceil(totalVideos / limitNum)
    const hasMore = pageNum < totalPages

    // ============================================
    // 7. SEND RESPONSE
    // ============================================

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                videos,
                totalVideos,
                page: pageNum,
                limit: limitNum,
                totalPages,
                hasMore
            },
            "Channel videos fetched successfully"
        )
    )
})

export {
    getChannelStats,
    getChannelVideos
}