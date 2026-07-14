import {
  Canvas,
  Fill,
  Group,
  LinearGradient,
  RoundedRect,
  Text as SkiaText,
  matchFont,
  vec,
} from '@shopify/react-native-skia';
import { Platform } from 'react-native';
import { palette } from '@padel/design-tokens';
import { BRAND } from '@padel/shared';

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

const fontMgr = matchFont({ fontFamily: Platform.select({ ios: 'Helvetica', default: 'sans-serif' })!, fontSize: 64 });
const bigFont = matchFont({ fontFamily: Platform.select({ ios: 'Helvetica', default: 'sans-serif' })!, fontSize: 140 });

/**
 * The shareable match card, rendered entirely on-device with Skia (zero server
 * media COGS — the free share loop's billboard). Snapshot this off-screen with
 * makeImageSnapshot, encode to PNG, save to the gallery and hand to the OS
 * share sheet. Colours come from design-tokens so themes restyle the card too.
 */
export function MatchCard({ data }: { data: MatchCardData }) {
  return (
    <Canvas style={{ width: CARD_W, height: CARD_H }}>
      <Fill color={palette.bg900} />
      <Group>
        <RoundedRect x={64} y={64} width={CARD_W - 128} height={CARD_H - 128} r={40}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(CARD_W, CARD_H)}
            colors={[palette.surface700, palette.bg800]}
          />
        </RoundedRect>
      </Group>

      <SkiaText x={120} y={220} text={BRAND.wordmark} font={fontMgr} color={palette.brand400} />
      <SkiaText x={120} y={560} text={data.teamAName} font={fontMgr} color={palette.textHi} />
      <SkiaText x={120} y={720} text={data.scoreline} font={bigFont} color={palette.textHi} />
      <SkiaText x={120} y={880} text={data.teamBName} font={fontMgr} color={palette.textMid} />

      <SkiaText x={120} y={1200} text={data.signatureStat} font={fontMgr} color={palette.gold500} />
      <SkiaText x={120} y={1320} text={`${data.venue} · ${data.dateLabel}`} font={fontMgr} color={palette.textMid} />
      <SkiaText x={120} y={1440} text={`Rating ${data.ratingDelta}`} font={fontMgr} color={palette.accent400} />

      <SkiaText x={120} y={1760} text={data.claimUrl} font={fontMgr} color={palette.textLo} />
    </Canvas>
  );
}
