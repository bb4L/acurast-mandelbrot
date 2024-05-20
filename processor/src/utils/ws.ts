import { Message } from "@acurast/dapp";
import {
  CalculateMandelBrotPartCall,
  PingCall,
  Point,
} from "acurast-mandelbrot-utils";
import { calculateHeatForArray } from "./mandelBrot";

export async function messageHandler(message: Message) {
  const parsed: CalculateMandelBrotPartCall | PingCall | any = JSON.parse(
    message.payload.toString()
  );

  try {
    switch (parsed.method) {
      case "ping":
        return Buffer.from(JSON.stringify({ result: "pong" }), "utf8").toString(
          "hex"
        );

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
        return Buffer.from(
          JSON.stringify({
            method: "calculateMandelbrotPart",
            arguments: parsed.arguments,
            result: result,
          }),
          "utf8"
        ).toString("hex");
    }
  } catch (error) {
    return Buffer.from(
      JSON.stringify({
        result: "error when handling request",
      }),
      "utf8"
    ).toString("hex");
  }
  return Buffer.from(
    JSON.stringify({
      result: "wrong method",
    }),
    "utf8"
  ).toString("hex");
}
