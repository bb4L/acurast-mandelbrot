import { AcurastClient, Message } from "@acurast/dapp";
import {
  CalculateMandelBrotPartCall,
  PingCall,
  Point,
} from "acurast-mandelbrot-utils/interfaces";
import { calculateHeatForArray } from "./src/utils/mandelBrot";

const acurastClient = new AcurastClient(
  "wss://websocket-proxy-1.prod.gke.acurast.com" /* Acurast P2P WebSocket Server */
);
(async () => {
  // 791a089c84fa861512dbc9f802ff4d95
  await acurastClient.start(
    {
      secretKey:
        "4aa959b31fc8098e72466373518e67bc017f0c46a522df7af0fc7dcad7caf52d",
      publicKey:
        "04555cab22edb274884d89e91ccf1648cf18e6c399ea15ccf7d929a6797158f73ac6b92ec705c598b020b26695020af96a00fea1bd53a20e1303938424854163d7",
    } /* P256 key pair */
  );

  acurastClient.onMessage(async (message: Message) => {
    console.log("sender", Buffer.from(message.sender).toString("hex"));
    // const buf = Buffer.from(message.payload, "hex");
    // const decoded = buf.toString("utf8")
    const parsed: CalculateMandelBrotPartCall | PingCall = JSON.parse(
      message.payload.toString()
    );
    console.log("parsed:", parsed);

    switch (parsed.method) {
      case "ping":
        await acurastClient.send(
          message.sender,
          Buffer.from(JSON.stringify({ result: "pong" }), "utf8").toString(
            "hex"
          )
        );
        return;
      case "calculateMandelbrotPart":
        let points: Point[] = [];
        for (let i = parsed.arguments.startX; i < parsed.arguments.endX; i++) {
          for (
            let j = parsed.arguments.startY;
            j < parsed.arguments.endY;
            j++
          ) {
            points.push({ x: i, y: j });
          }
        }

        const result = await calculateHeatForArray(
          points,
          parsed.arguments.config
        );

        console.log("returning calculation");
        await acurastClient.send(
          message.sender,
          Buffer.from(
            JSON.stringify({
              method: "calculateMandelbrotPart",
              arguments: parsed.arguments,
              result: result,
            }),
            "utf8"
          ).toString("hex")
        );

        return;
    }
  });
})();
