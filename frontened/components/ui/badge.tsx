import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeTone =
  | "default"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "soft"
  | "demo"
  | "dark"
  | "outline"
  | "indigo";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeTone;
  tone?: BadgeTone;
}

export function Badge({ className, variant, tone, ...props }: BadgeProps) {
  const activeVariant: BadgeTone = tone || variant || "default";

  const variants: Record<BadgeTone, string> = {
    default: "border-[#dfe6f1] bg-[rgba(247,249,253,0.9)] text-[#56657e]",
    secondary: "border-[#dfe6f1] bg-[#f5f7fb] text-[#56657e]",
    soft: "badge soft",
    demo: "badge demo",
    success: "badge success",
    warning: "badge warning",
    dark: "badge dark",
    danger: "border-[#f7d4d8] bg-[#fff1f2] text-[#c44f5a]",
    outline: "border-[#dfe6f1] bg-transparent text-[#66758e]",
    indigo: "border-[#cbd5fb] bg-[#edf1ff] text-[#4056c6]",
  };

  return (
    <span
      className={cn(
        "badge inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full border tracking-normal",
        variants[activeVariant],
        className
      )}
      {...props}
    />
  );
}
