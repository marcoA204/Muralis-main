import { Point2D } from './homography.js';
import { drawWarpedImage } from './meshWarp.js';

export type BlendMode = 'normal' | 'multiply' | 'overlay' | 'soft-light';

export type ValidBaseImage = HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap | OffscreenCanvas;
export type ValidArtImage = HTMLImageElement | HTMLCanvasElement | ImageBitmap | OffscreenCanvas;

export interface RenderState {
  baseImage: ValidBaseImage | null;
  artImage: ValidArtImage | null;
  maskCanvas?: HTMLCanvasElement | OffscreenCanvas | null;
  paintCanvas?: HTMLCanvasElement | OffscreenCanvas | null;
  cornerPoints: [Point2D, Point2D, Point2D, Point2D];
  blendMode: BlendMode;
  opacity: number;
  brightness: number;
  contrast: number;
  artRotation?: number;
}

function getRotatedArtSource(
  artImage: ValidArtImage,
  degrees: number
): ValidArtImage {
  const normalized = ((degrees % 360) + 360) % 360;
  if (normalized < 0.01 || normalized > 359.99) return artImage;

  const srcW = 'naturalWidth' in artImage && artImage.naturalWidth ? artImage.naturalWidth : artImage.width;
  const srcH = 'naturalHeight' in artImage && artImage.naturalHeight ? artImage.naturalHeight : artImage.height;
  if (!srcW || !srcH) return artImage;

  const rad = (normalized * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const outW = Math.max(1, Math.round(srcW * cos + srcH * sin));
  const outH = Math.max(1, Math.round(srcW * sin + srcH * cos));

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return artImage;

  ctx.translate(outW / 2, outH / 2);
  ctx.rotate(rad);
  ctx.drawImage(artImage, -srcW / 2, -srcH / 2, srcW, srcH);
  return canvas;
}

function resolveCompositeOp(mode: BlendMode): GlobalCompositeOperation {
  switch (mode) {
    case 'multiply': return 'multiply';
    case 'overlay': return 'overlay';
    case 'soft-light': return 'soft-light';
    default: return 'source-over';
  }
}

export function compositeLayers(
  targetCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  state: RenderState,
  subdivisions = 16
): void {
  targetCtx.clearRect(0, 0, width, height);

  if (state.baseImage) {
    targetCtx.drawImage(state.baseImage, 0, 0, width, height);
  }

  if (state.paintCanvas) {
    const paintTemp = document.createElement('canvas');
    paintTemp.width = width;
    paintTemp.height = height;
    const paintCtx = paintTemp.getContext('2d');
    if (paintCtx) {
      paintCtx.drawImage(state.paintCanvas, 0, 0, width, height);
      if (state.maskCanvas) {
        paintCtx.save();
        paintCtx.globalCompositeOperation = 'destination-out';
        paintCtx.drawImage(state.maskCanvas, 0, 0, width, height);
        paintCtx.restore();
      }
      targetCtx.save();
      targetCtx.globalCompositeOperation = resolveCompositeOp(state.blendMode);
      targetCtx.drawImage(paintTemp, 0, 0);
      targetCtx.restore();
    }
  }

  if (!state.artImage) {
    return;
  }

  const tempCanvas = typeof OffscreenCanvas !== 'undefined'
    ? new OffscreenCanvas(width, height)
    : document.createElement('canvas');

  if ('width' in tempCanvas && 'height' in tempCanvas) {
    tempCanvas.width = width;
    tempCanvas.height = height;
  }

  const tempCtx = tempCanvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
  if (!tempCtx) {
    return;
  }

  const absoluteCorners: [Point2D, Point2D, Point2D, Point2D] = [
    { x: state.cornerPoints[0].x * width, y: state.cornerPoints[0].y * height },
    { x: state.cornerPoints[1].x * width, y: state.cornerPoints[1].y * height },
    { x: state.cornerPoints[2].x * width, y: state.cornerPoints[2].y * height },
    { x: state.cornerPoints[3].x * width, y: state.cornerPoints[3].y * height }
  ];

  const artSource = state.artRotation ? getRotatedArtSource(state.artImage, state.artRotation) : state.artImage;
  drawWarpedImage(tempCtx, artSource, absoluteCorners, { subdivisions });

  if (state.brightness !== 1.0 || state.contrast !== 1.0) {
    applyAdjustments(tempCtx, width, height, state.brightness, state.contrast);
  }

  if (state.maskCanvas) {
    tempCtx.save();
    tempCtx.globalCompositeOperation = 'destination-out';
    tempCtx.drawImage(state.maskCanvas, 0, 0, width, height);
    tempCtx.restore();
  }

  targetCtx.save();
  targetCtx.globalAlpha = Math.max(0, Math.min(1, state.opacity));

  targetCtx.globalCompositeOperation = resolveCompositeOp(state.blendMode);

  targetCtx.drawImage(tempCanvas, 0, 0);
  targetCtx.restore();
}

function applyAdjustments(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  brightness: number,
  contrast: number
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const factor = (259 * (contrast * 255 - 128 + 255)) / (255 * (259 - (contrast * 255 - 128)));
  const brightnessOffset = (brightness - 1.0) * 255;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;

    let r = data[i] + brightnessOffset;
    let g = data[i + 1] + brightnessOffset;
    let b = data[i + 2] + brightnessOffset;

    r = factor * (r - 128) + 128;
    g = factor * (g - 128) + 128;
    b = factor * (b - 128) + 128;

    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
  }

  ctx.putImageData(imageData, 0, 0);
}
