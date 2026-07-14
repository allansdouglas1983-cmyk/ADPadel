import { useEffect } from 'react';
import { Canvas, Fill, Rect, Shader, Skia, vec, LinearGradient } from '@shopify/react-native-skia';
import { useSharedValue, withRepeat, withTiming, useDerivedValue, Easing } from 'react-native-reanimated';
import { palette } from '@padel/design-tokens';

// A moving holographic sheen — a diagonal rainbow band that sweeps across the
// card, exactly the "holographic sheen (Skia shader)" the dossier calls for.
const source = Skia.RuntimeEffect.Make(`
uniform float2 resolution;
uniform float t;
half4 main(float2 xy) {
  float2 uv = xy / resolution;
  float band = fract((uv.x + uv.y) * 1.5 - t);
  float glow = smoothstep(0.45, 0.5, band) * (1.0 - smoothstep(0.5, 0.55, band));
  half3 rainbow = half3(
    0.5 + 0.5 * cos(6.2831 * (band + 0.00)),
    0.5 + 0.5 * cos(6.2831 * (band + 0.33)),
    0.5 + 0.5 * cos(6.2831 * (band + 0.66)));
  return half4(rainbow * glow * 0.6, glow * 0.5);
}`)!;

/** A holographic hero panel for the Wrapped finale. Renders behind content. */
export function HolographicCard({ width, height }: { width: number; height: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 4000, easing: Easing.linear }), -1, false);
  }, [t]);

  const uniforms = useDerivedValue(() => ({ resolution: [width, height], t: t.value }), [width, height]);

  return (
    <Canvas style={{ width, height, position: 'absolute' }}>
      <Rect x={0} y={0} width={width} height={height}>
        <LinearGradient start={vec(0, 0)} end={vec(width, height)} colors={[palette.surface700, palette.bg900]} />
      </Rect>
      <Fill>
        <Shader source={source} uniforms={uniforms} />
      </Fill>
    </Canvas>
  );
}
