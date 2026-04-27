import { isValidElement, type ReactElement, type ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { Button } from "@/components/ui/button";
import { PackageList } from "@/components/asset-manager/PackageList";
import { UnauthenticatedPanel } from "@/components/asset-manager/UnauthenticatedPanel";
import { VersionGatePanel } from "@/components/asset-manager/VersionGatePanel";

type ButtonElementProps = {
  children?: ReactNode;
  nativeButton?: boolean;
  render?: ReactNode;
};

describe("asset manager link buttons", () => {
  it("disables native button semantics when Button renders an anchor", () => {
    const linkButtons = [
      ...collectAnchorRenderedButtons(
        UnauthenticatedPanel({ loginUrl: "http://localhost:3000/login" }),
      ),
      ...collectAnchorRenderedButtons(
        VersionGatePanel({
          version: {
            downloadUrl: "http://localhost:3000/download",
            latestVersion: "2.0.1",
            minimumVersion: "2.0.0",
            status: "update_required",
          },
        }),
      ),
      ...collectAnchorRenderedButtons(
        PackageList({
          apiBaseUrl: "http://localhost:3000",
          packages: [
            {
              amountRp: 150_000,
              checkoutUrl: "/paymentdummy?packageId=pkg-1",
              id: "pkg-1",
              name: "Paket 1",
              summary: "Mixed access",
            },
          ],
        }),
      ),
    ];

    expect(linkButtons).toHaveLength(3);
    expect(linkButtons.every((button) => button.props.nativeButton === false)).toBe(true);
  });
});

function collectAnchorRenderedButtons(node: ReactNode): ReactElement<ButtonElementProps>[] {
  if (!isValidElement<ButtonElementProps>(node)) {
    return [];
  }

  const currentMatches =
    node.type === Button && isValidElement(node.props.render) && node.props.render.type === "a"
      ? [node]
      : [];
  const children = Array.isArray(node.props.children)
    ? node.props.children
    : [node.props.children];

  return [
    ...currentMatches,
    ...children.flatMap((child) => collectAnchorRenderedButtons(child)),
  ];
}
