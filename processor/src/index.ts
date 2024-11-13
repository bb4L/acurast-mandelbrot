import { messageHandler } from "./utils/ws";
import { log_data } from "./utils/logging";
import { hexToString, stringToHex } from "./sharedUtils/hex";

declare const _STD_: any;

_STD_.ws.open(
  // open a websocket connection to the provided server
  [
    "wss://websocket-proxy-1.prod.gke.acurast.com",
    "wss://websocket-proxy-2.prod.gke.acurast.com",
  ],
  () => {
    _STD_.ws.registerPayloadHandler(
      async (msg: { sender: string; recipient: string; payload: string }) => {
        try {
          const decoded = hexToString(msg.payload);

          try {
            let result = await messageHandler(hexToString(msg.payload as any));
            _STD_.ws.send(
              msg.sender,
              stringToHex(result),
              () => {},
              (msg: any) => {}
            );
          } catch (e: any) {
            _STD_.ws.send(
              msg.sender,
              stringToHex(
                JSON.stringify({ method: "error", message: e.toString() })
              ),
              () => {},
              (msg: any) => {}
            );
          }
        } catch (e) {}
      }
    );
  },
  (err: any) => {
    log_data({ data: "open error", exception: err });
    console.log("open: error " + err);
  }
);
log_data({ data: "end of script" });
