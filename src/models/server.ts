import cors from "cors";
import express, { Application, Request, Response } from "express";
import http from "http";
import morgan from "morgan";

// Routes
import AudienceRouter from "../routes/Audience";
import CampaignRouter from "../routes/Campaign";
import ContactsRouter from "../routes/Contact";

// Database
import db from "../db/connection";
import { ALLOWED_ORIGINS, DB_NAME, PORT } from "./config";

// Associations — must be imported after models are loaded
import "../models/mysql/Associations";

// Models - Ensure proper initialization

class Server {
  private app: Application;
  private port?: string;
  private server: http.Server;

  constructor() {
    this.app = express();
    this.port = PORT;

    this.server = http.createServer(this.app);

    this.middlewares();
    this.routes();
    this.dbConnect();
    this.listen();
  }

  listen() {
    this.server.listen(this.port, () => {
      console.log("API Server listening on port ", this.port);
    });
  }

  middlewares() {
    this.app.use(express.json());
    this.app.use(morgan("dev"));
    this.app.use(
      cors({
        origin: ALLOWED_ORIGINS,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        credentials: true,
      }),
    );
  }

  routes() {
    this.app.get("/", (_req: Request, res: Response) => {
      res.json({ msg: "API working" });
    });
    this.app.use("/api/contacts", ContactsRouter);
    this.app.use("/api/segments", AudienceRouter);
    this.app.use("/api/campaigns", CampaignRouter);
  }

  async dbConnect() {
    try {
      await db.authenticate();
      console.log("DATABASE CONNECTED: " + DB_NAME);
      // Models are auto-initialized on import via sequelize.define()
    } catch (err) {
      console.error("Error connecting to DB:", err);
    }
  }
}

export default Server;
