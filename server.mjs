import * as path from "path";
import express from "express";
import WebSocket from "ws";

const port = process.env.PORT || 3000;

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

const timeoutLength = 30;
let timeouts = {};

for (let key of apiKeys) {
    //console.log(key)
    timeouts[key] = new Date();
}
console.log(timeouts);

const size = 256;
const place = Array(size * size).fill(null);

for (const [colorIndex, colorValue] of colors.entries()) {
    for (let dx = 0; dx < size; dx++) {
        place[dx + colorIndex * size] = colorValue;
    }
}

const app = express();

app.use(express.static(path.join(process.cwd(), "client")));

app.get("/api/getColors", (req, res) => {
    console.log(colors);
    res.json(colors);
});

app.get("/*", (_, res) => {
    res.send("Place(holder)");
});

const server = app.listen(port, () => console.log(`App listening on port ${port}`));

const wss = new WebSocket.Server({
    noServer: true,
});

let keyMap = new WeakMap();

server.on("upgrade", (req, socket, head) => {
    const url = new URL(req.url, req.headers.origin);
    console.log(url);
    const apiKey = url.searchParams.get('apiKey');

    wss.handleUpgrade(req, socket, head, (ws) => {
        if (!apiKeys.has(apiKey)) {
            socket.destroy(new Error("Invalid API key!"));
            return;
        }
        keyMap.set(ws, apiKey);
        wss.emit("connection", ws, req);
    });
});

function insertIntoPlace(ws, payload, apiKey) {
    const date = new Date();

    let [x, y, color] = [payload.x, payload.y, payload.color];

    if (x >= 0 && x <= 256 && 
        y >= 0 && y <= 256 && 
        colors.includes(color)) {

        if (date > timeouts[apiKey]) {
            timeouts[apiKey] = new Date(date.valueOf() + timeoutLength * 1000);

            place[x + size * y] = color;

            wss.clients.forEach((ws) => {
                if (ws.readyState === WebSocket.OPEN) {
                    sendField(ws);
                }
            });
        }
        sendField(ws, "timeout", timeouts[apiKey].toISOString());
    }
}

function sendField(ws, type = "place", payload = { place }) {
    const result = {
        type,
        payload,
    }
    ws.send(JSON.stringify(result));
}

wss.on('connection', function connection(ws) {
    const apiKey = keyMap.get(ws);

    ws.on('message', function message(message) {
        // я ловлю
        const data = JSON.parse(message);
        console.log('received: %s', data);

        switch (data['type']) {
            case ("click"): {
                insertIntoPlace(ws, data['payload'], apiKey);
            };
        };
    });
    sendField(ws, "timeout", timeouts[apiKey].toISOString());
    sendField(ws);
});