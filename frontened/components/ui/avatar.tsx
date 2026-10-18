import * as React from "react";
import { cn } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  initials?: string;
  tone?: "violet" | "cyan" | "coral" | "blue" | "default";
  size?: "sm" | "md" | "lg" | "xl";
  src?: string | null;
  alt?: string;
}

export function Avatar({
  initials = "ST",
  tone = "default",
  size = "md",
  src,
  alt,
  className,
  ...props
}: AvatarProps) {
  const tones = {
    default: "",
    blue: "",
    violet: "avatar violet",
    cyan: "avatar cyan",
    coral: "avatar coral",
  };

  const sizes = {
    sm: "w-8 h-8 text-[11px] rounded-[10px]",
    md: "w-[42px] h-[42px] text-xs rounded-[13px]",
    lg: "w-[62px] h-[62px] text-base rounded-[17px]",
    xl: "w-[92px] h-[92px] text-2xl rounded-[24px]",
  };

  if (src) {
    return (
      <img
        src={src}
        alt={alt || initials}
        className={cn("object-cover shrink-0 shadow-xs", sizes[size], className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "avatar shrink-0 select-none font-bold",
        tones[tone],
        sizes[size],
        className
      )}
      {...props}
    >
      {initials}
    </span>
  );
}
