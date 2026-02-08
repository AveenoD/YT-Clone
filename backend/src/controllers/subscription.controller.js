import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }

    const channel = await User.findById(channelId)
    if (!channel) {
        throw new ApiError(404, "Channel not found")
    }

     if (channelId.toString() === req.user._id.toString()) {
        throw new ApiError(400, "You cannot subscribe to yourself")
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    })

    let isSubscribed
    let message

    if (existingSubscription) {
        // UNSUBSCRIBE
        await Subscription.deleteOne({ _id: existingSubscription._id })
        isSubscribed = false
        message = "Unsubscribed successfully"
    } else {
        // SUBSCRIBE
        await Subscription.create({
            subscriber: req.user._id,
            channel: channelId
        })
        isSubscribed = true
        message = "Subscribed successfully"
    }

    const totalSubscribers = await Subscription.countDocuments({ channel: channelId })

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                subscribed: isSubscribed,
                totalSubscribers,
                channelId
            },
            message
        )
    )
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const { page = 1, limit = 10 } = req.query
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }

    const channel = await User.findById(channelId)
    if (!channel) {
        throw new ApiError(404, "Channel not found")
    }

      const pageNum = parseInt(page, 10)
    const limitNum = Math.max(1, Math.min(parseInt(limit, 10), 50))
    const skip = (pageNum - 1) * limitNum

    const pipeline = []

    // Match subscriptions for this channel
    pipeline.push({
        $match: {
            channel: new mongoose.Types.ObjectId(channelId)
        }
    })
      pipeline.push({
        $sort: { createdAt: -1 }
    })

    // Pagination: skip
    pipeline.push({ $skip: skip })

    // Pagination: limit
    pipeline.push({ $limit: limitNum })

    // Lookup subscriber user data
    pipeline.push({
        $lookup: {
            from: "users",
            localField: "subscriber",
            foreignField: "_id",
            as: "subscriberInfo"
        }
    })

    // Unwind subscriber info
    pipeline.push({
        $unwind: {
            path: "$subscriberInfo",
            preserveNullAndEmptyArrays: true
        }
    })

    // Project final fields
    pipeline.push({
        $project: {
            _id: 0,
            subscriber: {
                _id: "$subscriberInfo._id",
                username: "$subscriberInfo.username",
                fullName: "$subscriberInfo.fullName",
                avatar: "$subscriberInfo.avatar",
                email: "$subscriberInfo.email"
            },
            subscribedAt: "$createdAt"
        }
    })
     const [subscribers, totalSubscribers] = await Promise.all([
        Subscription.aggregate(pipeline),
        Subscription.countDocuments({ channel: channelId })
    ])

     const totalPages = Math.ceil(totalSubscribers / limitNum)
    const hasMore = pageNum < totalPages

     return res.status(200).json(
        new ApiResponse(
            200,
            {
                subscribers,
                totalSubscribers,
                page: pageNum,
                limit: limitNum,
                totalPages,
                hasMore
            },
            "Channel subscribers fetched successfully"
        )
    )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    const { page = 1, limit = 10 } = req.query
     if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber ID")
    }

    const subscriber = await User.findById(subscriberId)
    if (!subscriber) {
        throw new ApiError(404, "User not found")
    }

    const pageNum = parseInt(page, 10)
    const limitNum = Math.max(1, Math.min(parseInt(limit, 10), 50))
    const skip = (pageNum - 1) * limitNum

    const pipeline = []

    pipeline.push({
        $match: {
            subscriber: new mongoose.Types.ObjectId(subscriberId)
        }
    })
     pipeline.push({
        $sort: { createdAt: -1 }
    })
    pipeline.push({ $skip: skip })
    pipeline.push({ $limit: limitNum })
    pipeline.push({
        $lookup: {
            from: "users",
            localField: "channel",
            foreignField: "_id",
            as: "channelInfo"
        }
    })

    pipeline.push({
        $unwind: {
            path: "$channelInfo",
            preserveNullAndEmptyArrays: true
        }
    })

    // Project final fields
    pipeline.push({
        $project: {
            _id: 0,
            channel: {
                _id: "$channelInfo._id",
                username: "$channelInfo.username",
                fullName: "$channelInfo.fullName",
                avatar: "$channelInfo.avatar",
                email: "$channelInfo.email"
            },
            subscribedAt: "$createdAt"
        }
    })

     const [subscribedChannels, totalSubscriptions] = await Promise.all([
        Subscription.aggregate(pipeline),
        Subscription.countDocuments({ subscriber: subscriberId })
    ])

    const totalPages = Math.ceil(totalSubscriptions / limitNum)
    const hasMore = pageNum < totalPages

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                subscribedChannels,
                totalSubscriptions,
                page: pageNum,
                limit: limitNum,
                totalPages,
                hasMore
            },
            "Subscribed channels fetched successfully"
        )
    )

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}