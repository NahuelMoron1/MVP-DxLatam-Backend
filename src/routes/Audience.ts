import { Router } from "express";
import { getAudience } from "../controllers/Audience";

const router = Router();

router.post("/:id/audience", getAudience);

export default router;
