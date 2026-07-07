import { Svg, Path, Circle } from "@react-pdf/renderer";
import { brand } from "@/lib/brand";

export function LogoMark({ size = 44 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Circle cx="24" cy="24" r="24" fill={brand.white} />
      <Path
        d="M14 16c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2v18c0 .6-.3 1.1-.8 1.4l-8 4.6c-.5.3-1.1.3-1.6 0l-8-4.6c-.5-.3-.8-.8-.8-1.4V16z"
        fill={brand.purple}
      />
      <Path
        d="M18 14h12v2H18z"
        fill={brand.lavender}
      />
      <Path
        d="M20 20h8v1.5H20zm0 4h8v1.5H20zm0 4h5.5v1.5H20z"
        fill={brand.lavenderLight}
      />
      <Path
        d="M30 14c2 0 3.5 1.2 3.5 3.5S32 21 30 21"
        stroke={brand.yellow}
        strokeWidth={1.5}
        fill="none"
      />
    </Svg>
  );
}
