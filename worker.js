const throng = require("throng");
const Queue = require("bull");
const { spawn, exec } = require("child_process");

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
    exec(
      `ffmpeg -re -i puppy_timer.mp4 -c:v libx264 -preset veryfast -b:v 3000k -maxrate 3000k -bufsize 6000k -g 50 -c:a aac -b:a 160k -ac 2 -ar 44100 -f flv ${RTMP_INGEST}`,
      async (error, stdout, stderr) => {
        if (error) {
          console.log("Job error", error);
          job.progress("error");
          process.exit(1);
        } else {
          console.log("Job completed");
          job.progress("complete");
          process.exit(0);
        }
      }
    );
    // const stream = spawn("ffmpeg", [
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
    // ], )
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
