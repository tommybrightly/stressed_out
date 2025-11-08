import React from "react";
import Svg, { Path, G } from "react-native-svg";

type Props = {
  size?: number;
  color?: string;         // React Navigation passes this
  focused?: boolean;      // Optional — you can style differently if focused
};

export default function PieTabIcon({ size = 24, color = "#64748b", focused }: Props) {
  // simple 3-slice pie; the whole glyph tints with `color`, and we vary opacity for slices
  // viewBox 0..24 keeps it crisp at any size
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G>
        {/* Slice 1: 0..120° */}
        <Path
          d="M12 12 L12 2 A10 10 0 0 1 21.6603 8.6603 Z"
          fill={color}
          opacity={focused ? 1 : 0.95}
        />
        {/* Slice 2: 120..240° */}
        <Path
          d="M12 12 L21.6603 8.6603 A10 10 0 0 1 8.6603 21.6603 Z"
          fill={color}
          opacity={focused ? 0.8 : 0.7}
        />
        {/* Slice 3: 240..360° */}
        <Path
          d="M12 12 L8.6603 21.6603 A10 10 0 0 1 12 2 Z"
          fill={color}
          opacity={focused ? 0.6 : 0.5}
        />
      </G>
    </Svg>
  );
}
