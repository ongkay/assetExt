import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

type ActionButtonProps = {
  children: ReactNode;
  onClick: () => void;
  variant?: "solid" | "outline";
};

export function ActionButton({ children, onClick, variant = "outline" }: ActionButtonProps) {
  return (
    <Button
      type="button"
      variant={variant === "solid" ? "default" : "outline"}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
