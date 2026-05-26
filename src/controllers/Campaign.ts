import { Request, Response } from "express";
import { Op, WhereOptions, literal } from "sequelize";
import Campaign from "../models/mysql/Campaign";

export const getCampaigns = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const offset = (page - 1) * pageSize;

    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;

    const conditions: WhereOptions[] = [];

    if (search) {
      conditions.push({
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
        ],
      });
    }

    if (status) conditions.push({ status });

    const where: WhereOptions = conditions.length > 0 ? { [Op.and]: conditions } : {};

    const { count, rows } = await Campaign.findAndCountAll({
      where,
      attributes: {
        include: [
          [
            literal('(SELECT COUNT(*) FROM CanvasNodes WHERE CanvasNodes.campaign_id = Campaigns.id)'),
            'node_count',
          ],
        ],
      },
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

export const createCampaign = async (req: Request, res: Response) => {
  try {
    const { name, description, status } = req.body as {
      name: string;
      description?: string;
      status?: string;
    };
    const campaign = await Campaign.create({ name, description, status });
    return res.status(201).json(campaign);
  } catch {
    return res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Invalid campaign data" },
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
        error: { code: "NOT_FOUND", message: "Campaign not found" },
      });
    }

    return res.json(campaign);
  } catch {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: "Internal server error" },
    });
  }
};

export const updateCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findByPk(id);

    if (!campaign) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Campaign not found" },
      });
    }

    const { name, description, status } = req.body as {
      name?: string;
      description?: string;
      status?: string;
    };
    const updates: { name?: string; description?: string; status?: string } = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    await campaign.update(updates);
    return res.json(campaign);
  } catch {
    return res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Invalid campaign data" },
    });
  }
};

export const deleteCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findByPk(id);

    if (!campaign) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Campaign not found" },
      });
    }

    await campaign.destroy();
    return res.json({ message: "deleted" });
  } catch {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: "Internal server error" },
    });
  }
};
