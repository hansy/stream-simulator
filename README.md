# Livepeer Stream Simulator

This project simulates a livestream for playback in an application. In low-bandwidth environments, it can be difficult to properly livestream video (e.g. in a hackathon setting with bad wifi), which makes development on livestreaming apps more difficult. So instead of requiring developers to broadcast video to test a livestream, this project simulates a livestream by livestreaming a static video when a `Stream Key` is received.

## Requirements

- Node.js (>= v16.x.x)
- FFMpeg

## Development

```bash
# install dependencies
$ yarn install

# run server
$ node server.js
```

## Notes

To scale application, `worker.js` (in tandem with a service like Redis) can be used to spin up independent background workers to remove CPU/memory load from server.
