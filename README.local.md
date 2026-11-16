# 吕佳阳的 Simplefolio 第一版

本版只套用 Simplefolio，保留原模板布局与配色。
内容根据本次提供的主版简历提炼，视频与源码尚未接入。
原模板说明仍保留在 `README.md`，许可证保留在 `LICENSE.md`。

## 本地运行

本轮验证环境为 Node.js 24.14.1、npm 11.11.0。
`.nvmrc` 已对齐该 Node.js 版本。

```powershell
npm ci
npm start -- --host 127.0.0.1
```

浏览器打开终端输出的本地地址，默认端口为 1234。

## 构建

```powershell
npm test
npm run build
```

测试覆盖模板结构、占位状态、资源路径、隐私检查和动画兜底。
产物位于被 Git 忽略的 `dist/`。
本轮未推送 GitHub，未配置远程部署。

原模板的 Parcel 2.8.2 在当前中文路径下，缓存阶段会出现
`Error opening directory`。运行脚本加入 `--no-cache` 避开该问题，
没有升级或替换原有依赖。代价是再次构建时不复用磁盘缓存。

原仓库自带面向 `main` 分支的 GitHub Pages 工作流，本轮保留且未执行。
后续发布前，需要核对部署分支、项目页资源子路径和内容公开范围。

## 主要文件

| 文件                                                         | 用途                             |
| ------------------------------------------------------------ | -------------------------------- |
| `src/index.html`                                             | 首屏、简介、三个项目、联系与页脚 |
| `src/assets/profile-placeholder.svg`                         | 明确标记的头像占位图             |
| `src/assets/project-placeholder.svg`                         | 项目演示占位图                   |
| `src/scripts/scrollReveal.js`                                | 原版动画及静态显示兜底           |
| `docs/superpowers/specs/2026-11-16-simplefolio-v1-design.md` | 本次范围与验收计划               |

验证结果记录在 `docs/verification.md`。

## 等待补充的材料

- 项目演示视频或可公开播放地址。
- 项目源码仓库地址。
- 可用于公开下载的简历版本。
- 需要公开展示的头像、邮箱或其他联系方式。

上述未提供的内容没有空链接或假播放器。
占位提示不可点击，不会打开错误页面或请求不存在的视频。
原模板遗留的示例素材没有被页面引用。
不应将原始私有简历或 Obsidian 笔记直接加入可发布资源。

## Git 回退与比较

工作分支：`codex/simplefolio-v1`。

| 标签              | 内容                          |
| ----------------- | ----------------------------- |
| `v0.0.0-template` | 完全未改动的 Simplefolio 模板 |
| `v0.1.0-shell`    | 完成校验的个人网站第一版      |

先确认工作区状态：

```powershell
git status
```

在新的本地分支查看原模板，不覆盖现有版本：

```powershell
git switch -c review/template v0.0.0-template
```

返回第一版工作分支：

```powershell
git switch codex/simplefolio-v1
```

比较两个版本：

```powershell
git diff v0.0.0-template v0.1.0-shell
```

以上操作要求先保存或提交手头的改动。
不要用强制重置覆盖未保存的修改。
