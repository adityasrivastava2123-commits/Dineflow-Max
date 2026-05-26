import Restaurant from "../models/Restaurant.js";
import User from "../models/User.js";
import logger from "../utils/logger.js";

export const getRestaurantBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const restaurant = await Restaurant.findOne({ slug, isActive: true });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    res.status(200).json({
      success: true,
      data: { restaurant },
    });
  } catch (error) {
    logger.error("Get restaurant error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch restaurant",
    });
  }
};

export const updateRestaurantSettings = async (req, res) => {
  try {
    const restaurantId = req.headers["x-restaurant-id"];
    const { openingHours, settings, description, address } = req.body;

    const restaurant = await Restaurant.findByIdAndUpdate(
      restaurantId,
      { openingHours, settings, description, address },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Restaurant settings updated",
      data: { restaurant },
    });
  } catch (error) {
    logger.error("Update restaurant settings error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update settings",
    });
  }
};

export const getRestaurantStaff = async (req, res) => {
  try {
    const restaurantId = req.headers["x-restaurant-id"];

    const staff = await User.find({
      restaurant: restaurantId,
      role: { $in: ["manager", "staff", "kitchen"] },
    }).select("-password");

    res.status(200).json({
      success: true,
      data: { staff },
    });
  } catch (error) {
    logger.error("Get staff error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch staff",
    });
  }
};

export const addStaff = async (req, res) => {
  try {
    const restaurantId = req.headers["x-restaurant-id"];
    const { name, email, phone, password, role } = req.body;

    const user = new User({
      name,
      email,
      phone,
      password,
      role,
      restaurant: restaurantId,
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: "Staff member added successfully",
      data: { user: user.toJSON() },
    });
  } catch (error) {
    logger.error("Add staff error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add staff",
    });
  }
};
