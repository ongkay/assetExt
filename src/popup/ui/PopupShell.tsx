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
          ? "w-[332px] bg-background px-4 py-4 text-foreground"
          : "invisible w-[332px] bg-background px-4 py-4 text-foreground"
      }
    >
      {children}
    </main>
  );
}
