import { useMemo } from 'react';
import {
  Canvas,
  Fill,
  Group,
  LinearGradient,
  RoundedRect,
  Rect,
  Text as SkiaText,
  matchFont,
  vec,
  type SkCanvas,
} from '@shopify/react-native-skia';
import type { RefObject } from 'react';
import { Platform } from 'react-native';
import { palette } from '@padel/design-tokens';
import { BRAND } from '@padel/shared';
import { qrMatrix } from './qr';

/** Portrait share-card dimensions. Rendered off-screen at fixed resolution. */
export const CARD_W = 1080;
export const CARD_H = 1920;

export interface MatchCardData {
  teamAName: string;
  teamBName: string;
  scoreline: string; // e.g. "6–4  3–6  10–8"
  venue: string;
  dateLabel: string;
  signatureStat: string; // e.g. "12–10 super tie-break comeback"
  ratingDelta: string; // e.g. "+0.12"
  claimUrl: string;
}

const family = Platform.select({ ios: 'Helvetica', default: 'sans-serif' })!;
const fontMgr = matchFont({ fontFamily: family, fontSize: 60 });
const smallFont = matchFont({ fontFamily: family, fontSize: 40 });
const bigFont = matchFont({ fontFamily: family, fontSize: 150 });

/**
 * The shareable match card, rendered entirely on-device with Skia (zero server
 * media COGS — the free share loop's billboard). The parent passes a canvas ref
 * and, after mount, calls ref.makeImageSnapshot() to encode a PNG (see
 * shareCard.ts). Colours come from design-tokens so themes restyle the card too.
 */
export function MatchCard({
  data,
  canvasRef,
}: {
  data: MatchCardData;
  canvasRef?: RefObject<SkCanvas>;
}) {
  const qr = useMemo(() => qrMatrix(data.claimUrl), [data.claimUrl]);
  const qrPx = 220;
  const qrModule = qrPx / qr.length;
  const qrX = CARD_W - qrPx - 120;
  const qrY = CARD_H - qrPx - 120;

  return (
    <Canvas ref={canvasRef} style={{ width: CARD_W, height: CARD_H }}>
      <Fill color={palette.bg900} />
      <Group>
        <RoundedRect x={64} y={64} width={CARD_W - 128} height={CARD_H - 128} r={40}>
          <LinearGradient start={vec(0, 0)} end={vec(CARD_W, CARD_H)} colors={[palette.surface700, palette.bg800]} />
        </RoundedRect>
      </Group>

      <SkiaText x={120} y={220} text={BRAND.wordmark} font={fontMgr} color={palette.brand400} />
      <SkiaText x={120} y={560} text={data.teamAName} font={fontMgr} color={palette.textHi} />
      <SkiaText x={120} y={730} text={data.scoreline} font={bigFont} color={palette.textHi} />
      <SkiaText x={120} y={900} text={data.teamBName} font={fontMgr} color={palette.textMid} />

      <SkiaText x={120} y={1220} text={data.signatureStat} font={smallFont} color={palette.gold500} />
      <SkiaText x={120} y={1300} text={`${data.venue} · ${data.dateLabel}`} font={smallFont} color={palette.textMid} />
      <SkiaText x={120} y={1380} text={`Rating ${data.ratingDelta}`} font={smallFont} color={palette.accent400} />

      {/* Claim QR — white quiet zone + dark modules, scannable from a phone chat. */}
      <Rect x={qrX - 20} y={qrY - 20} width={qrPx + 40} height={qrPx + 40} color={palette.textHi} />
      {qr.map((row, y) =>
        row.map((on, x) =>
          on ? (
            <Rect
              key={`${x}-${y}`}
              x={qrX + x * qrModule}
              y={qrY + y * qrModule}
              width={qrModule}
              height={qrModule}
              color={palette.bg900}
            />
          ) : null,
        ),
      )}
      <SkiaText x={120} y={qrY + 120} text="Claim your profile →" font={smallFont} color={palette.textLo} />
    </Canvas>
  );
}
