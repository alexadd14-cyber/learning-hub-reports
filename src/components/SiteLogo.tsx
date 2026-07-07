import Image from "next/image";

export function SiteLogo({ size = 64 }: { size?: number }) {
  return (
    <Image
      src="/logo.svg"
      alt="The Learning Hub"
      width={size}
      height={size}
      priority
    />
  );
}
