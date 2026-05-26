import { exec } from "child_process";
import express from "express";
import { GITHUB_TOKEN, GITHUB_USERNAME } from "./models/config";

const router = express.Router();

router.post("/github-webhook", (req, res) => {
  console.log("Webhook recibido de GitHub");

  const gitCommand = `cd /home/mvpcampaign-api/htdocs/api.mvpcampaign.online/MVP-DxLatam-Backend && 
    git config --local credential.helper '!f() { echo "username=${GITHUB_USERNAME}"; echo "password=${GITHUB_TOKEN}"; }; f' && 
    git pull origin main && 
    npm install --production &&
    npm run build &&
    pm2 restart mi-backend`;

  exec(gitCommand, (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error ejecutando deploy");
    }
    console.log(stdout);
    res.send("Deploy realizado correctamente");
  });
});

export default router;
