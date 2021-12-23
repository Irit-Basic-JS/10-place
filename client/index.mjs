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
  ws.addEventListener("message", (message) => {
    let data = JSON.parse(message.data);
    let {x, y, color} = data.payload;
    switch (data.type) {
      case "updatePayload":
        drawer.put(x, y, color);
        break;
      case "connection":
        drawer.putArray(data.payload);
        break;
      default:
        break;
    }
  });

  timeout.next = new Date();
  drawer.onClick = (x, y) => {
    ws.send(JSON.stringify({
      type: "putColor",
      payload: {
        x: x,
        y: y,
        color: picker.color,
      }
    }));
  };
};

const connect = apiKey => {
  const url = `${location.origin.replace(/^http/, "ws")}?apiKey=${apiKey}`;
  return new WebSocket(url);
};
