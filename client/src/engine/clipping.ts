/**
 * Algoritmo clássico de Recorte de Polígonos: Sutherland-Hodgman
 * Matéria de Computação Gráfica: Recorte (Clipping) contra polígonos convexos.
 */

import { Point2D } from './homography.js';

/**
 * Verifica se o ponto P está "dentro" da aresta orientada de A até B (lado esquerdo).
 */
function isInsideEdge(cp1: Point2D, cp2: Point2D, p: Point2D): boolean {
  return (cp2.x - cp1.x) * (p.y - cp1.y) - (cp2.y - cp1.y) * (p.x - cp1.x) >= 0;
}

/**
 * Calcula a interseção geométrica de duas retas (aresta do polígono e aresta de corte).
 */
function computeIntersection(cp1: Point2D, cp2: Point2D, s: Point2D, e: Point2D): Point2D {
  const dc = { x: cp1.x - cp2.x, y: cp1.y - cp2.y };
  const dp = { x: s.x - e.x, y: s.y - e.y };

  const n1 = cp1.x * cp2.y - cp1.y * cp2.x;
  const n2 = s.x * e.y - s.y * e.x;
  const n3 = 1.0 / (dc.x * dp.y - dc.y * dp.x);

  return {
    x: (n1 * dp.x - n2 * dc.x) * n3,
    y: (n1 * dp.y - n2 * dc.y) * n3
  };
}

/**
 * Algoritmo Sutherland-Hodgman para recortar um polígono de entrada (subjectPoly)
 * contra um polígono de recorte convexo (clipPoly).
 */
export function sutherlandHodgmanClip(
  subjectPoly: Point2D[],
  clipPoly: Point2D[]
): Point2D[] {
  let outputList = subjectPoly;
  const clipLen = clipPoly.length;

  for (let i = 0; i < clipLen; i++) {
    const cp1 = clipPoly[i];
    const cp2 = clipPoly[(i + 1) % clipLen];

    const inputList = outputList;
    outputList = [];

    if (inputList.length === 0) break;

    let s = inputList[inputList.length - 1];

    for (let j = 0; j < inputList.length; j++) {
      const e = inputList[j];

      if (isInsideEdge(cp1, cp2, e)) {
        if (isInsideEdge(cp1, cp2, s)) {
          outputList.push(e);
        } else {
          outputList.push(computeIntersection(cp1, cp2, s, e));
          outputList.push(e);
        }
      } else if (isInsideEdge(cp1, cp2, s)) {
        outputList.push(computeIntersection(cp1, cp2, s, e));
      }
      s = e;
    }
  }

  return outputList;
}
