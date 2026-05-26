import cloudinary from "cloudinary";
import logger from "../utils/logger.js";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (file, folder = "dineflow") => {
  try {
    const result = await cloudinary.v2.uploader.upload(file.path, {
      folder,
      resource_type: "auto",
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    logger.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload image");
  }
};

export const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.v2.uploader.destroy(publicId);
  } catch (error) {
    logger.error("Cloudinary delete error:", error);
  }
};

export default cloudinary;
