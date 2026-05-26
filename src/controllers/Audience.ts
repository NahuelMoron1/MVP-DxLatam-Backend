import { Request, Response } from "express";
import db from "../db/connection";
import { buildWhereClause } from "../helpers/BuildWhereClause";
import { resolveTemplate } from "../helpers/resolveTemplate";
import CanvasNode from "../models/mysql/CanvasNode";

const ALLOWED_FIELDS = new Set([
  "first_name",
  "last_name",
  "phone",
  "email",
  "country",
  "city",
  "status",
  "created_at",
]);

function validateFilterFields(filter: Record<string, unknown>): void {
  if ("op" in filter && Array.isArray(filter["conditions"])) {
    for (const child of filter["conditions"] as Record<string, unknown>[]) {
      validateFilterFields(child);
    }
    return;
  }
  if ("field" in filter) {
    const field = filter["field"] as string;
    const isAllowed =
      ALLOWED_FIELDS.has(field) ||
      /^attributes\.[a-zA-Z_][a-zA-Z0-9_]*$/.test(field);
    if (!isAllowed) {
      throw new Error(`Field '${field}' is not allowed`);
    }
  }
}

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

    validateFilterFields(rawFilters as Record<string, unknown>);

    // Cast is safe: structure validated above and at runtime by buildWhereClause
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
