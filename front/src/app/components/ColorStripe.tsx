import { STRIPE_COLORS } from "../../lib/constants";

interface ColorStripeProps {
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export function ColorStripe({ orientation = "horizontal", className = "" }: ColorStripeProps) {
  const isVertical = orientation === "vertical";
  return (
    <div
      className={`flex shrink-0 ${isVertical ? "flex-col h-full w-[10px]" : "flex-row w-full h-[14px]"} ${className}`}
    >
      {STRIPE_COLORS.map((color, i) => (
        <div key={i} style={{ backgroundColor: color, flex: 1 }} />
      ))}
    </div>
  );
}
