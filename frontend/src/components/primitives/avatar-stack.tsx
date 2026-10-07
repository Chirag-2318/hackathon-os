import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Avatar as ShadcnAvatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type * as React from "react";

/**
 * C09 — Avatar / Stack
 * §4 C09: 24/32/40/56 sizes. Circle. Image or fallback initials.
 * Presence dot optional (8px bottom-right, lime).
 * Stack mode (-8px margin, 2px border stroke).
 */

const avatarSizes = cva("relative shrink-0 rounded-pill", {
  variants: {
    size: {
      xs: "size-6 text-[10px]",
      sm: "size-8 text-xs",
      md: "size-10 text-sm",
      lg: "size-14 text-base",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

interface UserAvatarProps extends Omit<React.ComponentProps<typeof ShadcnAvatar>, "size">, VariantProps<typeof avatarSizes> {
  src?: string;
  initials?: string;
  presence?: boolean;
  /** Pass a custom pastel color for fallback, or it will default to surface-sunken */
  fallbackColor?: string;
  stacked?: boolean;
}

function UserAvatar({
  className,
  size,
  src,
  initials,
  presence = false,
  fallbackColor = "var(--surface-sunken)",
  stacked = false,
  ...props
}: UserAvatarProps) {
  return (
    <div
      className={cn(
        "relative inline-flex",
        stacked && "-ml-2 first:ml-0 ring-2 ring-surface",
        stacked && "rounded-pill" // ensures the ring wraps circularly
      )}
    >
      <ShadcnAvatar className={cn(avatarSizes({ size }), className)} {...props}>
        <AvatarImage src={src} />
        <AvatarFallback
          className="font-semibold text-ink"
          style={{ backgroundColor: fallbackColor }}
        >
          {initials}
        </AvatarFallback>
      </ShadcnAvatar>
      
      {presence && (
        <span
          className={cn(
            "absolute bottom-0 right-0 size-2.5 rounded-full bg-success-solid ring-2 ring-surface",
            // Adjust presence dot position slightly for different sizes so it stays on the border
            size === "xs" && "size-2 right-0 bottom-0",
            size === "lg" && "size-3 right-0.5 bottom-0.5"
          )}
        />
      )}
    </div>
  );
}

interface AvatarStackProps extends React.ComponentProps<"div"> {
  users: Array<{ id: string; name: string; src?: string; initials: string; fallbackColor?: string }>;
  max?: number;
  size?: VariantProps<typeof avatarSizes>["size"];
}

function AvatarStack({ users, max = 3, size = "sm", className, ...props }: AvatarStackProps) {
  const displayUsers = users.slice(0, max);
  const remainder = users.length - max;

  return (
    <div className={cn("flex items-center", className)} {...props}>
      {displayUsers.map((u) => (
        <UserAvatar
          key={u.id}
          size={size}
          src={u.src}
          initials={u.initials}
          fallbackColor={u.fallbackColor}
          stacked
        />
      ))}
      {remainder > 0 && (
        <div
          className={cn(
            avatarSizes({ size }),
            "-ml-2 ring-2 ring-surface flex items-center justify-center bg-surface-sunken text-ink-muted font-semibold",
            size === "xs" && "text-[10px]",
            size === "sm" && "text-xs",
            size === "md" && "text-sm",
            size === "lg" && "text-base"
          )}
        >
          +{remainder}
        </div>
      )}
    </div>
  );
}

export { UserAvatar, AvatarStack };
export type { UserAvatarProps, AvatarStackProps };
