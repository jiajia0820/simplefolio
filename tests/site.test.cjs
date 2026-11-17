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
  assert.equal((html.match(/>视频待补充</g) || []).length, 1);
  assert.equal((html.match(/>源码待补充</g) || []).length, 1);
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

test("placeholder labels use original anchor styling without custom CSS", () => {
  const styles = fs.readFileSync(
    path.join(root, "src/sass/components/_buttons.scss"),
    "utf8"
  );
  const anchors = [...html.matchAll(/<a\b[^>]*>/g)]
    .map((match) => match[0])
    .filter(
      (tag) => /class="cta-btn\b/.test(tag) && /aria-disabled="true"/.test(tag)
    );
  assert.equal(anchors.length, 3);
  assert.ok(anchors.every((tag) => !/\bhref=/.test(tag)));
  assert.doesNotMatch(styles, /\.cta-placeholder/);
  assert.doesNotMatch(
    html,
    /cta-placeholder|profile-placeholder|project-placeholder/
  );
});

test("connects the first two projects to their own demo and source links", () => {
  const projects = html.split('class="project-wrapper__text-title">').slice(1);
  for (const [index, name, repository] of [
    [0, "zhijia", "zhijia-list"],
    [1, "business-agent", "chinook-business-agent"],
  ]) {
    const project = projects[index];
    assert.equal(
      (
        project.match(
          new RegExp(`href="assets/media/${name}-demo\\.mp4"`, "g")
        ) || []
      ).length,
      2
    );
    assert.ok(
      project.includes(`href="https://github.com/jiajia0820/${repository}"`)
    );
    const links = [...project.matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*>/g)].map(
      (match) => match[0]
    );
    assert.equal(links.length, 3);
    assert.ok(links.every((link) => /\btarget="_blank"/.test(link)));
    assert.ok(links.every((link) => /\brel="noopener noreferrer"/.test(link)));
    assert.ok(links.every((link) => !/aria-disabled|tabindex="-1"/.test(link)));
  }
  const thirdProject = projects[2].split("<!-- /END Project -->")[0];
  assert.match(thirdProject, /智慧病区巡检/);
  assert.doesNotMatch(thirdProject, /<a\b[^>]*\bhref=/);
});

test("uses approved real images without changing the original media proportions", () => {
  assert.match(html, /viewBox="300 800 700 700"/);
  assert.match(html, /href="assets\/media\/portrait-lifestyle\.jpg"/);
  assert.equal((html.match(/viewBox="0 0 1600 900"/g) || []).length, 3);
  assert.match(html, /href="assets\/media\/business-agent\.png"/);
  assert.match(html, /href="assets\/media\/ward-robots\.jpg"/);
  assert.doesNotMatch(html, /(?:src|href)="assets\/(?:profile|project)\.jpg"/);
});

test("shows three complete smart-home screens in one landscape frame", () => {
  const projectStart = html.indexOf("智家清单实机截图");
  const projectEnd = html.indexOf("</svg>", projectStart);
  const composition = html.slice(projectStart, projectEnd);
  assert.equal((composition.match(/<image\b/g) || []).length, 3);
  for (const name of ["home", "assessment", "plan"]) {
    assert.match(
      composition,
      new RegExp(`href="assets/media/zhijia-${name}\\.jpg"`)
    );
  }
  assert.equal(
    (composition.match(/preserveAspectRatio="xMidYMid meet"/g) || []).length,
    3
  );
});

test("retains the original footer design slots", () => {
  assert.equal((html.match(/class="github-button"/g) || []).length, 2);
  assert.match(html, /fa-twitter fa-inverse/);
  assert.match(html, /fa-linkedin fa-inverse/);
  assert.match(html, /fa-github fa-inverse/);
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
