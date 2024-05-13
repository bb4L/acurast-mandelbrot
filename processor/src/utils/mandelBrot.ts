import { HeatPoint, MandelBrotConfig, Point } from "acurast-mandelbrot-utils";

async function calculateHeatForArray(
  coordinates: Point[],
  config: MandelBrotConfig
): Promise<HeatPoint[]> {
  return await Promise.all(
    coordinates.map(async (item) => {
      return calculateMandelbrotHeat(item, config);
    })
  );
}

async function calculateMandelbrotHeat(
  point: Point,
  config: MandelBrotConfig
): Promise<HeatPoint> {
  const xmin = -2.0,
    xmax = 1.0;
  const ymin = -1.5,
    ymax = 1.5;
  const cx = xmin + ((xmax - xmin) * point.x) / config.width;
  const cy = ymin + ((ymax - ymin) * point.y) / config.height;
  let zx = 0,
    zy = 0;
  let heat = 0;
  for (let i = 0; i < config.maxIterations; i++) {
    const zxTemp = zx * zx - zy * zy + cx;
    const zyTemp = 2 * zx * zy + cy;
    zx = zxTemp;
    zy = zyTemp;
    if (zx * zx + zy * zy > 4) {
      heat = i / config.maxIterations; // Adjust heat based on escape time
      break;
    }
  }
  return { x: point.x, y: point.y, heat: heat };
}

export { calculateHeatForArray, calculateMandelbrotHeat };
