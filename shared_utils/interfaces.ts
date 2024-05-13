export interface CalculateMandelBrotPartCall {
  method: "calculateMandelbrotPart";
  arguments: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    config: MandelBrotConfig;
  };
}

export interface CalculateMandelBrotPartResponse {
  method: "calculateMandelbrotPart";
  points: HeatPoint[];
}

export interface PingCall {
  method: "ping";
}

export interface PingResponse {
  method: "ping";
}

export interface Point {
  x: number;
  y: number;
}

export interface HeatPoint extends Point {
  heat: number;
}

export interface MandelBrotConfig {
  height: number;
  width: number;
  maxIterations: number;
}
