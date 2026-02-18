import {Router} from "express";
    getUserById 
import {registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelDetails, getWatchHistory,getUploadedVideos,getUserById, addToWatchLater, removeFromWatchLater, getWatchLater} from "../controllers/user.controllers.js";
import {getLikedVideos} from "../controllers/like.controllers.js"
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT, optionalVerifyJWT } from "../middlewares/auth.middleware.js";
import { getUserPlaylists } from "../controllers/playlist.controller.js";
const router = Router();

router.route('/register').post(
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 }
    ]),
    registerUser
);

router.route('/login').post(loginUser)

//secure route
router.get("/c/:userId",optionalVerifyJWT, getUserById);

router.route('/logout').post(verifyJWT, logoutUser)
router.route('/refresh-token').post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)
router.route("/profile/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)

router.route("/profile/coverImage").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

router.route("/channel/:username").get(verifyJWT, getUserChannelDetails)

router.route("/watch-history").get(verifyJWT, getWatchHistory)
router.route("/liked-videos").get(verifyJWT, getLikedVideos);
router.route("/uploaded-videos").get(verifyJWT, getUploadedVideos);
router.route("/playlists").get(verifyJWT, getUserPlaylists);
router.post("/watch-later/:videoId",   verifyJWT, addToWatchLater)
router.delete("/watch-later/:videoId", verifyJWT, removeFromWatchLater)
router.get("/watch-later",             verifyJWT, getWatchLater)
export default router;