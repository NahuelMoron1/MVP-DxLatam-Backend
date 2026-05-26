import { Router } from "express";
import { getContacts } from "../controllers/Contact";

const router = Router();

// Auth
router.post("/", getContacts);

export default router;
