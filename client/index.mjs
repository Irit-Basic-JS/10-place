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
  ws.addEventListener("message", (e) => {
    const data = JSON.parse(e.data);
    if (data.type === 'render') 
      drawer.putArray(data.payload);
    if (data.type === 'draw') 
      drawer.putArray(data.payload);
    if (data.type === 'timeout') 
      timeout.next = new Date(data.nextTime);
});

drawer.onClick = (x,y) => {
  ws.send(JSON.stringify({
    type: 'placeSet',
    payload: {
      x, y, color: picker.color,
    }
  }))
}
};

const connect = apiKey => {
  const url = `${location.origin.replace(/^http/, "ws")}?apiKey=${apiKey}`;
  return new WebSocket(url);
};
