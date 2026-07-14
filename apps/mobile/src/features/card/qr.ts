import QRCode from 'qrcode';

/**
 * Compute a QR code as a boolean matrix (true = dark module) so it can be drawn
 * natively on the Skia card — the claim link that turns every shared card into a
 * recruiting billboard. Pure data; the rendering is done with Skia rects.
 */
export function qrMatrix(text: string): boolean[][] {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
  const size = qr.modules.size;
  const data = qr.modules.data; // row-major bit array
  const matrix: boolean[][] = [];
  for (let y = 0; y < size; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < size; x++) row.push(Boolean(data[y * size + x]));
    matrix.push(row);
  }
  return matrix;
}
