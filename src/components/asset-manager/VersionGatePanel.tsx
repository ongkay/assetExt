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
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ShieldAlertIcon />
        </EmptyMedia>
        <EmptyTitle>{isRequiredUpdate ? "Update wajib tersedia" : "Update tersedia"}</EmptyTitle>
        <EmptyDescription>
          Versi terbaru {version.latestVersion}. Minimum versi yang didukung {version.minimumVersion}.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
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
