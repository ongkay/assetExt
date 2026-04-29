import type { ReactNode } from "react";

type PopupShellProps = {
  children: ReactNode;
  isThemeReady: boolean;
};

export function PopupShell({ children, isThemeReady }: PopupShellProps) {
  return (
    <main
      className={
        isThemeReady
          ? "relative w-[370px] min-h-[400px] bg-background px-5 py-5 text-foreground font-sans selection:bg-primary/20"
          : "invisible relative w-[370px] min-h-[400px] bg-background px-5 py-5 text-foreground font-sans"
      }
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      <div className="relative z-10">{children}</div>
    </main>
  );
}
