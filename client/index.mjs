import timeout from "./timeout.mjs";
import drawer from "./drawer.mjs";
import picker from "./picker.mjs";

document.querySelector("#start").addEventListener("submit", e => {
    e.preventDefault();
    main(new FormData(e.currentTarget).get("apiKey"));
    document.querySelector(".container").classList.add("ready");
});

const onFieldRecieved = (message) => {
    console.log(message);

    const data = JSON.parse(message?.['data'])
    console.log(data);

    switch (data['type']) {
        case "place": 
            drawer.putArray(data['payload']['place']);
            break;
        case "click":
            drawer.put(data.payload.x, data.payload.y, data.payload.color);
            break;
        case "timeout":
            timeout.next = new Date(data.payload);
            break;
    }
}

const main = apiKey => {
    const ws = connect(apiKey);
    ws.addEventListener("message", onFieldRecieved);

    timeout.next = new Date();
    drawer.onClick = (x, y) => {
        // отправляем на сервер
        ws.send(JSON.stringify({
            type: "click",
            payload: { x: x, y: y, color: picker.color }
        }));
    };
};

const connect = apiKey => {
    const url = `${location.origin.replace(/^http/, "ws")}?apiKey=${apiKey}`;
    return new WebSocket(url);
};
