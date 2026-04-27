import { expect, test } from "@playwright/test";

test("content overlay mounted in Shadow DOM does not change host heading styles", async ({
  page,
}) => {
  await page.setContent(`
    <!doctype html>
    <html>
      <body>
        <h1>Host heading</h1>
        <div id="asset-extension-root"></div>
      </body>
    </html>
  `);

  const before = await page.evaluate(() => {
    const heading = document.querySelector("h1");

    if (!heading) {
      throw new Error("Host heading missing.");
    }

    const headingStyle = getComputedStyle(heading);

    return {
      fontSize: headingStyle.fontSize,
      marginTop: headingStyle.marginTop,
    };
  });

  await page.evaluate(() => {
    const host = document.querySelector("#asset-extension-root");

    if (!host) {
      throw new Error("Shadow host missing.");
    }

    const shadowRoot = host.attachShadow({ mode: "open" });
    const overlaySection = document.createElement("section");
    overlaySection.textContent = "Asset access overlay";
    overlaySection.style.cssText = "position: fixed; inset: 0; margin: 0; font-size: 14px;";
    shadowRoot.appendChild(overlaySection);
  });

  const after = await page.evaluate(() => {
    const heading = document.querySelector("h1");

    if (!heading) {
      throw new Error("Host heading missing.");
    }

    const headingStyle = getComputedStyle(heading);

    return {
      fontSize: headingStyle.fontSize,
      marginTop: headingStyle.marginTop,
    };
  });

  expect(after).toEqual(before);
});
