import Offer from "../models/Offer.js";
import logger from "../utils/logger.js";

export const getActiveOffers = async (req, res) => {
  try {
    const restaurantId = req.headers["x-restaurant-id"];
    const now = new Date();

    const offers = await Offer.find({
      restaurant: restaurantId,
      isActive: true,
      validFrom: { $lte: now },
      validUpto: { $gte: now },
    });

    res.status(200).json({
      success: true,
      data: { offers },
    });
  } catch (error) {
    logger.error("Get offers error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch offers",
    });
  }
};

export const validateCoupon = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    const restaurantId = req.headers["x-restaurant-id"];

    const offer = await Offer.findOne({
      code: code.toUpperCase(),
      restaurant: restaurantId,
      isActive: true,
    });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Invalid coupon code",
      });
    }

    const now = new Date();
    if (offer.validFrom > now || offer.validUpto < now) {
      return res.status(400).json({
        success: false,
        message: "Coupon has expired",
      });
    }

    if (orderAmount < offer.minimumOrderValue) {
      return res.status(400).json({
        success: false,
        message: `Minimum order value of Rs. ${offer.minimumOrderValue} required`,
      });
    }

    if (offer.usageLimit && offer.usedCount >= offer.usageLimit) {
      return res.status(400).json({
        success: false,
        message: "Coupon usage limit exceeded",
      });
    }

    let discount = offer.type === "percentage" ? (orderAmount * offer.discount) / 100 : offer.discount;

    if (offer.maximumDiscount && discount > offer.maximumDiscount) {
      discount = offer.maximumDiscount;
    }

    res.status(200).json({
      success: true,
      data: {
        offer: {
          code: offer.code,
          discount,
          type: offer.type,
        },
      },
    });
  } catch (error) {
    logger.error("Validate coupon error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to validate coupon",
    });
  }
};

export const createOffer = async (req, res) => {
  try {
    const restaurantId = req.headers["x-restaurant-id"];
    const offerData = { ...req.body, restaurant: restaurantId };

    const offer = new Offer(offerData);
    await offer.save();

    res.status(201).json({
      success: true,
      message: "Offer created successfully",
      data: { offer },
    });
  } catch (error) {
    logger.error("Create offer error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create offer",
    });
  }
};

export const updateOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await Offer.findByIdAndUpdate(id, req.body, { new: true });

    res.status(200).json({
      success: true,
      message: "Offer updated successfully",
      data: { offer },
    });
  } catch (error) {
    logger.error("Update offer error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update offer",
    });
  }
};

export const deleteOffer = async (req, res) => {
  try {
    const { id } = req.params;
    await Offer.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Offer deleted successfully",
    });
  } catch (error) {
    logger.error("Delete offer error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete offer",
    });
  }
};
