import { Request, Response } from "express";
import db from "../db/connection";
import Campaign from "../models/mysql/Campaign";
import CanvasEdge from "../models/mysql/CanvasEdge";
import CanvasNode from "../models/mysql/CanvasNode";

export const getCampaignById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findByPk(id, {
      include: ["nodes", "edges"],
    });

    if (!campaign) {
      return res.status(404).json({
        error: "campaign not found",
      });
    }

    res.json(campaign);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "server error",
    });
  }
};

export const saveCanvas = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nodes, edges } = req.body;

  const transaction = await db.transaction();

  try {
    await CanvasEdge.destroy({
      where: { campaign_id: id },
      transaction,
    });

    await CanvasNode.destroy({
      where: { campaign_id: id },
      transaction,
    });

    await CanvasNode.bulkCreate(
      nodes.map((n: any) => ({
        ...n,
        campaign_id: id,
      })),
      { transaction },
    );

    await CanvasEdge.bulkCreate(
      edges.map((e: any) => ({
        ...e,
        campaign_id: id,
      })),
      { transaction },
    );

    await transaction.commit();

    return res.json({
      message: "canvas saved",
    });
  } catch (error) {
    await transaction.rollback();

    return res.status(500).json({
      error: "save failed",
    });
  }
};
