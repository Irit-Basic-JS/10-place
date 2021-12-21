import * as path from "path";
import express from "express";
import WebSocket from "ws";

const port = process.env.PORT || 5000;

const apiKeys = {
    "4a83051d-aad4-483e-8fc8-693273d15dc7": new Date(),
    "c08c9038-693d-4669-98cd-9f0dd5ef06bf": new Date(),
    "4b1545c4-4a70-4727-9ea1-152ed4c84ae2": new Date(),
    "4a226908-aa3e-4a34-a57d-1f3d1f6cba84": new Date(),
}

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

app.get("/api/colors", (_, res) => {
    res.json(colors);
})

app.get("/*", (_, res) => {
    res.send("Place(holder)");
});

const server = app.listen(port, () => {
    console.log(`app on http://localhost:${port}/`);
});

const wss = new WebSocket.Server({
    noServer: true,
});

wss.on('connection', function connection(ws) {
    ws.on('message', function message(message) {
        let data = JSON.parse(message);
        let x, y, color, date;
        if (data.type === "pick" &&
            0 <= (x = data.payload.x) && x <= 256 &&
            0 <= (y = data.payload.y) && y <= 256 &&
            colors.includes(color = data.payload.color)) {
            if ((date = new Date()) > apiKeys[keysMap.get(ws)]) {
                console.log(`${date.toTimeString()} > ${apiKeys[keysMap.get(ws)].toTimeString()}`)
                apiKeys[keysMap.get(ws)] = new Date(date.valueOf() + 10 * 1000);
                place[data.payload.x + data.payload.y * size] = color;
                wss.clients.forEach(client => client.send(message));
            }
            ws.send(JSON.stringify({type: "timeout", payload: apiKeys[keysMap.get(ws)].toISOString()}));
        }
    });

    ws.send(JSON.stringify({type: "timeout", payload: apiKeys[keysMap.get(ws)].toISOString()}))
    ws.send(JSON.stringify({type: "place", payload: place}));
});

let keysMap = new WeakMap()

server.on("upgrade", (req, socket, head) => {
    const url = new URL(req.url, req.headers.origin);
    console.log(url);
    let apiKey = url.searchParams.get('apiKey');
    if (!(apiKey in apiKeys))
        socket.destroy(new Error('wrong api key'));
    else
        wss.handleUpgrade(req, socket, head, (ws) => {
            keysMap.set(ws, apiKey);
            wss.emit("connection", ws, req);
        });

});
