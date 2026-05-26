import { Router } from "express";
import { createContact, getContacts } from "../controllers/Contact";

const router = Router();

router.get("/", getContacts);
router.post("/", createContact);

export default router;
