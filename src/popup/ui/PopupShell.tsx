import type { ReactNode } from "react";

type PopupShellProps = {
  children: ReactNode;
  isThemeReady: boolean;
};

export function PopupShell({ children, isThemeReady }: PopupShellProps) {
  const shellClassName = isThemeReady
    ? "w-[380px] font-sans text-tvlink-text-base antialiased selection:bg-tvlink-primary/20"
    : "invisible w-[380px] font-sans text-tvlink-text-base antialiased selection:bg-tvlink-primary/20";

  return (
    <div className={shellClassName}>
      <main className="w-full overflow-hidden border border-tvlink-panel-border bg-[image:radial-gradient(circle_at_top_right,var(--tvlink-panel-glow),transparent_36%),var(--tvlink-panel-surface)] shadow-tvlink-app">
        <div className="flex min-h-[400px] flex-col p-4">{children}</div>
      </main>
    </div>
  );
}
