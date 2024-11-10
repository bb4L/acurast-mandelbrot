export interface CalculateMandelBrotPartCall {
  method: 'calculateMandelbrotPart'
  arguments: {
    startX: number
    startY: number
    endX: number
    endY: number
    config: MandelBrotConfig
  }
}

export interface MandelBrotHeatCall {
  method: 'mandelbrotHeat'
  arguments: MandelBrotHeatCallArguments
}

export interface MandelBrotHeatCallArguments {
  startPoint: Point
  amountOfValues: number
  config: MandelBrotConfig
}

export interface MandelBrotHeatCallResponse {
  method: 'mandelbrotHeat'
  arguments: MandelBrotHeatCallArguments
  result: number[]
}

export interface CalculateMandelBrotPartResponse {
  method: 'calculateMandelbrotPart'
  arguments: string
  result: HeatPoint[]
}

export interface PingCall {
  method: 'ping'
  arguments: string
}

export interface PingResponse {
  method: 'ping'
}

export interface Point {
  x: number
  y: number
}

export interface HeatPoint extends Point {
  heat: number
}

export interface MandelBrotConfig {
  height: number
  width: number
  maxIterations: number
}

export interface MinHeatPoint {
  x: number
  heat: number
}
