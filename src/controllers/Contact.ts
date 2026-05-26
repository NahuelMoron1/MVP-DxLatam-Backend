import { Request, Response } from "express";

export const getContacts = (req: Request, res: Response) => {
  res.json({ msg: "Get all contacts" });
};
