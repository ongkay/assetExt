import { ExternalLinkIcon, LogInIcon, ShieldIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

type UnauthenticatedPanelProps = {
  loginUrl: string;
};

export function UnauthenticatedPanel({ loginUrl }: UnauthenticatedPanelProps) {
  return (
    <Empty className="min-h-[420px] rounded-tvlink-card border border-tvlink-app-border bg-tvlink-card-bg px-6 py-10 shadow-tvlink-soft">
      <EmptyHeader className="gap-3">
        <EmptyMedia
          className="size-11 rounded-tvlink-card border border-tvlink-primary-border bg-tvlink-primary-soft text-tvlink-primary"
          variant="icon"
        >
          <ShieldIcon />
        </EmptyMedia>
        <EmptyTitle>Login diperlukan</EmptyTitle>
        <EmptyDescription>Masuk ke TvLink untuk mengaktifkan akses extension.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-tvlink-button border-0 bg-[linear-gradient(135deg,var(--tvlink-button-gradient-start)_0%,var(--tvlink-button-gradient-end)_100%)] text-sm font-semibold text-white shadow-tvlink-button transition duration-150 hover:-translate-y-0.5 hover:shadow-tvlink-button-hover"
          nativeButton={false}
          render={<a href={loginUrl} rel="noreferrer" target="_blank" />}
        >
          <LogInIcon data-icon="inline-start" />
          Login TvLink
          <ExternalLinkIcon data-icon="inline-end" />
        </Button>
        <p className="break-all text-xs text-tvlink-muted">{loginUrl}</p>
      </EmptyContent>
    </Empty>
  );
}
