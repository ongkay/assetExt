import type { ReactNode } from "react";

type ActionButtonProps = {
  children: ReactNode;
  onClick: () => void;
  variant?: "solid" | "outline";
};

export function ActionButton({ children, onClick, variant = "outline" }: ActionButtonProps) {
  const className =
    variant === "solid"
      ? "inline-flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-200"
      : "inline-flex items-center justify-center rounded-md border border-white/20 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10";

  return (
    <button className={className} type="button" onClick={onClick}>
      {children}
    </button>
  );
}
