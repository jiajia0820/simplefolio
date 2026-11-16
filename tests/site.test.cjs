const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "src/index.html"), "utf8");
const animationSource = fs
  .readFileSync(path.join(root, "src/scripts/scrollReveal.js"), "utf8")
  .replace("export default function", "function");

test("retains the original Simplefolio section order and three project slots", () => {
  const sections = [...html.matchAll(/<section id="([^"]+)"/g)].map(
    (match) => match[1]
  );
  assert.deepEqual(sections, ["hero", "about", "projects", "contact"]);
  assert.equal(
    (html.match(/class="project-wrapper__text-title"/g) || []).length,
    3
  );
  assert.match(html, /<html lang="zh-CN"/);
  assert.match(html, /吕佳阳/);
  assert.match(html, /119 个评分单元/);
});

test("keeps missing video, source, and resume assets explicitly unavailable", () => {
  assert.equal((html.match(/>视频待补充</g) || []).length, 3);
  assert.equal((html.match(/>源码待补充</g) || []).length, 3);
  assert.match(html, /公开版简历待补充/);
  assert.doesNotMatch(html, /<(?:video|iframe)\b/);
  assert.doesNotMatch(html, /(?:src|href)="(?:|#!)"/);
  assert.doesNotMatch(html, /href="assets\/resume\.pdf"/);
});

test("all local assets and in-page links exist", () => {
  for (const [, attribute, value] of html.matchAll(/\b(src|href)="([^"]+)"/g)) {
    if (/^(?:https?:|mailto:)/.test(value)) continue;
    if (value.startsWith("#")) {
      assert.ok(
        html.includes(`id="${value.slice(1)}"`),
        `Missing anchor: ${value}`
      );
      continue;
    }
    assert.ok(
      fs.existsSync(path.join(root, "src", value)),
      `Missing ${attribute} asset: ${value}`
    );
  }
});

test("does not include private resume contacts or local document paths", () => {
  assert.doesNotMatch(html, /\b1[3-9]\d{9}\b/);
  assert.doesNotMatch(html, /@njupt\.edu\.cn/i);
  assert.doesNotMatch(html, /[EF]:[\\/]/);
  assert.doesNotMatch(html, /Your Name|Unknown Developer|Project Title/);
});

test("placeholder labels retain the original CTA font size", () => {
  const styles = fs.readFileSync(
    path.join(root, "src/sass/components/_buttons.scss"),
    "utf8"
  );
  assert.match(
    styles,
    /\.cta-placeholder\s*\{[^}]*font-size:\s*\$default-font-size/s
  );
});

function animationContext({ available = false, reducedMotion = false } = {}) {
  const removedClasses = [];
  const reveals = [];
  const scrollReveal = () => ({
    reveal: (...args) => reveals.push(args),
  });
  const context = {
    window: {
      matchMedia: () => ({ matches: reducedMotion }),
      ...(available ? { ScrollReveal: scrollReveal } : {}),
    },
    document: {
      documentElement: {
        classList: {
          remove: (name) => removedClasses.push(name),
        },
      },
    },
    ...(available ? { ScrollReveal: scrollReveal } : {}),
  };
  vm.createContext(context);
  vm.runInContext(animationSource, context);
  return { context, removedClasses, reveals };
}

test("shows static content if the optional animation CDN fails", () => {
  const { context, removedClasses } = animationContext();
  context.initScrollReveal([{ element: ".hero-title" }], {});
  assert.deepEqual(removedClasses, ["sr"]);
});

test("respects reduced-motion preferences", () => {
  const { context, removedClasses, reveals } = animationContext({
    available: true,
    reducedMotion: true,
  });
  context.initScrollReveal([{ element: ".hero-title" }], {});
  assert.deepEqual(removedClasses, ["sr"]);
  assert.equal(reveals.length, 0);
});

test("retains the original reveal behavior when animations are available", () => {
  const { context, removedClasses, reveals } = animationContext({
    available: true,
  });
  context.initScrollReveal(
    [{ element: ".hero-title", animation: { delay: 100 } }],
    { distance: "30px" }
  );
  assert.equal(removedClasses.length, 0);
  assert.equal(reveals.length, 1);
  assert.equal(reveals[0][0], ".hero-title");
  assert.equal(reveals[0][1].distance, "30px");
  assert.equal(reveals[0][1].delay, 100);
});
