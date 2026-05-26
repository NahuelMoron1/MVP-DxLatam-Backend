import { Request, Response } from "express";
import db from "../db/connection";
import { buildWhereClause } from "../helpers/BuildWhereClause";
import CanvasNode from "../models/mysql/CanvasNode";

export const getAudience = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const node = await CanvasNode.findOne({ where: { id, type: "segment" } });

    if (!node) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Segment node not found" },
      });
    }

    // Body filters for live preview; fall back to node's stored config
    const filters =
      Object.keys(req.body).length > 0 ? req.body : node.get("config");

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
  } catch {
    return res.status(400).json({
      error: { code: "INVALID_FILTERS", message: "Invalid filter tree" },
    });
  }
};
