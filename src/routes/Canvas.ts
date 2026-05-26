import { Router } from "express";
import { getCampaignById, saveCanvas } from "../controllers/Canvas";

const router = Router();

router.put("/:id/canvas", saveCanvas);
router.get("/:id", getCampaignById);

export default router;
