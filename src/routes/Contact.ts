import { Router } from "express";
import {
  createContact,
  deleteContact,
  getContacts,
  updateContact,
} from "../controllers/Contact";

const router = Router();

router.get("/", getContacts);
router.post("/", createContact);
router.put("/:id", updateContact);
router.delete("/:id", deleteContact);

export default router;
