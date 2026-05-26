import { Router } from "express";
import {
  createCampaign,
  deleteCampaign,
  getCampaignById,
  getCampaigns,
  updateCampaign,
} from "../controllers/Campaign";

import { saveCanvas } from "../controllers/Canvas";

const router = Router();

router.get("/", getCampaigns);

router.post("/", createCampaign);

router.get("/:id", getCampaignById);

router.put("/:id", updateCampaign);

router.delete("/:id", deleteCampaign);

router.put("/:id/canvas", saveCanvas);

export default router;
