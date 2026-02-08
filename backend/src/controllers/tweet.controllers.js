import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
     const { content } = req.body

    // Validate content exists
    if (!content?.trim()) {
        throw new ApiError(400, "Tweet content is required")
    }

    // Validate character limit (Twitter standard: 280)
    if (content.trim().length > 280) {
        throw new ApiError(400, "Tweet content must be less than 280 characters")
    }

     const tweet = await Tweet.create({
        content: content.trim(),
        owner: req.user._id
    })

    await tweet.populate("owner", "username fullName avatar email")
    return res.status(201).json(
        new ApiResponse(
            201,
            tweet,
            "Tweet created successfully"
        )
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId } = req.params
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID")
    }

     const user = await User.findById(userId)
    if (!user) {
        throw new ApiError(404, "User not found")
    }
    const { page = 1, limit = 10 } = req.query

    const pageNum = parseInt(page, 10)
    const limitNum = Math.max(1, Math.min(parseInt(limit, 10), 50))
    const skip = (pageNum - 1) * limitNum

    // Get total tweet count
    const totalTweets = await Tweet.countDocuments({ owner: userId })

    // Get tweets with pagination and populate owner
    const tweets = await Tweet.find({ owner: userId })
        .sort({ createdAt: -1 }) // Newest first
        .skip(skip)
        .limit(limitNum)
        .populate("owner", "username fullName avatar email")
        .lean() // Better performance for read-only

    const { Like } = await import("../models/like.model.js")
    const likeCounts = await Promise.all(
        tweets.map(async (tweet) => {
            const count = await Like.countDocuments({ tweet: tweet._id })
            return { tweetId: tweet._id, count }
        })
    )
    const tweetsWithLikes = tweets.map(tweet => {
        const likeInfo = likeCounts.find(l => l.tweetId.toString() === tweet._id.toString())
        return {
            ...tweet,
            likeCount: likeInfo?.count || 0
        }
    })

    const totalPages = Math.ceil(totalTweets / limitNum)
    const hasMore = pageNum < totalPages
    return res.status(200).json(
        new ApiResponse(
            200,
            {
                tweets: tweetsWithLikes,
                totalTweets,
                page: pageNum,
                limit: limitNum,
                totalPages,
                hasMore
            },
            "User tweets fetched successfully"
        )
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params
    const { content } = req.body
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID")
    }
    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

     if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized to update this tweet")
    }

    if (!content?.trim()) {
        throw new ApiError(400, "Tweet content is required")
    }

    if (content.trim().length > 280) {
        throw new ApiError(400, "Tweet content must be less than 280 characters")
    }

    tweet.content = content.trim()
    await tweet.save()

    await tweet.populate("owner", "username fullName avatar email")
    return res.status(200).json(
        new ApiResponse(
            200,
            tweet,
            "Tweet updated successfully"
        )
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID")
    }
    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }
    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized to delete this tweet")
    }
    const deleteResult = await Tweet.deleteOne({
        _id: tweetId,
        owner: req.user._id
    })

    if (deleteResult.deletedCount === 0) {
        throw new ApiError(404, "Tweet not found or unauthorized")
    }
     const { Like } = await import("../models/like.model.js")
    await Like.deleteMany({ tweet: tweetId })

    return res.status(200).json(
        new ApiResponse(
            200,
            { tweetId },
            "Tweet deleted successfully"
        )
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}