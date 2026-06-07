import { CreditCardIcon, ExternalLinkIcon, PackageIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExtensionPackage } from "@/lib/api/extensionApiTypes";

import { createPackageCheckoutUrl } from "./packageCheckoutUrl";

type PackageListProps = {
  apiBaseUrl: string;
  packages: ExtensionPackage[];
};

export function PackageList({ apiBaseUrl, packages }: PackageListProps) {
  if (packages.length === 0) {
    return (
      <Card
        className="rounded-tvlink-card border border-tvlink-app-border bg-tvlink-card-bg shadow-tvlink-soft"
        size="sm"
      >
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
        <Card
          key={extensionPackage.id}
          className="rounded-tvlink-card border border-tvlink-app-border bg-tvlink-card-bg shadow-tvlink-soft"
          size="sm"
        >
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-tvlink-card bg-tvlink-primary-soft text-tvlink-primary">
                <PackageIcon />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <CardTitle>{extensionPackage.name}</CardTitle>
                <CardDescription>{extensionPackage.summary}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-tvlink-text-strong">
              {formatRupiah(extensionPackage.amountRp)}
            </p>
            <Button
              className="rounded-tvlink-button border border-tvlink-app-border bg-tvlink-card-bg text-tvlink-text-strong shadow-sm transition duration-150 hover:-translate-y-0.5 hover:border-tvlink-primary-border hover:bg-tvlink-primary-soft hover:text-tvlink-primary-hover hover:shadow-tvlink-soft"
              nativeButton={false}
              render={
                <a
                  href={createPackageCheckoutUrl(apiBaseUrl, extensionPackage.checkoutUrl)}
                  rel="noreferrer"
                  target="_blank"
                />
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
