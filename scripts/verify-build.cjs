const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const output = path.resolve(__dirname, "../dist");
const html = fs.readFileSync(path.join(output, "index.html"), "utf8");

// The HTML optimizer must preserve SVG coordinates for responsive image framing.
const viewBoxes = [...html.matchAll(/<svg\b[^>]*\bviewbox="([^"]+)"/gi)].map(
  (match) => match[1].split(/\s+/).map(Number)
);
assert.deepEqual(viewBoxes, [
  [300, 800, 700, 700],
  [0, 0, 1600, 900],
  [0, 0, 1600, 900],
  [0, 0, 1600, 900],
]);

const images = [...html.matchAll(/<image\b[^>]*\bhref="([^"]+)"/gi)].map(
  (match) => match[1]
);
assert.equal(images.length, 6);
for (const [index, name] of [
  "portrait-lifestyle",
  "zhijia-home",
  "zhijia-assessment",
  "zhijia-plan",
  "business-agent",
  "ward-robots",
].entries()) {
  assert.match(images[index], new RegExp(`^/${name}\\.[a-f0-9]+\\.(jpg|png)$`));
  assert.ok(
    fs.existsSync(path.join(output, images[index].slice(1))),
    `Missing production image: ${images[index]}`
  );
}
assert.doesNotMatch(html, /(?:src|href)="[^"]*\b(?:profile|project)\.jpg"/i);
console.log("Production media verified: 4 SVG viewBoxes and 6 bundled images.");
