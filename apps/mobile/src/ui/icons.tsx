import Svg, { Circle, Path, Rect } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

/**
 * Custom padel glyphs (2px rounded stroke, sport-forward) drawn with SVG so they
 * scale crisply and tint from theme colours. Generic UI icons come from
 * lucide-react-native (re-exported below).
 */
export function PadelRacket({ size = 24, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2c4.4 0 8 3.4 8 7.6C20 14 16.4 17 12 17S4 14 4 9.6C4 5.4 7.6 2 12 2Z" stroke={color} strokeWidth={2} />
      <Path d="M10.5 17l-1 5M13.5 17l1 5" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Circle cx={9.5} cy={8.5} r={1} fill={color} />
      <Circle cx={14.5} cy={8.5} r={1} fill={color} />
      <Circle cx={12} cy={11.5} r={1} fill={color} />
    </Svg>
  );
}

export function PadelBall({ size = 24, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={2} />
      <Path d="M5 8c4 2 10 2 14 0M5 16c4-2 10-2 14 0" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function CourtGlass({ size = 24, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={4} width={18} height={16} rx={2} stroke={color} strokeWidth={2} />
      <Path d="M12 4v16M3 12h18" stroke={color} strokeWidth={2} />
    </Svg>
  );
}

// Re-export the world-class generic icon set for everything non-padel.
export {
  ChevronRight,
  Play,
  History,
  BarChart3,
  Users,
  User,
  Share2,
  Trophy,
  Undo2,
  RotateCcw,
  Timer,
  Crown,
  Sparkles,
  Settings,
} from 'lucide-react-native';
