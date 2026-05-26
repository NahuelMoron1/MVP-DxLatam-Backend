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
  } catch (error: any) {
    console.error(error);

    res.status(400).json({
      error: error.message,
      details: error.errors?.map((e: any) => e.message),
    });
  }
};

export const updateContact = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const contact = await Contact.findByPk(id);

    if (!contact) {
      return res.status(404).json({
        error: "contact not found",
      });
    }

    await contact.update(req.body);

    res.json(contact);
  } catch (error) {
    res.status(400).json({
      error: "validation error",
    });
  }
};

export const deleteContact = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const contact = await Contact.findByPk(id);

    if (!contact) {
      return res.status(404).json({
        error: "contact not found",
      });
    }

    await contact.destroy();

    res.json({
      message: "deleted",
    });
  } catch {
    res.status(500).json({
      error: "server error",
    });
  }
};
