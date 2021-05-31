import * as path from "path";
import express from "express";
import WebSocket from "ws";
const port = process.env.PORT || 5000;

const connections = new WeakMap();

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

const size = 256;
const place = Array(size * size).fill(null);

const app = express();

app.use(express.static(path.join(process.cwd(), "client")));

app.get("/*", (_, res) => {
	res.send("Place(holder)");
});

app.get("api/colors", (req, res) => {
	res.send(colors);
});

const server = app.listen(port);

const wss = new WebSocket.Server({
	noServer: true,
});

wss.on("connection", function connection(ws) {
	ws.on("message", function incoming(message) {
		const data = JSON.parse(message).payload;
		const now = new Date();
		const connection = connections.get(ws);
		const next = new Date(connection.next);
		if (data.x < size && data.y < size && colors.includes(data.color) && next < now) {
			connections.set(ws, {
				apiKey: connection.apiKey,
				next: new Date(now.valueOf() + 5000).toISOString(),
			});
			place[data.x + data.y * size] = data.color;
			wss.clients.forEach(function (client) {
				if (client.readyState === WebSocket.OPEN) {
					client.send(JSON.stringify({
						type: "update",
						payload: {
							x: data.x,
							y: data.y,
							color: data.color,
						},
					}));
				}
			});
		} else {
			ws.send(JSON.stringify({
				type: "timeout",
				next: connections.get(ws),
			}));
		}
	});

	const toSend = {
		type: "connection",
		payload: place,
	};
	ws.send(JSON.stringify(toSend));
});

server.on("upgrade", (req, socket, head) => {
	const url = new URL(req.url, req.headers.origin);
	const apiKey = url.searchParams.get("apiKey");
	if (apiKeys.has(apiKey)) {
		wss.handleUpgrade(req, socket, head, (ws) => {
			const now = new Date();
			const next = new Date(now.valueOf() + 5000).toISOString();
			connections.set(ws, {
				apiKey: apiKey,
				next: next,
			});
			wss.emit("connection", ws, req);

		});
	} else {
		socket.destroy();
	}
});