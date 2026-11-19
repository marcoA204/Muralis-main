export interface Point2D {
  x: number;
  y: number;
}

export type Matrix3x3 = [
  number, number, number,
  number, number, number,
  number, number, number
];

export function computeHomography(src: [Point2D, Point2D, Point2D, Point2D], dst: [Point2D, Point2D, Point2D, Point2D]): Matrix3x3 {
  const matrixA: number[][] = [];
  const vectorB: number[] = [];

  for (let i = 0; i < 4; i++) {
    const sx = src[i].x;
    const sy = src[i].y;
    const dx = dst[i].x;
    const dy = dst[i].y;

    matrixA.push([sx, sy, 1, 0, 0, 0, -dx * sx, -dx * sy]);
    vectorB.push(dx);

    matrixA.push([0, 0, 0, sx, sy, 1, -dy * sx, -dy * sy]);
    vectorB.push(dy);
  }

  const solution = solveLinearSystem8x8(matrixA, vectorB);

  return [
    solution[0], solution[1], solution[2],
    solution[3], solution[4], solution[5],
    solution[6], solution[7], 1
  ];
}

function solveLinearSystem8x8(matrix: number[][], vector: number[]): number[] {
  const size = 8;
  const augmented: number[][] = matrix.map((row, i) => [...row, vector[i]]);

  for (let col = 0; col < size; col++) {
    let maxRow = col;
    let maxVal = Math.abs(augmented[col][col]);

    for (let row = col + 1; row < size; row++) {
      if (Math.abs(augmented[row][col]) > maxVal) {
        maxVal = Math.abs(augmented[row][col]);
        maxRow = row;
      }
    }

    if (maxRow !== col) {
      const temp = augmented[col];
      augmented[col] = augmented[maxRow];
      augmented[maxRow] = temp;
    }

    const pivot = augmented[col][col];
    if (Math.abs(pivot) < 1e-10) {
      continue;
    }

    for (let j = col; j <= size; j++) {
      augmented[col][j] /= pivot;
    }

    for (let row = 0; row < size; row++) {
      if (row !== col) {
        const factor = augmented[row][col];
        for (let j = col; j <= size; j++) {
          augmented[row][j] -= factor * augmented[col][j];
        }
      }
    }
  }

  return augmented.map(row => row[size]);
}

export function transformPoint(matrix: Matrix3x3, point: Point2D): Point2D {
  const x = point.x;
  const y = point.y;

  const w = matrix[6] * x + matrix[7] * y + matrix[8];
  const invW = w !== 0 ? 1 / w : 1;

  return {
    x: (matrix[0] * x + matrix[1] * y + matrix[2]) * invW,
    y: (matrix[3] * x + matrix[4] * y + matrix[5]) * invW
  };
}

/**
 * Calcula o determinante de uma matriz 3x3.
 */
export function determinant3x3(m: Matrix3x3): number {
  return (
    m[0] * (m[4] * m[8] - m[5] * m[7]) -
    m[1] * (m[3] * m[8] - m[5] * m[6]) +
    m[2] * (m[3] * m[7] - m[4] * m[6])
  );
}

/**
 * Calcula a matriz inversa de uma matriz 3x3 usando a matriz adjunta de cofatores.
 */
export function invertMatrix3x3(m: Matrix3x3): Matrix3x3 | null {
  const det = determinant3x3(m);
  if (Math.abs(det) < 1e-12) {
    return null; // Matriz singular / não inversível
  }

  const invDet = 1 / det;

  return [
    (m[4] * m[8] - m[5] * m[7]) * invDet,
    (m[2] * m[7] - m[1] * m[8]) * invDet,
    (m[1] * m[5] - m[2] * m[4]) * invDet,

    (m[5] * m[6] - m[3] * m[8]) * invDet,
    (m[0] * m[8] - m[2] * m[6]) * invDet,
    (m[2] * m[3] - m[0] * m[5]) * invDet,

    (m[3] * m[7] - m[4] * m[6]) * invDet,
    (m[1] * m[6] - m[0] * m[7]) * invDet,
    (m[0] * m[4] - m[1] * m[3]) * invDet
  ];
}

/**
 * Multiplica duas matrizes 3x3 (A x B).
 */
export function multiplyMatrix3x3(a: Matrix3x3, b: Matrix3x3): Matrix3x3 {
  const result: number[] = new Array(9).fill(0);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      let sum = 0;
      for (let k = 0; k < 3; k++) {
        sum += a[r * 3 + k] * b[k * 3 + c];
      }
      result[r * 3 + c] = sum;
    }
  }
  return result as Matrix3x3;
}

/**
 * Decomposição aproximada dos componentes afins e projetivos da homografia.
 */
export function decomposeHomography(m: Matrix3x3) {
  const norm = m[8] !== 0 ? m[8] : 1;
  const h = m.map(v => v / norm) as Matrix3x3;

  const translation = { x: h[2], y: h[5] };
  const perspective = { x: h[6], y: h[7] };

  const a = h[0];
  const b = h[1];
  const c = h[3];
  const d = h[4];

  const scaleX = Math.sqrt(a * a + c * c);
  const scaleY = Math.sqrt(b * b + d * d);
  const rotationRad = Math.atan2(c, a);
  const rotationDeg = (rotationRad * 180) / Math.PI;
  const skew = Math.atan2(a * b + c * d, Math.max(1e-6, scaleX * scaleY));

  return {
    det: determinant3x3(m),
    translation,
    perspective,
    scaleX,
    scaleY,
    rotationDeg,
    skew
  };
}
