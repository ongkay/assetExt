import { CreditCardIcon, ExternalLinkIcon, PackageIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ExtensionPackage } from "@/lib/api/extensionApiTypes";

type PackageListProps = {
  packages: ExtensionPackage[];
};

export function PackageList({ packages }: PackageListProps) {
  if (packages.length === 0) {
    return (
      <Card size="sm">
        <CardHeader>
          <CardTitle>Paket belum tersedia</CardTitle>
          <CardDescription>Belum ada paket renewal untuk akun ini.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {packages.map((extensionPackage) => (
        <Card key={extensionPackage.id} size="sm">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <PackageIcon />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <CardTitle>{extensionPackage.name}</CardTitle>
                <CardDescription>{extensionPackage.summary}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">{formatRupiah(extensionPackage.amountRp)}</p>
            <Button
              render={
                <a href={extensionPackage.checkoutUrl} rel="noreferrer" target="_blank" />
              }
              size="sm"
              variant="outline"
            >
              <CreditCardIcon data-icon="inline-start" />
              Checkout
              <ExternalLinkIcon data-icon="inline-end" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function formatRupiah(amountRp: number): string {
  return new Intl.NumberFormat("id-ID", {
    currency: "IDR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amountRp);
}
