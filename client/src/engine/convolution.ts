/**
 * Motor de Processamento Digital de Imagens (PDI) - Convolução 2D e Filtros Matriciais
 * Implementação pura em TypeScript para fins pedagógicos e práticos de Computação Gráfica.
 */

export interface KernelDefinition {
  id: string;
  name: string;
  description: string;
  matrix: number[][]; // 3x3
  divisor: number;
  offset: number;
}

export const STANDARD_KERNELS: Record<string, KernelDefinition> = {
  identity: {
    id: 'identity',
    name: 'Identidade (Original)',
    description: 'Sem alteração nos pixels.',
    matrix: [
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0]
    ],
    divisor: 1,
    offset: 0
  },
  sharpen: {
    id: 'sharpen',
    name: 'Nitidez (Sharpen)',
    description: 'Realça altas frequências e detalhes de borda.',
    matrix: [
      [0, -1, 0],
      [-1, 5, -1],
      [0, -1, 0]
    ],
    divisor: 1,
    offset: 0
  },
  gaussian_blur: {
    id: 'gaussian_blur',
    name: 'Desfoque Gaussiano 3x3',
    description: 'Suavização com aproximação da curva normal.',
    matrix: [
      [1, 2, 1],
      [2, 4, 2],
      [1, 2, 1]
    ],
    divisor: 16,
    offset: 0
  },
  box_blur: {
    id: 'box_blur',
    name: 'Média Simples (Box Blur)',
    description: 'Filtro passa-baixas pela média dos vizinhos.',
    matrix: [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1]
    ],
    divisor: 9,
    offset: 0
  },
  sobel_x: {
    id: 'sobel_x',
    name: 'Sobel Horizontal (Bordas Verticais)',
    description: 'Gradiente diferencial horizontal com ponderação.',
    matrix: [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1]
    ],
    divisor: 1,
    offset: 128
  },
  sobel_y: {
    id: 'sobel_y',
    name: 'Sobel Vertical (Bordas Horizontais)',
    description: 'Gradiente diferencial vertical com ponderação.',
    matrix: [
      [-1, -2, -1],
      [0, 0, 0],
      [1, 2, 1]
    ],
    divisor: 1,
    offset: 128
  },
  sobel_magnitude: {
    id: 'sobel_magnitude',
    name: 'Sobel Magnitude (|Gx| + |Gy|)',
    description: 'Detecção completa de contornos e bordas.',
    matrix: [
      [-1, -2, -1],
      [0, 0, 0],
      [1, 2, 1]
    ], // Tratado especialmente pelo applySobelMagnitude
    divisor: 1,
    offset: 0
  },
  laplacian: {
    id: 'laplacian',
    name: 'Laplaciano (2ª Derivada)',
    description: 'Detecta transições rápidas de intensidade (contornos).',
    matrix: [
      [0, 1, 0],
      [1, -4, 1],
      [0, 1, 0]
    ],
    divisor: 1,
    offset: 128
  },
  emboss: {
    id: 'emboss',
    name: 'Relevo (Emboss)',
    description: 'Simula profundidade e relevo com sombra direcional.',
    matrix: [
      [-2, -1, 0],
      [-1, 1, 1],
      [0, 1, 2]
    ],
    divisor: 1,
    offset: 128
  },
  edge_detect: {
    id: 'edge_detect',
    name: 'Detecção de Bordas (Ridge)',
    description: 'Isola bordas com alta sensibilidade.',
    matrix: [
      [-1, -1, -1],
      [-1, 8, -1],
      [-1, -1, -1]
    ],
    divisor: 1,
    offset: 0
  }
};

/**
 * Aplica convolução 2D matricial 3x3 sobre um ImageData.
 */
export function applyConvolution(
  srcData: ImageData,
  kernel: number[][],
  divisor: number = 1,
  offset: number = 0
): ImageData {
  const width = srcData.width;
  const height = srcData.height;
  const src = srcData.data;

  // Cria canvas ou buffer de saída
  const output = new ImageData(new Uint8ClampedArray(src.length), width, height);
  const dst = output.data;

  const kSize = 3;
  const half = 1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0;

      for (let ky = 0; ky < kSize; ky++) {
        const py = Math.min(Math.max(y + ky - half, 0), height - 1);
        for (let kx = 0; kx < kSize; kx++) {
          const px = Math.min(Math.max(x + kx - half, 0), width - 1);
          const weight = kernel[ky][kx];
          const idx = (py * width + px) * 4;

          r += src[idx] * weight;
          g += src[idx + 1] * weight;
          b += src[idx + 2] * weight;
        }
      }

      const outIdx = (y * width + x) * 4;
      const d = divisor === 0 ? 1 : divisor;

      dst[outIdx] = Math.min(255, Math.max(0, r / d + offset));
      dst[outIdx + 1] = Math.min(255, Math.max(0, g / d + offset));
      dst[outIdx + 2] = Math.min(255, Math.max(0, b / d + offset));
      dst[outIdx + 3] = src[outIdx + 3]; // Mantém canal Alpha
    }
  }

  return output;
}

/**
 * Aplica o operador completo de Sobel calculando a magnitude do gradiente: sqrt(Gx² + Gy²).
 */
export function applySobelMagnitude(srcData: ImageData): ImageData {
  const width = srcData.width;
  const height = srcData.height;
  const src = srcData.data;

  const output = new ImageData(new Uint8ClampedArray(src.length), width, height);
  const dst = output.data;

  const gx = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1]
  ];

  const gy = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1]
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sumRx = 0, sumGx = 0, sumBx = 0;
      let sumRy = 0, sumGy = 0, sumBy = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4;
          const wx = gx[ky + 1][kx + 1];
          const wy = gy[ky + 1][kx + 1];

          sumRx += src[idx] * wx;
          sumGx += src[idx + 1] * wx;
          sumBx += src[idx + 2] * wx;

          sumRy += src[idx] * wy;
          sumGy += src[idx + 1] * wy;
          sumBy += src[idx + 2] * wy;
        }
      }

      // Converte para luminosidade em escala de cinza para magnitude
      const magR = Math.sqrt(sumRx * sumRx + sumRy * sumRy);
      const magG = Math.sqrt(sumGx * sumGx + sumGy * sumGy);
      const magB = Math.sqrt(sumBx * sumBx + sumBy * sumBy);
      const val = Math.min(255, 0.299 * magR + 0.587 * magG + 0.114 * magB);

      const outIdx = (y * width + x) * 4;
      dst[outIdx] = val;
      dst[outIdx + 1] = val;
      dst[outIdx + 2] = val;
      dst[outIdx + 3] = src[outIdx + 3];
    }
  }

  return output;
}

/**
 * Gera textura procedural de parede (concreto / tijolo / chapisco)
 * para simular a textura de superfície (Bump/Relief) em computação gráfica.
 */
export function generateProceduralWallTexture(
  type: 'concrete' | 'brick' | 'rough',
  width: number,
  height: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  if (type === 'concrete') {
    // Ruído perlin/aleatório sutil
    const imgData = ctx.createImageData(width, height);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 40;
      const base = 128 + noise;
      imgData.data[i] = base;
      imgData.data[i + 1] = base;
      imgData.data[i + 2] = base;
      imgData.data[i + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
  } else if (type === 'brick') {
    // Padrão de tijolos
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, width, height);

    const brickH = 28;
    const brickW = 60;
    const mortar = 3;

    ctx.fillStyle = '#606060';
    let row = 0;
    for (let y = 0; y < height; y += brickH + mortar) {
      const offsetX = (row % 2) * (brickW / 2);
      for (let x = -brickW; x < width + brickW; x += brickW + mortar) {
        ctx.fillRect(x + offsetX, y, brickW, brickH);
      }
      row++;
    }

    // Adiciona granulação aos tijolos
    const imgData = ctx.getImageData(0, 0, width, height);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 25;
      imgData.data[i] = Math.min(255, Math.max(0, imgData.data[i] + noise));
      imgData.data[i + 1] = Math.min(255, Math.max(0, imgData.data[i + 1] + noise));
      imgData.data[i + 2] = Math.min(255, Math.max(0, imgData.data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);
  } else {
    // Rough / Chapisco áspero
    const imgData = ctx.createImageData(width, height);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 90;
      const base = 128 + noise;
      imgData.data[i] = base;
      imgData.data[i + 1] = base;
      imgData.data[i + 2] = base;
      imgData.data[i + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
  }

  return canvas;
}
