import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function QuizNav() {
  return (
    <header className="relative w-full border-b border-white/8 bg-[#060D1A]/60 backdrop-blur-xl sticky top-0 z-40">
      <div className="absolute bottom-0 inset-x-0 divider-glow" />
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <Link href="/" aria-label="Avatar India home">
          <Image
            src="/landingpage-images/Avatar_logo_Light.svg"
            alt="Avatar India"
            width={119}
            height={32}
            className="h-7 w-auto"
            priority
          />
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] text-white/45 hover:text-white transition-colors duration-250"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back To Learning
        </Link>
      </div>
    </header>
  );
}
