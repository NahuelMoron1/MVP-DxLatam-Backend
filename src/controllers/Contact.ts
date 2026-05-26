import { Request, Response } from "express";
import Contact from "../models/mysql/Contact";

export const getContacts = async (req: Request, res: Response) => {
  try {
    const contacts = await Contact.findAll();

    return res.json({
      data: contacts,
    });
  } catch (error) {
    return res.status(500).json({
      error: "server error",
    });
  }
};

export const createContact = async (req: Request, res: Response) => {
  try {
    const contact = await Contact.create(req.body);

    return res.status(201).json(contact);
  } catch (error) {
    res.status(400).json({
      error: "validation error",
    });
  }
};
