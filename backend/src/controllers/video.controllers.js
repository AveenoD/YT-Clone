import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.models.js"
import { User } from "../models/user.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import uploadOnCloudinary from "../utils/cloudinary.js"
import { Comment } from "../models/comment.models.js"
import { Like } from "../models/like.models.js"
import fs from "fs"
import { Subscription } from "../models/subscriptions.models.js"

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

    const pageNum = parseInt(page, 10)
    const limitNum = Math.max(1, Math.min(parseInt(limit, 10), 50))
    const validSortFields = ["createdAt", "viewsCount", "duration", "title"]
    const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt"
    const sortDirection = sortType === "asc" ? 1 : -1

    const matchConditions = { isPublished: true }

    if (query && query.trim()) {
        const searchQuery = query.trim()
        matchConditions.$or = [
            { title: { $regex: searchQuery, $options: "i" } },
            { description: { $regex: searchQuery, $options: "i" } }
        ]
    }

    if (userId && isValidObjectId(userId)) {
        matchConditions.owner = new mongoose.Types.ObjectId(userId)
    }

    const pipeline = []

    pipeline.push({ $match: matchConditions })
    pipeline.push({ $sort: { [sortField]: sortDirection } })

    pipeline.push({
        $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner"
        }
    })

    pipeline.push({
        $unwind: {
            path: "$owner",
            preserveNullAndEmptyArrays: true
        }
    })

    pipeline.push({
        $lookup: {
            from: "likes",
            let: { videoId: "$_id" },
            pipeline: [
                { $match: { $expr: { $eq: ["$video", "$$videoId"] } } },
                { $count: "count" }
            ],
            as: "likeCount"
        }
    })

    pipeline.push({
        $unwind: {
            path: "$likeCount",
            preserveNullAndEmptyArrays: true
        }
    })

    pipeline.push({
        $lookup: {
            from: "comments",
            let: { videoId: "$_id" },
            pipeline: [
                { $match: { $expr: { $eq: ["$video", "$$videoId"] } } },
                { $count: "count" }
            ],
            as: "commentCount"
        }
    })

    pipeline.push({
        $unwind: {
            path: "$commentCount",
            preserveNullAndEmptyArrays: true
        }
    })

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

    const videosAggregate = Video.aggregate(pipeline)
    const result = await Video.aggregatePaginate(videosAggregate, {
        page: pageNum,
        limit: limitNum
    })

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                videos: result.docs,
                totalVideos: result.totalDocs,
                page: result.page,
                limit: result.limit,
                totalPages: result.totalPages,
                hasMore: result.hasNextPage
            },
            "Videos fetched successfully"
        )
    )
})

// ====================================================================
// PUBLISH A VIDEO
// ====================================================================
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body

    if (!title?.trim()) {
        throw new ApiError(400, "Title is required")
    }

    if (!description?.trim()) {
        throw new ApiError(400, "Description is required")
    }

    if (!req.files || !req.files.videoFile || !req.files.thumbnail) {
        throw new ApiError(400, "Video file and thumbnail are required")
    }

    const videoLocalPath = req.files.videoFile[0]?.path
    const thumbnailLocalPath = req.files.thumbnail[0]?.path

    if (!videoLocalPath || !thumbnailLocalPath) {
        throw new ApiError(400, "Video file and thumbnail paths are missing")
    }

    let videoUploadResponse, thumbnailUploadResponse

    try {
        videoUploadResponse = await uploadOnCloudinary(videoLocalPath)
        if (!videoUploadResponse) {
            throw new ApiError(500, "Failed to upload video file")
        }

        thumbnailUploadResponse = await uploadOnCloudinary(thumbnailLocalPath)
        if (!thumbnailUploadResponse) {
            throw new ApiError(500, "Failed to upload thumbnail")
        }

    } catch (error) {
        if (fs.existsSync(videoLocalPath)) fs.unlinkSync(videoLocalPath)
        if (fs.existsSync(thumbnailLocalPath)) fs.unlinkSync(thumbnailLocalPath)
        throw error
    }

    let duration = 0
    if (videoUploadResponse.duration) {
        duration = Math.round(videoUploadResponse.duration)
    }

    const video = await Video.create({
        videoFile: videoUploadResponse.url,
        thumbnail: thumbnailUploadResponse.url,
        title: title.trim(),
        description: description.trim(),
        duration: duration,
        owner: req.user._id,
        isPublished: true
    })

    try {
        if (fs.existsSync(videoLocalPath)) fs.unlinkSync(videoLocalPath)
        if (fs.existsSync(thumbnailLocalPath)) fs.unlinkSync(thumbnailLocalPath)
    } catch (cleanupError) {
        console.error("Cleanup error:", cleanupError)
    }

    return res.status(201).json(
        new ApiResponse(201, video, "Video published successfully")
    )
})

// ====================================================================
// GET VIDEO BY ID  ← only this function changed
// ====================================================================
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video Id")
    }

    const matchConditions = { _id: new mongoose.Types.ObjectId(videoId) }

    if (req.user) {
        matchConditions.$or = [
            { isPublished: true },
            { owner: req.user._id }
        ]
    } else {
        matchConditions.isPublished = true
    }

    const video = await Video.findOne(matchConditions).populate(
        "owner",
        "username fullName avatar email"
    )

    if (!video) {
        throw new ApiError(404, "Video not found or access denied")
    }

    // ✅ Get all counts in parallel — faster than sequential awaits
    const [likeCount, commentCount] = await Promise.all([
        Like.countDocuments({ video: videoId }),
        Comment.countDocuments({ video: videoId })
    ])

    // ✅ Check liked AND subscribed together in one Promise.all
    let isLiked = false
    let isSubscribed = false

    if (req.user) {
        const [existingLike, existingSubscription] = await Promise.all([
            Like.findOne({
                video: videoId,
                likedBy: req.user._id
            }),
            Subscription.findOne({          // ✅ added — was missing before
                subscriber: req.user._id,
                channel: video.owner._id    // owner._id from populated owner
            })
        ])

        isLiked = !!existingLike
        isSubscribed = !!existingSubscription  // ✅ now included in response
    }

    // Increment view count
    await Video.findByIdAndUpdate(videoId, {
        $inc: { viewsCount: 1 }
    })
    if (req.user) {
        await User.findByIdAndUpdate(req.user._id, {
            $addToSet: { watchHistory: videoId }
        
        });
    }
    const videoData = {
        ...video.toObject(),
        likeCount,
        commentCount,
        isLiked,
        isSubscribed    // ✅ frontend reads this on page load
    }

    return res.status(200).json(
        new ApiResponse(200, videoData, "Video fetched successfully")
    )
})

// ====================================================================
// UPDATE VIDEO
// ====================================================================
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized to update this video")
    }

    const updateData = {}

    if (title !== undefined) {
        if (!title?.trim()) {
            throw new ApiError(400, "Title cannot be empty")
        }
        updateData.title = title.trim()
    }

    if (description !== undefined) {
        if (!description?.trim()) {
            throw new ApiError(400, "Description cannot be empty")
        }
        updateData.description = description.trim()
    }

    let thumbnailUploadResponse
    let oldThumbnailUrl

    if (req.file) {
        thumbnailUploadResponse = await uploadOnCloudinary(req.file.path)

        if (!thumbnailUploadResponse) {
            throw new ApiError(500, "Failed to upload new thumbnail")
        }

        oldThumbnailUrl = video.thumbnail
        updateData.thumbnail = thumbnailUploadResponse.url

        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path)
        }
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $set: updateData },
        { new: true, runValidators: true }
    ).populate("owner", "username fullName avatar")

    if (!updatedVideo) {
        throw new ApiError(500, "Failed to update video")
    }

    return res.status(200).json(
        new ApiResponse(200, updatedVideo, "Video updated successfully")
    )
})

// ====================================================================
// DELETE VIDEO
// ====================================================================
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized to delete this video")
    }

    await Comment.deleteMany({ video: videoId })
    await Like.deleteMany({ video: videoId })
    await Video.findByIdAndDelete(videoId)

    return res.status(200).json(
        new ApiResponse(200, { videoId }, "Video deleted successfully")
    )
})

// ====================================================================
// TOGGLE PUBLISH STATUS
// ====================================================================
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized to modify this video")
    }

    video.isPublished = !video.isPublished
    await video.save()

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                videoId: video._id,
                isPublished: video.isPublished,
                title: video.title
            },
            `Video ${video.isPublished ? "published" : "unpublished"} successfully`
        )
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}