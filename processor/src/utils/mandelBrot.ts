import type {
  MandelBrotConfig,
  Point,
  MandelBrotHeatCallArguments,
} from "../sharedUtils/interfaces";
import { getPoint } from "../sharedUtils/coordinateHandling";

export async function calculateMandelbrotHeatValues(
  args: MandelBrotHeatCallArguments
) {
  let promises: Promise<number>[] = [];
  for (let x = 0; x < args.amountOfValues; x++) {
    promises.push(
      calculateMandelbrotHeat(
        getPoint(args.startPoint, x, args.config),
        args.config
      )
    );
  }
  return await Promise.all(promises);
}

async function calculateMandelbrotHeat(
  point: Point,
  config: MandelBrotConfig
): Promise<number> {
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
  return heat;
}
