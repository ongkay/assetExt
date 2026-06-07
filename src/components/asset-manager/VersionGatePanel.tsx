import { DownloadIcon, ShieldAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { ExtensionVersionStatus } from "@/lib/api/extensionApiTypes";

type VersionGatePanelProps = {
  version: Exclude<ExtensionVersionStatus, { status: "supported" }>;
};

export function VersionGatePanel({ version }: VersionGatePanelProps) {
  const isRequiredUpdate = version.status === "update_required";

  return (
    <Empty className="min-h-[420px] rounded-tvlink-card border border-tvlink-app-border bg-tvlink-card-bg px-6 py-10 shadow-tvlink-soft">
      <EmptyHeader className="gap-3">
        <EmptyMedia
          className="size-11 rounded-tvlink-card border border-tvlink-warning-border bg-tvlink-warning-bg text-tvlink-warning"
          variant="icon"
        >
          <ShieldAlertIcon />
        </EmptyMedia>
        <EmptyTitle>{isRequiredUpdate ? "Update wajib tersedia" : "Update tersedia"}</EmptyTitle>
        <EmptyDescription>
          Versi terbaru {version.latestVersion}. Minimum versi yang didukung {version.minimumVersion}.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-tvlink-button border-0 bg-[linear-gradient(135deg,var(--tvlink-button-gradient-start)_0%,var(--tvlink-button-gradient-end)_100%)] text-sm font-semibold text-white shadow-tvlink-button transition duration-150 hover:-translate-y-0.5 hover:shadow-tvlink-button-hover"
          nativeButton={false}
          render={<a href={version.downloadUrl} rel="noreferrer" target="_blank" />}
        >
          <DownloadIcon data-icon="inline-start" />
          Download update
        </Button>
      </EmptyContent>
    </Empty>
  );
}
