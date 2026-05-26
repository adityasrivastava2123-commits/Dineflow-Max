import express from "express";
import { getActiveOffers, validateCoupon, createOffer, updateOffer, deleteOffer } from "../controllers/offerCtrl.js";
import { authMiddleware, roleMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getActiveOffers);
router.post("/validate", validateCoupon);
router.post("/", authMiddleware, roleMiddleware(["admin", "manager"]), createOffer);
router.put("/:id", authMiddleware, roleMiddleware(["admin", "manager"]), updateOffer);
router.delete("/:id", authMiddleware, roleMiddleware(["admin", "manager"]), deleteOffer);

export default router;
