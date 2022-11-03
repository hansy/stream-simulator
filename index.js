require("dotenv").config();
const express = require("express");
const Queue = require("bull");
const bodyParser = require("body-parser");

const PORT = process.env.PORT || "5000";
const REDIS_URL = process.env.REDISCLOUD_URL || "redis://127.0.0.1:6379";

const app = express();
app.use(bodyParser.json());
const workQueue = new Queue("testStream", REDIS_URL);

app.get("/", (req, res) => res.sendFile("index.html", { root: __dirname }));

app.post("/stream", async (req, res) => {
  const { streamKey } = req.body;
  const job = await workQueue.getJob(streamKey);

  if (job) {
    const progress = job._progress;

    if (progress !== "running") {
      await job.remove();
    } else {
      return res.json({ status: "running" });
    }
  }

  await workQueue.add({ streamKey }, { jobId: streamKey });

  res.json({ status: "started" });
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}!`));
