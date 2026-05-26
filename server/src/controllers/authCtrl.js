import User from "../models/User.js";
import { generateToken, generateRefreshToken } from "../utils/tokenUtils.js";
import { seedDemoRestaurant, seedDemoMenuItems } from "../config/demoData.js";
import logger from "../utils/logger.js";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  try {
    const { name, email, phone, password, restaurantName, role } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email or phone already registered",
      });
    }

    const user = new User({
      name,
      email,
      phone,
      password,
      role: role || "customer",
    });

    await user.save();

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: user.toJSON(),
        token,
        refreshToken,
      },
    });
  } catch (error) {
    logger.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: user.toJSON(),
        token,
        refreshToken,
      },
    });
  } catch (error) {
    logger.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token required",
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      data: { token },
    });
  } catch (error) {
    logger.error("Token refresh error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid refresh token",
    });
  }
};

export const logout = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    logger.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: { user: user.toJSON() },
    });
  } catch (error) {
    logger.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get profile",
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, phone, preferences } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, preferences },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: { user: user.toJSON() },
    });
  } catch (error) {
    logger.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

export const seedDemoData = async (req, res) => {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== "development") {
      return res.status(403).json({
        success: false,
        message: "This endpoint is only available in development mode",
      });
    }

    const userId = req.user.id;

    // Create demo restaurant
    const restaurant = await seedDemoRestaurant(userId);

    // Seed demo menu items
    const menuItems = await seedDemoMenuItems(restaurant._id);

    res.status(201).json({
      success: true,
      message: "Demo data seeded successfully",
      data: {
        restaurant: {
          id: restaurant._id,
          name: restaurant.name,
          slug: restaurant.slug,
          tables: restaurant.tables,
          totalOrders: restaurant.totalOrders,
        },
        menuItemsCount: menuItems.length,
        menuItemsByCategory: {
          appetizers: menuItems.filter((i) => i.category === "Appetizers").length,
          mainCourse: menuItems.filter((i) => i.category === "Main Course").length,
          breads: menuItems.filter((i) => i.category === "Breads").length,
          riceDishes: menuItems.filter((i) => i.category === "Rice Dishes").length,
          beverages: menuItems.filter((i) => i.category === "Beverages").length,
          desserts: menuItems.filter((i) => i.category === "Desserts").length,
        },
      },
    });
  } catch (error) {
    logger.error("Seed demo data error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to seed demo data",
      error: error.message,
    });
  }
};

export const customerIdentify = async (req, res) => {
  try {
    const { name, phone, restaurantId } = req.body;

    if (!name || !phone || !restaurantId) {
      return res.status(400).json({
        success: false,
        message: "Name, phone, and restaurantId are required",
      });
    }

    // Upsert customer by phone+restaurant
    let user = await User.findOne({ phone, role: "customer" });

    if (user) {
      // Update name if changed
      if (user.name !== name) {
        user.name = name;
        await user.save();
      }
    } else {
      // Auto-register new customer
      user = new User({
        name,
        phone,
        email: `${phone}@guest.dineflow.io`,
        password: `guest_${phone}_${Date.now()}`,
        role: "customer",
        restaurant: restaurantId,
      });
      await user.save();
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: user.isNew ? "Customer registered" : "Customer identified",
      data: {
        user: user.toJSON(),
        token,
        isReturning: !user.isNew,
      },
    });
  } catch (error) {
    logger.error("Customer identify error:", error);
    res.status(500).json({
      success: false,
      message: "Identification failed",
    });
  }
};

export const createStaff = async (req, res) => {
  try {
    const restaurantId = req.headers["x-restaurant-id"] || req.user.restaurant;
    const { name, email, phone, password, role } = req.body;

    const validStaffRoles = ["manager", "staff", "kitchen"];
    if (!validStaffRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Role must be one of: ${validStaffRoles.join(", ")}`,
      });
    }

    const existing = await User.findOne({ $or: [{ email }, { phone }] });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Email or phone already registered",
      });
    }

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
      message: "Staff member created successfully",
      data: { user: user.toJSON() },
    });
  } catch (error) {
    logger.error("Create staff error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create staff member",
    });
  }
};

export const getStaffMembers = async (req, res) => {
  try {
    const restaurantId = req.headers["x-restaurant-id"] || req.user.restaurant;
    const staff = await User.find({
      restaurant: restaurantId,
      role: { $in: ["manager", "staff", "kitchen"] },
    }).select("-password").sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: { staff } });
  } catch (error) {
    logger.error("Get staff error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch staff" });
  }
};

export const deleteStaffMember = async (req, res) => {
  try {
    const { id } = req.params;
    const staffMember = await User.findById(id);

    if (!staffMember) {
      return res.status(404).json({ success: false, message: "Staff member not found" });
    }

    // Prevent deleting admins
    if (staffMember.role === "admin" || staffMember.role === "superadmin") {
      return res.status(403).json({ success: false, message: "Cannot delete admin accounts" });
    }

    await User.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Staff member removed" });
  } catch (error) {
    logger.error("Delete staff error:", error);
    res.status(500).json({ success: false, message: "Failed to remove staff member" });
  }
};
