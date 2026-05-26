import Restaurant from "../models/Restaurant.js";
import MenuItem from "../models/MenuItem.js";
import logger from "../utils/logger.js";

export const seedDemoRestaurant = async (ownerId) => {
  const existing = await Restaurant.findOne({ owner: ownerId });
  if (existing) return existing;

  const slug = `demo-restaurant-${Date.now()}`;
  const restaurant = new Restaurant({
    name: "Spice Garden Demo",
    slug,
    owner: ownerId,
    description: "A demo restaurant showcasing DineFlow Pro features.",
    phone: "9876543210",
    email: "demo@spicegarden.in",
    tables: 12,
    cuisineType: ["North Indian", "South Indian"],
    address: { street: "123 MG Road", city: "Bangalore", state: "Karnataka", zipcode: "560001", country: "India" },
    subscriptionPlan: "pro",
    subscriptionStatus: "active",
    subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    features: { analytics: true, advancedOffers: true, kitchenDisplay: true, multiLanguage: true, whatsappIntegration: false },
    settings: { currency: "INR", taxPercent: 5, deliveryCharges: 0, minimumOrderValue: 200, autoAcceptOrders: false, orderPreparationTime: 25 },
    averageRating: 4.3,
    totalOrders: 0,
    isActive: true,
  });
  await restaurant.save();
  logger.info("Demo restaurant created: " + restaurant.slug);
  return restaurant;
};

export const seedDemoMenuItems = async (restaurantId) => {
  await MenuItem.deleteMany({ restaurant: restaurantId });

  const items = [
    // Appetizers
    { name: "Paneer Tikka", nameHindi: "पनीर टिक्का", description: "Marinated cottage cheese grilled with spices", price: 280, category: "Appetizers", isVeg: true, isBestseller: true, spiceLevel: 2, preparationTime: 15, ratings: { average: 4.5, count: 128 }, restaurant: restaurantId, available: true, addons: [{ name: "Extra Chutney", price: 20 }] },
    { name: "Chicken Seekh Kebab", description: "Minced chicken kebabs on skewers", price: 320, category: "Appetizers", isVeg: false, isBestseller: true, spiceLevel: 3, preparationTime: 20, ratings: { average: 4.6, count: 94 }, restaurant: restaurantId, available: true },
    { name: "Veg Spring Rolls", description: "Crispy rolls stuffed with mixed vegetables", price: 220, category: "Appetizers", isVeg: true, spiceLevel: 1, preparationTime: 12, restaurant: restaurantId, available: true },
    { name: "Hara Bhara Kabab", nameHindi: "हरा भरा कबाब", description: "Spinach and peas patties with crispy coating", price: 240, category: "Appetizers", isVeg: true, isVegan: true, spiceLevel: 1, restaurant: restaurantId, available: true },

    // Main Course
    { name: "Butter Chicken", nameHindi: "बटर चिकन", description: "Tender chicken in rich creamy tomato curry", price: 380, category: "Main Course", isVeg: false, isBestseller: true, spiceLevel: 2, preparationTime: 20, ratings: { average: 4.8, count: 312 }, restaurant: restaurantId, available: true, portions: [{ size: "Half", price: 220 }, { size: "Full", price: 380 }] },
    { name: "Palak Paneer", nameHindi: "पालक पनीर", description: "Cottage cheese in smooth spinach gravy", price: 300, category: "Main Course", isVeg: true, isBestseller: true, spiceLevel: 1, preparationTime: 18, ratings: { average: 4.4, count: 189 }, restaurant: restaurantId, available: true },
    { name: "Mutton Rogan Josh", description: "Slow-cooked mutton in Kashmiri spices", price: 480, category: "Main Course", isVeg: false, spiceLevel: 3, preparationTime: 30, restaurant: restaurantId, available: true },
    { name: "Dal Makhani", nameHindi: "दाल मखनी", description: "Black lentils slow-cooked with butter and cream", price: 260, category: "Main Course", isVeg: true, spiceLevel: 1, preparationTime: 15, ratings: { average: 4.3, count: 156 }, restaurant: restaurantId, available: true },
    { name: "Kadai Paneer", nameHindi: "कढ़ाई पनीर", description: "Cottage cheese cooked with peppers and tomatoes", price: 320, category: "Main Course", isVeg: true, spiceLevel: 2, preparationTime: 20, restaurant: restaurantId, available: true },

    // Breads
    { name: "Butter Naan", nameHindi: "बटर नान", description: "Soft tandoor flatbread with butter", price: 60, category: "Breads", isVeg: true, preparationTime: 8, restaurant: restaurantId, available: true, addons: [{ name: "Extra Butter", price: 20 }] },
    { name: "Garlic Naan", description: "Naan with minced garlic and coriander", price: 80, category: "Breads", isVeg: true, preparationTime: 8, restaurant: restaurantId, available: true },
    { name: "Tandoori Roti", description: "Whole wheat bread from clay oven", price: 45, category: "Breads", isVeg: true, preparationTime: 6, restaurant: restaurantId, available: true },

    // Rice Dishes
    { name: "Chicken Biryani", nameHindi: "चिकन बिरयानी", description: "Fragrant basmati rice with spiced chicken", price: 380, category: "Rice Dishes", isVeg: false, isBestseller: true, spiceLevel: 2, preparationTime: 25, ratings: { average: 4.7, count: 278 }, restaurant: restaurantId, available: true, portions: [{ size: "Half", price: 240 }, { size: "Full", price: 380 }] },
    { name: "Veg Biryani", nameHindi: "वेज बिरयानी", description: "Aromatic rice with seasonal vegetables", price: 280, category: "Rice Dishes", isVeg: true, spiceLevel: 2, preparationTime: 20, restaurant: restaurantId, available: true },
    { name: "Steamed Basmati Rice", description: "Perfectly steamed long-grain basmati", price: 120, category: "Rice Dishes", isVeg: true, preparationTime: 12, restaurant: restaurantId, available: true },

    // Beverages
    { name: "Mango Lassi", nameHindi: "मैंगो लस्सी", description: "Sweet yogurt drink with Alphonso mango", price: 120, category: "Beverages", isVeg: true, preparationTime: 5, ratings: { average: 4.6, count: 203 }, restaurant: restaurantId, available: true },
    { name: "Masala Chai", description: "Indian spiced tea with ginger and cardamom", price: 60, category: "Beverages", isVeg: true, preparationTime: 5, restaurant: restaurantId, available: true },
    { name: "Fresh Lime Soda", description: "Lime juice with sparkling water", price: 80, category: "Beverages", isVeg: true, isVegan: true, preparationTime: 3, restaurant: restaurantId, available: true },
    { name: "Cold Coffee", description: "Chilled coffee blended with milk and ice cream", price: 140, category: "Beverages", isVeg: true, preparationTime: 5, restaurant: restaurantId, available: true },

    // Desserts
    { name: "Gulab Jamun", nameHindi: "गुलाब जामुन", description: "Milk dumplings in rose-flavored syrup", price: 120, category: "Desserts", isVeg: true, preparationTime: 5, ratings: { average: 4.5, count: 167 }, restaurant: restaurantId, available: true, addons: [{ name: "With Ice Cream", price: 60 }] },
    { name: "Kulfi", description: "Traditional Indian ice cream with pistachios", price: 140, category: "Desserts", isVeg: true, preparationTime: 3, restaurant: restaurantId, available: true },
    { name: "Rasmalai", description: "Cottage cheese patties in saffron-infused milk", price: 160, category: "Desserts", isVeg: true, preparationTime: 5, restaurant: restaurantId, available: true },
  ];

  const created = await MenuItem.insertMany(items);
  logger.info("Seeded " + created.length + " demo menu items");
  return created;
};
