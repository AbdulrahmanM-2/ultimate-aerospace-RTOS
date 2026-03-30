
const WebSocket = require('ws');
const { Scheduler } = require('./rtos/scheduler');
const { generateTelemetry } = require('./telemetry/stream');
const { autopilot } = require('./autopilot/modes');

const wss = new WebSocket.Server({ port: 4000 });

const scheduler = new Scheduler();

wss.on('connection', (ws) => {
  console.log('Client connected');

  let state = {
    altitude: 1000,
    velocity: 200,
    pitch: 0,
    roll: 0,
    yaw: 0
  };

  setInterval(() => {
    scheduler.run();
    state = autopilot(state);
    const data = generateTelemetry(state);
    ws.send(JSON.stringify(data));
  }, 100);
});
