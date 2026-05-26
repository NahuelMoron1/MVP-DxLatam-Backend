import { Request, Response } from "express";
import db from "../db/connection";
import { buildWhereClause } from "../helpers/BuildWhereClause";

export const getAudience = async (req: Request, res: Response) => {
  try {
    const filters = req.body;

    const { where, replacements } = buildWhereClause(filters);

    const sql = `
      SELECT *
      FROM Contacts
      WHERE deleted_at IS NULL
      AND (${where})
    `;

    const contacts = await db.query(sql, {
      replacements,
      type: "SELECT",
    });

    return res.json({
      count: contacts.length,
      contacts,
    });
  } catch (error) {
    return res.status(400).json({
      error: "invalid filters",
    });
  }
};
