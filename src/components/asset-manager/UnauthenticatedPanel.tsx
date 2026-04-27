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
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ShieldIcon />
        </EmptyMedia>
        <EmptyTitle>Login diperlukan</EmptyTitle>
        <EmptyDescription>
          Masuk ke Asset Manager untuk mengaktifkan akses extension.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button render={<a href={loginUrl} rel="noreferrer" target="_blank" />}>
          <LogInIcon data-icon="inline-start" />
          Login Asset Manager
          <ExternalLinkIcon data-icon="inline-end" />
        </Button>
        <p className="text-xs text-muted-foreground break-all">{loginUrl}</p>
      </EmptyContent>
    </Empty>
  );
}
