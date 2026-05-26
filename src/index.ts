import dotenv from "dotenv";
import Server from "./models/server";
const { execSync } = require("child_process");

require("dotenv").config();
dotenv.config();
const server = new Server();
