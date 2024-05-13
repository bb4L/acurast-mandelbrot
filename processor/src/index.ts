import { calculateHeatForArray } from "./utils/mandelBrot";
import {
  CalculateMandelBrotPartCall,
  CalculateMandelBrotPartResponse,
  Point,
} from "acurast-mandelbrot-utils";

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
        // register a handler for incoming messages
        const buf = Buffer.from(payload.payload, "hex");
        const decoded = buf.toString("utf8");

        try {
          const parsed: CalculateMandelBrotPartCall = JSON.parse(decoded);

          if (payload.sender == "77608f73607c7e7db907bc2919795037") {
            await _STD_.ws.send(
              payload.sender,
              Buffer.from(
                JSON.stringify({ message: "you have access wohooo" }),
                "utf8"
              ).toString("hex")
            );
          } else {
            await _STD_.ws.send(
              payload.sender,
              Buffer.from(
                JSON.stringify({ message: "you don't have access bohoo" }),
                "utf8"
              ).toString("hex")
            );
            return;
          }

          switch (parsed.method) {
            case "calculateMandelbrotPart":
              let points: Point[] = [];
              for (
                let i = parsed.arguments.startX;
                i < parsed.arguments.endX;
                i++
              ) {
                for (
                  let j = parsed.arguments.startY;
                  j < parsed.arguments.endY;
                  j++
                ) {
                  points.push({ x: i, y: j });
                }
              }

              const result: CalculateMandelBrotPartResponse = {
                points: await calculateHeatForArray(
                  points,
                  parsed.arguments.config
                ),
              } as CalculateMandelBrotPartResponse;

              await _STD_.ws.send(
                payload.sender,
                Buffer.from(JSON.stringify(result), "utf8").toString("hex")
              );

              return;
          }
        } catch (e) {
          await _STD_.ws.send(
            payload.sender,
            Buffer.from(
              JSON.stringify({ message: "error when handling request" }),
              "utf8"
            ).toString("hex")
          );
        }

        await _STD_.ws.send(
          payload.sender,
          Buffer.from(
            JSON.stringify({ message: "could not handle request" }),
            "utf8"
          ).toString("hex")
        );
      }
    );
  },
  (err: any) => {
    console.log("open: error " + err);
  }
);
