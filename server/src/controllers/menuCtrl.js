import MenuItem from "../models/MenuItem.js";
import logger from "../utils/logger.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";
import { getCache, setCache, invalidatePattern } from "../config/redis.js";

export const getMenu = async (req, res) => {
  try {
    const restaurantId = req.query.restaurantId || req.headers["x-restaurant-id"];
    const cacheKey = `menu-${restaurantId}`;

    // Try to get from cache
    let menu = await getCache(cacheKey);

    if (!menu) {
      menu = await MenuItem.find({ restaurant: restaurantId, available: true }).sort({ category: 1 });
      // Cache for 1 hour
      await setCache(cacheKey, menu, 3600);
    }

    res.status(200).json({
      success: true,
      data: { items: menu },
    });
  } catch (error) {
    logger.error("Get menu error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch menu",
    });
  }
};

export const getMenuCategories = async (req, res) => {
  try {
    const restaurantId = req.headers["x-restaurant-id"];

    const categories = await MenuItem.distinct("category", { restaurant: restaurantId, available: true });

    res.status(200).json({
      success: true,
      data: { categories },
    });
  } catch (error) {
    logger.error("Get categories error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
};

export const createMenuItem = async (req, res) => {
  try {
    const restaurantId = req.headers["x-restaurant-id"];
    const itemData = req.body;

    // Upload image if provided
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file, `dineflow/menu/${restaurantId}`);
      itemData.image = uploadResult;
    }

    const menuItem = new MenuItem({
      ...itemData,
      restaurant: restaurantId,
    });

    await menuItem.save();

    // Invalidate cache
    await invalidatePattern(`menu-${restaurantId}`);

    res.status(201).json({
      success: true,
      message: "Menu item created successfully",
      data: { item: menuItem },
    });
  } catch (error) {
    logger.error("Create menu item error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create menu item",
    });
  }
};

export const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurantId = req.headers["x-restaurant-id"];
    const updateData = req.body;

    // Handle image upload
    if (req.file) {
      const existingItem = await MenuItem.findById(id);
      if (existingItem?.image?.publicId) {
        await deleteFromCloudinary(existingItem.image.publicId);
      }

      const uploadResult = await uploadToCloudinary(req.file, `dineflow/menu/${restaurantId}`);
      updateData.image = uploadResult;
    }

    const menuItem = await MenuItem.findByIdAndUpdate(id, updateData, { new: true });

    // Invalidate cache
    await invalidatePattern(`menu-${restaurantId}`);

    res.status(200).json({
      success: true,
      message: "Menu item updated successfully",
      data: { item: menuItem },
    });
  } catch (error) {
    logger.error("Update menu item error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update menu item",
    });
  }
};

export const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurantId = req.headers["x-restaurant-id"];

    const item = await MenuItem.findById(id);
    if (item?.image?.publicId) {
      await deleteFromCloudinary(item.image.publicId);
    }

    await MenuItem.findByIdAndDelete(id);

    // Invalidate cache
    await invalidatePattern(`menu-${restaurantId}`);

    res.status(200).json({
      success: true,
      message: "Menu item deleted successfully",
    });
  } catch (error) {
    logger.error("Delete menu item error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete menu item",
    });
  }
};

export const toggleMenuItemAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurantId = req.headers["x-restaurant-id"];

    const item = await MenuItem.findById(id);
    item.available = !item.available;
    await item.save();

    // Invalidate cache
    await invalidatePattern(`menu-${restaurantId}`);

    res.status(200).json({
      success: true,
      message: `Item ${item.available ? "enabled" : "disabled"}`,
      data: { item },
    });
  } catch (error) {
    logger.error("Toggle availability error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle availability",
    });
  }
};
