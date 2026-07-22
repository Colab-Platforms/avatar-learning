"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { initials } from "@/components/profile/shared";

export interface UserAvatarProps {
  profileImage?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  rounded?: "full" | "2xl";
  showSkeleton?: boolean;
}

const sizeMap = {
  xs: { box: "h-7 w-7", text: "text-[11px]", image: 28 },
  sm: { box: "h-9 w-9", text: "text-xs", image: 36 },
  md: { box: "h-12 w-12", text: "text-sm", image: 48 },
  lg: { box: "h-16 w-16", text: "text-xl", image: 64 },
  xl: { box: "h-20 w-20", text: "text-2xl", image: 80 },
} as const;

export function UserAvatar({
  profileImage,
  firstName,
  lastName,
  email,
  size = "md",
  className,
  rounded = "full",
  showSkeleton = false,
}: UserAvatarProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const dims = sizeMap[size];
  const label = initials(firstName ?? null, lastName ?? null, email);
  const radius = rounded === "full" ? "rounded-full" : "rounded-2xl";
  const showImage = Boolean(profileImage) && !failed;

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden flex items-center justify-center font-bold text-white select-none",
        dims.box,
        radius,
        className,
      )}
      style={
        showImage
          ? undefined
          : {
              background:
                "linear-gradient(135deg, var(--color-brand-500) 0%, var(--color-brand-600) 100%)",
            }
      }
      aria-hidden={!showImage}
    >
      {showImage ? (
        <>
          {showSkeleton && !loaded && (
            <div className="absolute inset-0 animate-pulse bg-slate-200" />
          )}
          <Image
            src={profileImage!}
            alt={`${firstName ?? ""} ${lastName ?? ""}`.trim() || "Profile photo"}
            width={dims.image}
            height={dims.image}
            className={cn(
              "h-full w-full object-cover transition-opacity duration-300",
              loaded ? "opacity-100" : "opacity-0",
            )}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
          />
        </>
      ) : (
        <span className={dims.text}>{label}</span>
      )}
    </div>
  );
}
