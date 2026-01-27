

import dotenv from "dotenv";

dotenv.config({
  path: "./.env"   // 👈 very important
});
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';



cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
// Debug logs to check if credentials are loaded
// console.log('🔍 Cloudinary Config Check:');
// console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
// console.log('API Key:', process.env.CLOUDINARY_API_KEY);
// console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? '✅ Loaded' : '❌ Missing');


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        console.log('☁️ Uploading to Cloudinary:', localFilePath);

        const response = await cloudinary.uploader.upload(
            localFilePath, {
                resource_type: 'auto'
            }
        );
        
        console.log('✅ Cloudinary upload success:', response.url);
        
        // Delete local file after successful upload
        fs.unlinkSync(localFilePath);
        
        return response;
        
    } catch (error) {
        console.error('❌ Cloudinary upload failed:', error.message);
        
        // Delete local file even if upload fails
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        
        return null;
    }
}

export default uploadOnCloudinary;