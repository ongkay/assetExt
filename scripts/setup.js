#!/usr/bin/env node

import { createInterface } from "readline";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { applyTemplateMetadata } from "./lib/apply-template-metadata.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt, defaultValue) {
  return new Promise((resolve) => {
    const displayPrompt = defaultValue ? `${prompt} (${defaultValue}): ` : `${prompt}: `;
    rl.question(displayPrompt, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

async function main() {
  const name = await question("Extension name", "My Extension");
  const description = await question(
    "Description",
    "A Chrome extension built with React and TypeScript",
  );
  const version = await question("Version", "0.1.0");

  applyTemplateMetadata({ rootDir, name, description, version });

  rl.close();
}

main().catch(() => {
  rl.close();
  process.exit(1);
});
