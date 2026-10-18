import React from "react";
import Image from "next/image";

interface BrandLogoProps {
  size?: number | "sm" | "md" | "lg" | "xl";
  withText?: boolean;
  textColor?: string;
  badge?: string;
  className?: string;
}

const SIZE_MAP = {
  sm: 24,
  md: 30,
  lg: 38,
  xl: 48,
};

export function BrandLogo({
  size = "md",
  withText = false,
  textColor = "text-[#15213b]",
  badge,
  className = "",
}: BrandLogoProps) {
  const pixelSize = typeof size === "number" ? size : SIZE_MAP[size] || 30;

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        className="relative shrink-0 flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
        style={{ width: pixelSize, height: pixelSize }}
      >
        <Image
          src="/logo.png"
          alt="SyncTies Logo"
          width={pixelSize}
          height={pixelSize}
          className="w-full h-full object-contain drop-shadow-sm select-none"
          priority
        />
      </div>

      {withText && (
        <span className="inline-flex items-center gap-2">
          <b className={`tracking-tight text-xl font-semibold font-heading ${textColor}`}>
            SyncTies
          </b>
          {badge && (
            <span
              className={`badge soft text-[11px] py-0.5 px-2 ${
                textColor === "text-white"
                  ? "bg-white/10 text-white border-white/20"
                  : ""
              }`}
            >
              {badge}
            </span>
          )}
        </span>
      )}
    </div>
  );
}
