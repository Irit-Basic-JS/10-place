import * as path from "path";
import express from "express";
import WebSocket from "ws";

const port = process.env.PORT || 5000;

const apiKeys = new Set([
  "4a83051d-aad4-483e-8fc8-693273d15dc7",
  "c08c9038-693d-4669-98cd-9f0dd5ef06bf",
  "4b1545c4-4a70-4727-9ea1-152ed4c84ae2",
  "4a226908-aa3e-4a34-a57d-1f3d1f6cba84",
]);

const colors = [
  "#140c1c",
  "#442434",
  "#30346d",
  "#4e4a4e",
  "#854c30",
  "#346524",
  "#d04648",
  "#757161",
  "#597dce",
  "#d27d2c",
  "#8595a1",
  "#6daa2c",
  "#d2aa99",
  "#6dc2ca",
  "#dad45e",
  "#deeed6",
];

const intervals = {};

apiKeys.forEach((apiKey)=>{intervals[apiKey] = randomSeconds(10,60)});

function randomSeconds(min, max) {
  let rand = min + Math.random() * (max + 1 - min);
  return 1000*Math.floor(rand);
}

const connections = new WeakMap();

const timeouts = {};

const size = 256;
// place(x, y) := place[x + y * size]
const place = Array(size * size).fill(null);
for (const [colorIndex, colorValue] of colors.entries()) {
  for (let dx = 0; dx < size; dx++) {
    place[dx + colorIndex * size] = colorValue;
  }
}

const app = express();

app.use(express.static(path.join(process.cwd(), "client")));

app.get('/api/colors',(_,res)=>{
  res.send(colors);
});

app.get("/*", (_, res) => {
  res.send("Place(holder)");
});

const server = app.listen(port);

const wss = new WebSocket.Server({
  noServer: true,
});

wss.on("connection", function connection(ws) {
  const key = connections.get(ws);
  ws.on("message", function incoming(message) {
    if (!timeouts[key] || timeouts[key] < new Date()){
      console.log("received: %s", message);
      const data = JSON.parse(message).payload;
      place[data.x + data.y * size] = data.color;
      const now = new Date();
      timeouts[key] = new Date(now.valueOf()+intervals[key]);
      wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({type: 'drawPoint', payload: place}));
        };
      });
    }else{
      ws.send(JSON.stringify({type: 'timeout', nextTime:timeouts[key]}));
    }
  });
  ws.send(JSON.stringify({type: 'renderMap', payload: place}));
});



server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url, req.headers.origin);
  let apiKey = url.searchParams.get('apiKey');
  if(apiKeys.has(apiKey)) {
    wss.handleUpgrade(req, socket, head, (ws) => {
      connections.set(ws, apiKey);
      wss.emit("connection", ws, req);
    });
  } else {
    console.log("Уничтожен "+apiKey)
    socket.destroy()
  }
});
