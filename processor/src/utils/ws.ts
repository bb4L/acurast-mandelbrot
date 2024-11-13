import type { PingCall, MandelBrotHeatCall } from "../sharedUtils/interfaces";

import { calculateMandelbrotHeatValues } from "./mandelBrot";
import { log_data } from "./logging";

export async function messageHandler(payload: string) {
  try {
    const parsed: PingCall | MandelBrotHeatCall | any = JSON.parse(payload);

    try {
      switch (parsed.method) {
        case "ping":
          return JSON.stringify({ method: "ping", result: "pong" });
        case "mandelbrotHeat":
          return JSON.stringify({
            method: parsed.method,
            arguments: parsed.arguments,
            result: await calculateMandelbrotHeatValues(parsed.arguments),
          });
      }
    } catch (error_value: any) {
      log_data({ data: "message handler error", error: error_value });
      return JSON.stringify({
        result: "error when handling request" + error_value.toString(),
      });
    }
    return JSON.stringify({
      result: `wrong method ${parsed.method} `,
    });
  } catch (error: any) {
    return JSON.stringify({
      method: "error in parsing",
      result: error.toString(),
    });
  }
}
