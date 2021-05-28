import timeout from "./timeout.mjs";
import drawer from "./drawer.mjs";
import picker from "./picker.mjs";

document.querySelector("#start").addEventListener("submit", e => {
	e.preventDefault();
	main(new FormData(e.currentTarget).get("apiKey"));
	document.querySelector(".container").classList.add("ready");
});

const main = apiKey => {
	const ws = connect(apiKey);
	ws.addEventListener("message", function (ev) {
		const params = JSON.parse(ev.data);
		console.log(params);
		if (params.type === "update") {
			drawer.put(params.payload.x, params.payload.y, params.payload.color);
		} else if (params.type === "connection") {
			drawer.putArray(params.payload);
		} else if (params.type === "timeout") {
			timeout.next = new Date(params.payload.next);
		}
	});
	
	drawer.onClick = (x, y) => {
		ws.send(JSON.stringify({
			type: "putColor",
			payload: {
				x: x,
				y: y,
				color: picker.color,
			},
		}));
	};
};

const connect = apiKey => {
	const url = `${location.origin.replace(/^http/, "ws")}?apiKey=${apiKey}`;
	return new WebSocket(url);
};
