import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

export function applyTemplateMetadata({ rootDir, name, description, version }) {
  const packageName = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const packageJsonPath = resolve(rootDir, "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
  packageJson.name = packageName;
  packageJson.version = version;
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");

  const manifestPath = resolve(rootDir, "manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  manifest.name = name;
  manifest.description = description;
  manifest.version = version;
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

  const popupAppPath = resolve(rootDir, "src/popup/PopupApp.tsx");
  let popupApp = readFileSync(popupAppPath, "utf-8");
  popupApp = popupApp.replace(/My Extension/g, name);
  writeFileSync(popupAppPath, popupApp);

  const popupHtmlPath = resolve(rootDir, "popup.html");
  let popupHtml = readFileSync(popupHtmlPath, "utf-8");
  popupHtml = popupHtml.replace(/<title>.*<\/title>/, `<title>${name}</title>`);
  writeFileSync(popupHtmlPath, popupHtml);
}
