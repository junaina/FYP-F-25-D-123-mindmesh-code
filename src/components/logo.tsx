import Image from "next/image";
import Link from "next/link";
export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <Link href="/" className="flex items-center gap-2">
      <Image
        src="/logo.png"
        alt="mindmesh Logo"
        width={size}
        height={size}
        priority
      />
    </Link>
  );
}
