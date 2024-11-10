import { MandelBrotConfig, Point } from "./interfaces";

export function getPoint(
  startPoint: Point,
  index: number,
  config: MandelBrotConfig
): Point {
  let x = startPoint.x;
  let addedValue = startPoint.y + index;

  while (addedValue > config.height) {
    x += 1;
    addedValue -= config.height;
  }

  return { x: x, y: addedValue };
}
