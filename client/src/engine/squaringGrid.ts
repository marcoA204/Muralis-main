/**
 * Grade de Perspectiva do Muralista (Método do Quadriculado / Squaring-Up Grid)
 * Gera linhas projetivas e coordenadas alfanuméricas (A1, A2, B1...)
 * que deformam conforme a perspectiva da parede.
 */

import { Point2D } from './homography.js';

export interface GridOptions {
  rows?: number;
  cols?: number;
  lineColor?: string;
  lineWidth?: number;
  textColor?: string;
  fontSize?: number;
  showLabels?: boolean;
}

/**
 * Interpolação bilinear entre 4 cantos de um quadrilátero qualquer no plano.
 * u, v variam de [0, 1].
 */
export function bilinearQuadInterpolation(
  corners: [Point2D, Point2D, Point2D, Point2D],
  u: number,
  v: number
): Point2D {
  const [c0, c1, c2, c3] = corners;

  const x =
    (1 - u) * (1 - v) * c0.x +
    u * (1 - v) * c1.x +
    u * v * c2.x +
    (1 - u) * v * c3.x;

  const y =
    (1 - u) * (1 - v) * c0.y +
    u * (1 - v) * c1.y +
    u * v * c2.y +
    (1 - u) * v * c3.y;

  return { x, y };
}

/**
 * Desenha a grade de transferência de perspectiva no contexto 2D.
 */
export function drawPerspectiveSquaringGrid(
  ctx: CanvasRenderingContext2D,
  corners: [Point2D, Point2D, Point2D, Point2D],
  options: GridOptions = {}
): void {
  const rows = options.rows || 6;
  const cols = options.cols || 8;
  const lineColor = options.lineColor || 'rgba(0, 230, 153, 0.75)';
  const lineWidth = options.lineWidth || 1.5;
  const textColor = options.textColor || '#00E699';
  const showLabels = options.showLabels !== false;

  ctx.save();
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash([4, 4]);

  // Linhas verticais (ao longo de cols)
  for (let c = 0; c <= cols; c++) {
    const u = c / cols;
    const topPt = bilinearQuadInterpolation(corners, u, 0);
    const bottomPt = bilinearQuadInterpolation(corners, u, 1);

    ctx.beginPath();
    ctx.moveTo(topPt.x, topPt.y);
    ctx.lineTo(bottomPt.x, bottomPt.y);
    ctx.stroke();
  }

  // Linhas horizontais (ao longo de rows)
  for (let r = 0; r <= rows; r++) {
    const v = r / rows;
    const leftPt = bilinearQuadInterpolation(corners, 0, v);
    const rightPt = bilinearQuadInterpolation(corners, 1, v);

    ctx.beginPath();
    ctx.moveTo(leftPt.x, leftPt.y);
    ctx.lineTo(rightPt.x, rightPt.y);
    ctx.stroke();
  }

  // Rótulos alfanuméricos dentro de cada quadrante (A1, B2...)
  if (showLabels) {
    ctx.setLineDash([]);
    ctx.fillStyle = textColor;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    for (let r = 0; r < rows; r++) {
      const rowLetter = alphabet[r % alphabet.length];
      for (let c = 0; c < cols; c++) {
        const colNum = (c + 1).toString();
        const label = `${rowLetter}${colNum}`;

        // Centro da célula
        const midU = (c + 0.5) / cols;
        const midV = (r + 0.5) / rows;
        const centerPt = bilinearQuadInterpolation(corners, midU, midV);

        // Caixa de fundo para leitura fácil
        ctx.fillStyle = 'rgba(10, 10, 12, 0.6)';
        ctx.fillRect(centerPt.x - 14, centerPt.y - 8, 28, 16);

        ctx.fillStyle = textColor;
        ctx.fillText(label, centerPt.x, centerPt.y);
      }
    }
  }

  ctx.restore();
}
