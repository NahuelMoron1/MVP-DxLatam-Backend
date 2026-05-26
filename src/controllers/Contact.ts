import { Request, Response } from "express";
import { Op, UniqueConstraintError } from "sequelize";
import Contact from "../models/mysql/Contact";

export const getContacts = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const offset = (page - 1) * pageSize;

    const search = req.query.search as string | undefined;
    const country = req.query.country as string | undefined;
    const status = req.query.status as string | undefined;
    const created_after = req.query.created_after as string | undefined;

    // any is justified: Sequelize WhereOptions doesn't expose symbol keys cleanly in TS
    const where: any = {};

    if (search) {
      where[Op.or] = [
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    if (country) where.country = country;
    if (status) where.status = status;
    if (created_after) where.created_at = { [Op.gte]: new Date(created_after) };

    const { count, rows } = await Contact.findAndCountAll({
      where,
      limit: pageSize,
      offset,
      order: [["created_at", "DESC"]],
    });

    return res.json({
      data: rows,
      page,
      pageSize,
      total: count,
    });
  } catch {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: "Internal server error" },
    });
  }
};

export const createContact = async (req: Request, res: Response) => {
  try {
    const contact = await Contact.create(req.body);
    return res.status(201).json(contact);
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res.status(409).json({
        error: { code: "EMAIL_DUPLICATE", message: "Email already exists" },
      });
    }
    return res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Invalid contact data" },
    });
  }
};

export const updateContact = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findByPk(id);

    if (!contact) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Contact not found" },
      });
    }

    await contact.update(req.body);
    return res.json(contact);
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res.status(409).json({
        error: { code: "EMAIL_DUPLICATE", message: "Email already exists" },
      });
    }
    return res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Invalid contact data" },
    });
  }
};

export const deleteContact = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findByPk(id);

    if (!contact) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Contact not found" },
      });
    }

    await contact.destroy();
    return res.json({ message: "deleted" });
  } catch {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: "Internal server error" },
    });
  }
};
