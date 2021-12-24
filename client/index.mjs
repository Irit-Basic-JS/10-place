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
    ws.addEventListener("message", res => {
        const parsedData = JSON.parse(res.data);
        switch (parsedData.type) {
            case 'init':
                drawer.putArray(parsedData.payload);
                break;
            case 'click':
                const cellInfo = parsedData.payload;
                drawer.put(cellInfo.x, cellInfo.y, cellInfo.color);
                break;
            default:
                console.log('Unknown message type');
        }
    });

    timeout.next = new Date();
    drawer.onClick = (x, y) => {
        ws.send(JSON.stringify({
            type: 'click',
            payload: {
                x,
                y,
                color: picker.color
            }
        }))
    };
};

const connect = apiKey => {
    const url = `${location.origin.replace(/^http/, "ws")}?apiKey=${apiKey}`;
    return new WebSocket(url);
};
