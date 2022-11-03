require("dotenv").config();
const throng = require("throng");
const Queue = require("bull");
const { spawn } = require("child_process");

const REDIS_URL = process.env.REDISCLOUD_URL || "redis://127.0.0.1:6379";
const workers = process.env.WEB_CONCURRENCY || 1;
const maxJobsPerWorker = 10;

const start = () => {
  const workQueue = new Queue("testStream", REDIS_URL);

  workQueue.process(maxJobsPerWorker, async (job) => {
    const { streamKey } = job.data;
    const RTMP_INGEST = `rtmp://rtmp.livepeer.com/live/${streamKey}`;

    console.log("Starting worker with stream key", streamKey);

    job.progress("running");

    return await new Promise((resolve, reject) => {
      spawn("ffmpeg", [
        "-re",
        "-i",
        "video.mp4",
        "-c",
        "copy",
        "-f",
        "flv",
        RTMP_INGEST,
      ])
        .on("error", (e) => {
          console.log("error", e);
          job.progress("error");
          reject("error");
        })
        .on("close", () => {
          console.log("Job completed");
          job.progress("complete");
          resolve("complete");
        });
    });
  });
};

throng({ workers, start });
