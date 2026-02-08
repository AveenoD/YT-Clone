import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const healthcheck = asyncHandler(async (req, res) => {
    // Basic health check with useful metadata
    return res.status(200).json(
        new ApiResponse(
            200,
            {
                status: "OK",
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                message: "Server is healthy and running"
            },
            "Health check passed"
        )
    )
})

export {
    healthcheck
}