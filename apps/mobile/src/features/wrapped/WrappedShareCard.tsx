import { Platform } from 'react-native';
import type { RefObject } from 'react';
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
import { gradients, palette } from '@padel/design-tokens';
import { BRAND } from '@padel/shared';
import type { WrappedCardData } from './buildWrappedCardData';

export const WRAPPED_CARD_W = 1080;
export const WRAPPED_CARD_H = 1920;

const family = Platform.select({ ios: 'Helvetica', default: 'sans-serif' })!;
const wordFont = matchFont({ fontFamily: family, fontSize: 52 });
const kickerFont = matchFont({ fontFamily: family, fontSize: 40 });
const archetypeFont = matchFont({ fontFamily: family, fontSize: 96 });
const statValueFont = matchFont({ fontFamily: family, fontSize: 84 });
const statLabelFont = matchFont({ fontFamily: family, fontSize: 34 });
const footFont = matchFont({ fontFamily: family, fontSize: 36 });

/**
 * The shareable Season Wrapped card, rendered on-device with Skia (zero server
 * COGS). A holographic-tinted hero with the player's archetype over a 2×3 grid
 * of season highlights, the wordmark, and a claim line. Snapshot off-screen via
 * the canvas ref and pushed through the same `shareCanvas` path as the match card.
 */
export function WrappedShareCard({
  data,
  canvasRef,
}: {
  data: WrappedCardData;
  canvasRef?: RefObject<SkCanvas>;
}) {
  const W = WRAPPED_CARD_W;
  const H = WRAPPED_CARD_H;
  const cols = 2;
  const gridX = 120;
  const gridW = W - gridX * 2;
  const cellW = gridW / cols;
  const gridTop = 900;
  const rowH = 240;

  return (
    <Canvas ref={canvasRef} style={{ width: W, height: H }}>
      <Fill color={palette.bg900} />
      <RoundedRect x={48} y={48} width={W - 96} height={H - 96} r={44}>
        <LinearGradient start={vec(0, 0)} end={vec(W, H)} colors={gradients.surface} />
      </RoundedRect>

      {/* Holographic wash across the hero. */}
      <Rect x={48} y={48} width={W - 96} height={640} opacity={0.16}>
        <LinearGradient start={vec(0, 0)} end={vec(W, 640)} colors={gradients.holographic} />
      </Rect>

      <RoundedRect x={120} y={180} width={90} height={10} r={5} color={palette.gold500} />
      <SkiaText x={120} y={160} text={`${BRAND.wordmark} · WRAPPED`} font={wordFont} color={palette.gold500} />

      <SkiaText x={120} y={360} text={data.seasonLabel} font={kickerFont} color={palette.textMid} />
      <SkiaText x={120} y={470} text="You played like" font={kickerFont} color={palette.textMid} />
      <SkiaText x={120} y={580} text={data.archetype} font={archetypeFont} color={palette.textHi} />

      {data.stats.map((s, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = gridX + col * cellW;
        const y = gridTop + row * rowH;
        return (
          <Group key={s.label}>
            <SkiaText x={x} y={y} text={s.value} font={statValueFont} color={palette.brand400} />
            <SkiaText x={x} y={y + 48} text={s.label.toUpperCase()} font={statLabelFont} color={palette.textMid} />
          </Group>
        );
      })}

      {data.favouritePartner && (
        <SkiaText x={120} y={1720} text={`Best with ${data.favouritePartner}`} font={footFont} color={palette.accent400} />
      )}
      <SkiaText x={120} y={1800} text={`Make your mark · ${BRAND.universalLinkHost}`} font={footFont} color={palette.textLo} />
    </Canvas>
  );
}
