import { Request, Response } from "express";
import Campaign from "../models/mysql/Campaign";

export const getCampaigns = async (req: Request, res: Response) => {
  try {
    const campaigns = await Campaign.findAll();

    res.json({
      data: campaigns,
    });
  } catch {
    res.status(500).json({
      error: "server error",
    });
  }
};

export const createCampaign = async (req: Request, res: Response) => {
  try {
    const campaign = await Campaign.create(req.body);

    res.status(201).json(campaign);
  } catch (error) {
    res.status(400).json({
      error: "validation error",
    });
  }
};

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
  } catch {
    res.status(500).json({
      error: "server error",
    });
  }
};

export const updateCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findByPk(id);

    if (!campaign) {
      return res.status(404).json({
        error: "campaign not found",
      });
    }

    await campaign.update(req.body);

    res.json(campaign);
  } catch {
    res.status(400).json({
      error: "validation error",
    });
  }
};

export const deleteCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findByPk(id);

    if (!campaign) {
      return res.status(404).json({
        error: "campaign not found",
      });
    }

    await campaign.destroy();

    res.json({
      message: "deleted",
    });
  } catch {
    res.status(500).json({
      error: "server error",
    });
  }
};
