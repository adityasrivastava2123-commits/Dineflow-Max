import express from "express";
import { getMenu, getMenuCategories, createMenuItem, updateMenuItem, deleteMenuItem, toggleMenuItemAvailability } from "../controllers/menuCtrl.js";
import { authMiddleware, roleMiddleware } from "../middleware/authMiddleware.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ dest: "tmp/" });

router.get("/", getMenu);
router.get("/categories", getMenuCategories);
router.post("/", authMiddleware, roleMiddleware(["admin", "manager"]), upload.single("image"), createMenuItem);
router.put("/:id", authMiddleware, roleMiddleware(["admin", "manager"]), upload.single("image"), updateMenuItem);
router.delete("/:id", authMiddleware, roleMiddleware(["admin", "manager"]), deleteMenuItem);
router.patch("/:id/availability", authMiddleware, roleMiddleware(["admin", "manager", "staff"]), toggleMenuItemAvailability);

export default router;
