import { Request, Response } from "express";
import db from "../db/connection";
import CanvasEdge from "../models/mysql/CanvasEdge";
import CanvasNode from "../models/mysql/CanvasNode";

interface NodeInput {
  id: string;
  type: string;
  x: number;
  y: number;
  config: unknown;
}

interface EdgeInput {
  id: string;
  source_node_id: string;
  target_node_id: string;
}

export const saveCanvas = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nodes, edges } = req.body as { nodes: NodeInput[]; edges: EdgeInput[] };

  const transaction = await db.transaction();

  try {
    await CanvasEdge.destroy({ where: { campaign_id: id }, transaction });
    await CanvasNode.destroy({ where: { campaign_id: id }, transaction });

    await CanvasNode.bulkCreate(
      nodes.map((n) => ({ ...n, campaign_id: id })),
      { transaction },
    );

    await CanvasEdge.bulkCreate(
      edges.map((e) => ({ ...e, campaign_id: id })),
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
