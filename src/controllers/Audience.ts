import { Request, Response } from "express";
import db from "../db/connection";
import { buildWhereClause } from "../helpers/BuildWhereClause";
import { resolveTemplate } from "../helpers/resolveTemplate";
import CanvasNode from "../models/mysql/CanvasNode";

export const getAudience = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { preview_message, ...bodyFilters } = req.body as {
      preview_message?: string;
      [key: string]: unknown;
    };

    const node = await CanvasNode.findOne({ where: { id, type: "segment" } });

    if (!node) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Segment node not found" },
      });
    }

    // Body filters for live preview; fall back to node's stored config
    const rawFilters =
      Object.keys(bodyFilters).length > 0 ? bodyFilters : node.get("config");
    // Cast is safe: buildWhereClause validates the shape at runtime
    const filters = rawFilters as Parameters<typeof buildWhereClause>[0];

    const { where, replacements } = buildWhereClause(filters);

    const sql = `
      SELECT *
      FROM Contacts
      WHERE deleted_at IS NULL
      AND (${where})
    `;

    const contacts = (await db.query(sql, {
      replacements,
      type: "SELECT",
    })) as Record<string, unknown>[];

    const response: Record<string, unknown> = {
      count: contacts.length,
      contacts,
    };

    if (preview_message) {
      response.preview_messages = contacts
        .slice(0, 3)
        .map((c) => resolveTemplate(preview_message, c));
    }

    return res.json(response);
  } catch {
    return res.status(400).json({
      error: { code: "INVALID_FILTERS", message: "Invalid filter tree" },
    });
  }
};
