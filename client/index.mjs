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

  const result = JSON.parse(message?.['data'])
  console.log(result);

  if (result['type'] === 'place')
    drawer.putArray(result['payload']['place']);
}

const main = apiKey => {
  const ws = connect(apiKey);
  ws.addEventListener("message", onFieldRecieved);

  timeout.next = new Date();
  drawer.onClick = (x, y) => {
    drawer.put(x, y, picker.color);
    // отправляем на сервер
    ws.send(JSON.stringify({
      type: "click",
      payload: {x: x, y: y, color: picker.color}
    }));
  };
};

const connect = apiKey => {
  const url = `${location.origin.replace(/^http/, "ws")}?apiKey=${apiKey}`;
  return new WebSocket(url);
};

