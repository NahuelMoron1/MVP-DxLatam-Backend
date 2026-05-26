import { Request, Response } from "express";
import db from "../db/connection";
import CanvasEdge from "../models/mysql/CanvasEdge";
import CanvasNode from "../models/mysql/CanvasNode";

export const saveCanvas = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nodes, edges } = req.body;

  const transaction = await db.transaction();

  try {
    await CanvasEdge.destroy({ where: { campaign_id: id }, transaction });
    await CanvasNode.destroy({ where: { campaign_id: id }, transaction });

    await CanvasNode.bulkCreate(
      nodes.map((n: any) => ({ ...n, campaign_id: id })),
      { transaction },
    );

    await CanvasEdge.bulkCreate(
      edges.map((e: any) => ({ ...e, campaign_id: id })),
      { transaction },
    );

    await transaction.commit();
    return res.json({ message: "canvas saved" });
  } catch {
    await transaction.rollback();
    return res.status(500).json({
      error: { code: "CANVAS_SAVE_FAILED", message: "Failed to save canvas" },
    });
  }
};
