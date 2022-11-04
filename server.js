require("dotenv").config();
const express = require("express");
const { spawn } = require("child_process");
const bodyParser = require("body-parser");

const PORT = process.env.PORT || "5000";

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

const RUNNING_STREAMS = {};

const spawnFFMPEGStream = (streamKey) => {
  console.log("Starting worker with stream key", streamKey);
  const RTMP_INGEST = `rtmp://rtmp.livepeer.com/live/${streamKey}`;

  const stream = spawn("ffmpeg", [
    "-re",
    "-i",
    "puppy_timer.mp4",
    "-c",
    "copy",
    "-f",
    "flv",
    RTMP_INGEST,
  ])
    .on("error", (e) => {
      console.log(`Stream (${streamKey}) error`, e);
      RUNNING_STREAMS[streamKey] = "error";
    })
    .on("close", () => {
      console.log(`Stream (${streamKey}) complete`);
      RUNNING_STREAMS[streamKey] = "complete";
    });

  stream.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
  });

  stream.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });
};

app.get("/", (req, res) => res.sendFile("index.html", { root: __dirname }));

app.post("/stream", async (req, res) => {
  const { streamKey } = req.body;
  const stream = RUNNING_STREAMS[streamKey];

  if (stream && ["running", "bad key"].includes(stream)) {
    return res.json({ status: stream });
  }

  RUNNING_STREAMS[streamKey] = "running";
  spawnFFMPEGStream(streamKey);

  res.json({ status: "started" });
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}!`));
