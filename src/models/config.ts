import dotenv from "dotenv";
dotenv.config();

export const PORT = process.env.PORT;

export const DB_HOST = process.env.DB_HOST;
export const DB_USER = process.env.DB_USER as string;
export const DB_PASSWORD = process.env.DB_PASSWORD as string;
export const DB_NAME = process.env.DB_NAME as string;
export const DB_PORT: number = parseInt(process.env.DB_PORT || "0");
export const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
  : [];
export const GITHUB_TOKEN = process.env.GITHUB_TOKEN as string;
export const GITHUB_USERNAME = process.env.GITHUB_USERNAME as string;
export const SSH_PASSWORD = process.env.SSH_PASSWORD as string;
export const SSH_IP = process.env.SSH_IP as string;
