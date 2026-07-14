import { useMemo } from 'react';
import {
  Canvas,
  Circle,
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
import { gradients, palette } from '@padel/design-tokens';
import { BRAND } from '@padel/shared';
import { qrMatrix } from './qr';

export const CARD_W = 1080;
export const CARD_H = 1920;

export interface MatchCardData {
  teamAName: string;
  teamBName: string;
  teamAInitials: string;
  teamBInitials: string;
  scoreline: string;
  venue: string;
  dateLabel: string;
  signatureStat: string;
  ratingDelta: string;
  claimUrl: string;
  goldFlourish: boolean;
  holographic: boolean;
}

const family = Platform.select({ ios: 'Helvetica', default: 'sans-serif' })!;
const wordFont = matchFont({ fontFamily: family, fontSize: 56 });
const nameFont = matchFont({ fontFamily: family, fontSize: 54 });
const smallFont = matchFont({ fontFamily: family, fontSize: 38 });
const initialFont = matchFont({ fontFamily: family, fontSize: 60 });
const bigFont = matchFont({ fontFamily: family, fontSize: 150 });

/**
 * The shareable match card, rendered on-device with Skia (zero server COGS).
 * Renders both portrait (1080×1920) and square (1080×1080) variants, player
 * avatars, a gold flourish for golden/star-point matches, a Pro holographic
 * sheen, and a scannable claim QR. Snapshot off-screen via the canvas ref.
 */
export function MatchCard({
  data,
  canvasRef,
  square = false,
}: {
  data: MatchCardData;
  canvasRef?: RefObject<SkCanvas>;
  square?: boolean;
}) {
  const W = CARD_W;
  const H = square ? CARD_W : CARD_H;
  const qr = useMemo(() => qrMatrix(data.claimUrl), [data.claimUrl]);
  const qrPx = square ? 150 : 220;
  const qrModule = qrPx / qr.length;
  const qrX = W - qrPx - 100;
  const qrY = H - qrPx - 100;

  const centerY = square ? 300 : 520;
  const accent = data.goldFlourish ? palette.gold500 : palette.brand400;

  const Avatar = ({ cx, cy, initials }: { cx: number; cy: number; initials: string }) => (
    <Group>
      <Circle cx={cx} cy={cy} r={56} color={palette.surface600} />
      <SkiaText x={cx - initials.length * 17} y={cy + 20} text={initials} font={initialFont} color={palette.textHi} />
    </Group>
  );

  return (
    <Canvas ref={canvasRef} style={{ width: W, height: H }}>
      <Fill color={palette.bg900} />
      <RoundedRect x={48} y={48} width={W - 96} height={H - 96} r={44}>
        <LinearGradient start={vec(0, 0)} end={vec(W, H)} colors={gradients.surface} />
      </RoundedRect>

      {/* Pro holographic sheen — a faint diagonal rainbow wash. */}
      {data.holographic && (
        <Rect x={48} y={48} width={W - 96} height={H - 96} opacity={0.14}>
          <LinearGradient start={vec(0, 0)} end={vec(W, H)} colors={gradients.holographic} />
        </Rect>
      )}

      {/* Accent bar (gold for golden/star, brand otherwise). */}
      <RoundedRect x={120} y={square ? 120 : 200} width={90} height={10} r={5} color={accent} />
      <SkiaText x={120} y={square ? 120 : 180} text={BRAND.wordmark} font={wordFont} color={accent} />

      <Avatar cx={176} cy={centerY} initials={data.teamAInitials} />
      <SkiaText x={264} y={centerY + 18} text={data.teamAName} font={nameFont} color={palette.textHi} />

      <SkiaText x={120} y={centerY + 230} text={data.scoreline} font={bigFont} color={palette.textHi} />

      <Avatar cx={176} cy={centerY + 360} initials={data.teamBInitials} />
      <SkiaText x={264} y={centerY + 378} text={data.teamBName} font={nameFont} color={palette.textMid} />

      {!square && (
        <>
          <SkiaText x={120} y={1240} text={data.signatureStat} font={smallFont} color={accent} />
          <SkiaText x={120} y={1320} text={`${data.dateLabel}`} font={smallFont} color={palette.textMid} />
          <SkiaText x={120} y={1400} text={`Rating ${data.ratingDelta}`} font={smallFont} color={palette.accent400} />
        </>
      )}

      {/* Claim QR — white quiet zone + dark modules. */}
      <Rect x={qrX - 18} y={qrY - 18} width={qrPx + 36} height={qrPx + 36} color={palette.textHi} />
      {qr.map((row, y) =>
        row.map((on, x) =>
          on ? (
            <Rect key={`${x}-${y}`} x={qrX + x * qrModule} y={qrY + y * qrModule} width={qrModule} height={qrModule} color={palette.bg900} />
          ) : null,
        ),
      )}
      <SkiaText x={120} y={qrY + 90} text="Claim your profile →" font={smallFont} color={palette.textLo} />
    </Canvas>
  );
}
