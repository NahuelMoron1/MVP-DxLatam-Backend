import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import http from "http";
import morgan from "morgan";
import { Server as SocketServer } from "socket.io";

// Routes
import ContactsRouter from "../routes/Contact";

// Database
import db from "../db/connection";
import { ALLOWED_ORIGINS, DB_NAME, PORT } from "./config";

// Models - Ensure proper initialization

class Server {
  private app: Application;
  private port?: string;
  private server: http.Server;
  private io: SocketServer;

  constructor() {
    this.app = express();
    this.port = PORT;

    this.server = http.createServer(this.app);

    this.io = new SocketServer(this.server, {
      cors: {
        origin: ALLOWED_ORIGINS,
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this.middlewares();
    this.routes();
    this.sockets();
    this.dbConnect();
    this.listen();
  }

  sockets() {
    this.io.on("connection", (socket) => {
      socket.on("joinRoom", (deviceKey: string) => {
        socket.join(deviceKey);
      });

      socket.on("disconnect", () => {});
    });

    this.app.set("socketio", this.io);
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
    this.app.use(cookieParser());
  }

  routes() {
    this.app.get("/", (req: Request, res: Response) => {
      res.json({ msg: "API working" });
    });
    this.app.use("/api/contacts", ContactsRouter);
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
