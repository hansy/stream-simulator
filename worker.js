require("dotenv").config();
const throng = require("throng");
const Queue = require("bull");
const ffmpeg = require("fluent-ffmpeg");
const { spawnSync, exec } = require("child_process");
const e = require("express");

const REDIS_URL = process.env.REDISCLOUD_URL || "redis://127.0.0.1:6379";
const workers = process.env.WEB_CONCURRENCY || 1;
const maxJobsPerWorker = 2;

const start = () => {
  const workQueue = new Queue("testStream", REDIS_URL);

  workQueue.process(maxJobsPerWorker, async (job) => {
    const { streamKey } = job.data;
    const RTMP_INGEST = `rtmp://rtmp.livepeer.com/live/${streamKey}`;

    console.log("Starting worker with stream key", streamKey);

    job.progress("running");
    // exec(
    //   `ffmpeg -re -i puppy_timer.mp4 -c:v libx264 -preset veryfast -b:v 3000k -maxrate 3000k -bufsize 6000k -g 50 -c:a aac -b:a 160k -ac 2 -ar 44100 -f flv ${RTMP_INGEST}`,
    //   (error, stdout, stderr) => {
    //     console.log(`stdout: ${stdout}`);
    //     console.log(`stderr: ${stderr}`);
    //     if (error) {
    //       console.log("Job error", error);
    //       job.progress("error");
    //       process.exit(1);
    //     } else {
    //       console.log("Job completed");
    //       job.progress("complete");
    //       process.exit(0);
    //     }
    //   }
    // );
    const command = ffmpeg("./puppy_timer.mp4")
      .native()
      .videoCodec("libx264")
      .addOption("-preset", "veryfast")
      .videoBitrate("3000k")
      .addOption("-maxrate", "3000k")
      .addOption("-bufsize", "6000k")
      .audioCodec("aac")
      .addOption("-g", 50)
      .audioBitrate("160k")
      .audioChannels(2)
      .addOption("-ar", 44100)
      .addOption("-f", "flv")
      .save(RTMP_INGEST)
      .on("end", () => {
        console.log("ended");
        job.progress("complete");
        process.exit(0);
      })
      .on("error", (err, stdout, stderr) => {
        const message = err.message;

        if (message.includes("Input/output error")) {
          job.progress("bad key");
        } else {
          job.progress("error");
          process.exit(1);
        }

        process.exit(0);
      });

    // const stream = spawnSync("ffmpeg", [
    //   "-re",
    //   "-i",
    //   "puppy_timer.mp4",
    //   "-c:v",
    //   "libx264",
    //   "-preset",
    //   "veryfast",
    //   "-b:v",
    //   "3000k",
    //   "-maxrate",
    //   "3000k",
    //   "-bufsize",
    //   "6000k",
    //   "-g",
    //   "50",
    //   "-c:a",
    //   "aac",
    //   "-b:a",
    //   "160k",
    //   "-ac",
    //   "2",
    //   "-ar",
    //   "44100",
    //   "-f",
    //   "flv",
    //   RTMP_INGEST,
    // ]);
    // job.progress("complete");
    //   .on("error", (e) => {
    //     console.log("error", e);
    //     job.progress("error");
    //     process.exit(1);
    //   })
    //   .on("close", () => {
    //     console.log("Job completed");
    //     job.progress("complete");
    //     process.exit(0);
    //   });

    // stream.stdout.on("data", (data) => {
    //   console.log(`stdout: ${data}`);
    // });

    // stream.stderr.on("data", (data) => {
    //   console.error(`stderr: ${data}`);
    // });

    // return true;
  });
};

throng({ workers, start });
