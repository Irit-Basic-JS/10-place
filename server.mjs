import * as path from "path";
import express from "express";
import WebSocket from "ws";
import picker from "./client/picker.mjs";

const port = process.env.PORT || 5000;

const apiKeys = new Set([
  "4a83051d-aad4-483e-8fc8-693273d15dc7",
  "c08c9038-693d-4669-98cd-9f0dd5ef06bf",
  "4b1545c4-4a70-4727-9ea1-152ed4c84ae2",
  "4a226908-aa3e-4a34-a57d-1f3d1f6cba84",
]);

drawer.onClick = (x,y) => {
  ws.send(JSON.stringify({
    type: 'placeSet',
    payload: {
      x, y, color: picker.color,
    }
  }))
};

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

app.get("/colors", (_, res) => {
  res.send(JSON.stringify(colors));
});

app.get("/*", (_, res) => {
  res.send("Place(holder)");
});

const server = app.listen(port);

const wss = new WebSocket.Server({
  noServer: true,
});

wss.on("connection", (ws) => {
  ws.on('message', function incoming(message) {
    const data = JSON.parse(message);
    if (data.x >= 0
        && data.y >= 0
        && data.x < size
        && data.y < size
        && colors.includes(data.color)) {
      place[data.x + data.y * size] = data.color;

      wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(place));
        }
      });
    }
  });

  ws.send(JSON.stringify(place));

  server.on("upgrade", (req, socket, head) => {
    const url = new URL(req.url, req.headers.origin);
    if (!apiKeys.has(url.searchParams.get("apiKey"))) {
      socket.destroy();
    }
    console.log(url);
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  });
});
