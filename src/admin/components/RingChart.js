import React from 'react';
import { useTheme } from '../../shared/theme/ThemeContext';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

export default function RingChart({
  size = 140,
  stroke = 12,
  progress = 0.72,
  trackColor,
  gradientStart,
  gradientEnd,
}) {
  const { colors } = useTheme();
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  return (
    <Svg width={size} height={size}>
      <Defs>
        <SvgGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={gradientStart ?? colors.primary} />
          <Stop offset="1" stopColor={gradientEnd ?? colors.accent} />
        </SvgGradient>
      </Defs>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={trackColor ?? colors.border}
        strokeWidth={stroke}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="url(#ringGrad)"
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        rotation="-90"
        originX={size / 2}
        originY={size / 2}
      />
    </Svg>
  );
}
