import { messageHandler } from "./utils/ws";

declare const _STD_: any;

_STD_.ws.open(
  // open a websocket connection to the provided server
  [
    "wss://websocket-proxy-1.prod.gke.acurast.com/",
    "wss://websocket-proxy-2.prod.gke.acurast.com/",
  ],
  () => {
    console.log("open: success");
    _STD_.ws.registerPayloadHandler(
      async (payload: {
        sender: string;
        recipient: string;
        payload: string;
      }) => {
        await _STD_.ws.send(
          payload.sender,
          await messageHandler(payload as any)
        );
      }
    );
  },
  (err: any) => {
    console.log("open: error " + err);
  }
);
