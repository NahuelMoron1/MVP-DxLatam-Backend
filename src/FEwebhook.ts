import { exec } from "child_process";
import express from "express";
import {
  GITHUB_TOKEN,
  GITHUB_USERNAME,
  SSH_IP,
  SSH_PASSWORD,
} from "./models/config";

const router = express.Router();

router.post("/github-webhook", (req, res) => {
  console.log("FE Webhook recibido de GitHub");

  const gitCommand = `bash src/fe_deploy.sh mvpcampaign ${SSH_IP} "${SSH_PASSWORD}" ${GITHUB_USERNAME} ${GITHUB_TOKEN}`;

  const child = exec(gitCommand, { timeout: 60000 }, (err, stdout, stderr) => {
    if (stderr) console.log("STDERR:", stderr);

    if (err) {
      console.error("Error ejecutando FE deploy:", err);
      return res.status(500).send("Error ejecutando FE deploy: " + err.message);
    }

    if (stdout.includes("FE Deploy realizado correctamente")) {
      console.log("FE Deploy realizado correctamente");
      res.send("FE Deploy realizado correctamente");
    } else {
      console.error("Deploy no completado correctamente:", stdout);
      res.status(500).send("Deploy no completado correctamente");
    }
  });

  child.on("exit", (code, signal) => {
    if (signal === "SIGTERM") {
      res.status(500).send("Timeout en FE deploy");
    }
  });
});

export default router;
