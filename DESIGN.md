---
name: 白色相簿 · 设计系统
description: 白色相簿日记站的视觉语言 —— macOS 桌面应用的骨架，WHITE ALBUM 2 的白与冰蓝作皮肤
version: 1.1.0
colors:
  # 冷中性阶（hue 208–214，饱和度 14–40%）—— 没有一档是纯灰
  n0:
    value: "hsl(210 40% 100%)"
    use: 最上层实色面（抬起的卡片）
  n25:
    value: "hsl(208 38% 98.4%)"
    use: 内容主面 --surface
  n50:
    value: "hsl(208 34% 96.5%)"
    use: 凹陷面、表格斑马纹 --surface-sunken
  n100:
    value: "hsl(209 30% 93%)"
    use: 静态 chip 底、进度槽
  n200:
    value: "hsl(210 26% 87%)"
    use: 分隔线 --border
  n300:
    value: "hsl(210 20% 78%)"
    use: 强分隔线、控件描边 --border-strong
  n400:
    value: "hsl(210 16% 66%)"
    use: 禁用态文字（唯一允许低于 4.5:1 的文字）
  n500:
    value: "hsl(211 14% 53%)"
    use: 装饰性图标
  n600:
    value: "hsl(211 18% 42%)"
    use: 灰阶里的次要文字档位（--text-muted 另取 hsl(211 20% 38%)，见 Themes）
  n700:
    value: "hsl(212 22% 32%)"
    use: 正文 --text（白底 8.2:1）
  n800:
    value: "hsl(213 26% 24%)"
    use: 强调正文（11.3:1）
  n900:
    value: "hsl(214 32% 16%)"
    use: 标题 --text-strong（15.1:1）
  # 冰蓝主色阶（品牌锚点 ice-500 = #5E8FB3）
  ice50:
    value: "hsl(205 62% 96%)"
  ice100:
    value: "hsl(205 56% 91%)"
    use: 选中态底色 --accent-soft
  ice200:
    value: "hsl(205 48% 83%)"
  ice300:
    value: "hsl(205 42% 71%)"
  ice400:
    value: "hsl(205 38% 62%)"
  ice500:
    value: "hsl(205 38% 54%)"
    use: 品牌色 / 标识图形（非文字色）
  ice600:
    value: "hsl(207 44% 44%)"
    use: 深色态下的强调色
  ice700:
    value: "hsl(209 50% 35%)"
    use: 强调文字与主按钮底 --accent（白底 7.1:1，白字压其上也 7.1:1）
  ice800:
    value: "hsl(211 52% 27%)"
    use: 按钮按下态 --accent-press
  ice900:
    value: "hsl(212 54% 19%)"
  # 危险色：只给破坏性操作，不是第二个强调色
  danger:
    value: "hsl(6 52% 42%)"
    use: 破坏性操作的描边与文字（暗色 hsl(6 62% 68%)）
  dangerSoft:
    value: "hsl(6 60% 95%)"
    use: 破坏性操作的底（暗色 hsl(6 30% 20%)）
  # 击键墨点与仪式冰晶
  inkBloom:
    value: "hsl(205 62% 60%)"
    use: 每次击键的墨点
  flake1:
    value: "hsl(205 42% 71%)"
  flake2:
    value: "hsl(205 48% 83%)"
typography:
  # 界面用思源黑体，内容用思源宋体 —— 这一条是本站最重要的排版决定
  familyUi:
    value: "\"Noto Sans SC Variable\",\"PingFang SC\",\"Microsoft YaHei\",system-ui,sans-serif"
  familySerif:
    value: "\"Noto Serif SC Variable\",\"Songti SC\",\"Noto Serif SC\",serif"
  caption:
    fontSize: 12px
    lineHeight: 1.45
    fontWeight: 400
  footnote:
    fontSize: 13px
    lineHeight: 1.5
    fontWeight: 400
  callout:
    fontSize: 14px
    lineHeight: 1.5
    fontWeight: 400
  subhead:
    fontSize: 15px
    lineHeight: 1.5
    fontWeight: 500
  body:
    fontSize: 16px
    lineHeight: 1.6
    fontWeight: 400
  title3:
    fontSize: 17px
    lineHeight: 1.4
    fontWeight: 500
  title2:
    fontSize: 20px
    lineHeight: 1.35
    fontWeight: 500
  title1:
    fontSize: 24px
    lineHeight: 1.3
    fontWeight: 600
  large:
    fontSize: 28px
    lineHeight: 1.25
    fontWeight: 600
  display:
    fontSize: 34px
    lineHeight: 1.15
    fontWeight: 600
  # 统计页四张大数字卡专用；全站唯一超过 34px 的字号
  statNumber:
    fontSize: 40px
    lineHeight: 1.1
    fontWeight: 600
  # 写作区正文由用户自选 12/14/16/18/20/24/28 七档驱动 --body-size
  proseLineHeight:
    value: 1.8
  proseMeasure:
    value: "min(660px, 100%)"
rounded:
  xs:
    value: 6px
  sm:
    value: 10px
  md:
    value: 14px
  lg:
    value: 20px
  xl:
    value: 28px
  full:
    value: 999px
spacing:
  value: [4, 8, 12, 16, 24, 32, 48, 64, 96, 128]
shadow:
  e1:
    value: "0 1px 2px hsl(213 40% 20% / .06), 0 1px 3px hsl(213 40% 20% / .05)"
  e2:
    value: "0 4px 10px -2px hsl(213 40% 20% / .09)"
  e3:
    value: "0 12px 28px -6px hsl(213 40% 20% / .15)"
  e4:
    value: "0 24px 60px -12px hsl(213 40% 20% / .26)"
motion:
  easeOut:
    value: "cubic-bezier(0, 0, 0.2, 1)"
  easeInOut:
    value: "cubic-bezier(0.42, 0, 0.58, 1)"
  easeExit:
    value: "cubic-bezier(0.3, 0, 1, 1)"
  durPress:
    value: 100ms
  durMicro:
    value: 150ms
  durMedium:
    value: 200ms
  durScreen:
    value: 300ms
  durWallpaper:
    value: 1500ms
zIndex:
  wallpaper:
    value: 0
  snow:
    value: 1
  content:
    value: 10
  sticky:
    value: 20
  sidebar:
    value: 30
  floating:
    value: 60
  modalScrim:
    value: 100
  modal:
    value: 110
  lightbox:
    value: 120
  shotMask:
    value: 150
  toast:
    value: 400
wallpaper:
  opacityLight:
    value: 0.72
  opacityDark:
    value: 0.70
  scrimTopLight:
    value: "hsl(206 42% 97% / .62)"
  scrimMidLight:
    value: "hsl(205 40% 96% / .10)"
  scrimBottomLight:
    value: "hsl(206 42% 97% / .14)"
  scrimTopDark:
    value: "hsl(212 40% 6% / .66)"
  scrimMidDark:
    value: "hsl(212 38% 7% / .30)"
  scrimBottomDark:
    value: "hsl(212 40% 6% / .48)"
glass:
  surfaceLight:
    value: "rgba(252,253,255,.84)"
  surfaceDark:
    value: "rgba(20,32,46,.82)"
  edge:
    value: "rgba(255,255,255,.62)"
  blur:
    value: "blur(24px) saturate(180%)"
  blurSmall:
    value: "blur(16px) saturate(170%)"
layout:
  sidebar:
    value: 240px
  content:
    value: 1320px
  prose:
    value: 660px
  aside:
    value: 344px
---

## Overview

这个站点是一个**单文件的、离线的、私人的日记本**。它没有账号、没有后端、没有构建；`index.html` 一份文件既是路由、视图、样式表，也是全部业务逻辑。所有数据活在访客自己的浏览器里。

因此这份设计系统的第一原则不是"好看"，而是**不能让人读不下去**。改动之前，`.scrim` 把壁纸中央洗成 88% 白，内容卡片本身又是 `rgba(251,252,254,.91)` 的白 —— **两层浅色半透明叠在一起**，正文和壁纸一起被冲掉。翻阅过往与垃圾桶两个视图已经不可读。这不是审美问题，是功能问题。

第二原则是**骨架借 macOS，皮肤用 WHITE ALBUM 2**。骨架指层级数量、间距网格、圆角阶梯、材质归属、明度关系这些结构性的东西；皮肤指色相、文案、落雪、唱片、以及壁纸。骨架决定它"像个正经应用"，皮肤决定它是**这一本**相簿。两者不互相冒充：不要用动漫元素去撑结构，也不要用系统灰去替换冰蓝。

第三原则是**留白出现在文字两侧，不在行与行之间**。正文栏宽从 900px 收到 660px（约 42 字/行），行高从 2.1 收到 1.8。中文正文的舒适行长是 30–40 字，现在跑到了 56 字 —— 空气堆在了字距里，却让每行跑了太远。

## Colors

**色阶结构**：冷中性 11 档（`n0`–`n900`）+ 冰蓝 10 档（`ice50`–`ice900`）。中性阶的色相在 208–214 之间、饱和度 14–40%，**没有任何一档是纯灰** —— 这样它在视觉上属于这个网站，同时保留系统 UI 的克制。

**为什么不用纯灰**：Apple 的高级感来自**明度关系与留白**，不来自"灰"。直接搬系统灰会变成"Mac 应用里塞了张动漫壁纸"，两边都输；把灰阶的明度结构照抄、色相偏到冰蓝，才能同时拿到"像个正经应用"和"WA2 的冷"。

**文字色只有三种，三种都过 4.5:1**（`refactoring-ui` 硬规则）：

| 令牌 | 值 | 白底对比度 | 用途 |
|---|---|---|---|
| `--text-strong` | `n900` | 15.1:1 | 视图大标题、统计大数字 |
| `--text` | `n800` / `n700` | 11.3:1 / 8.2:1 | 日记正文、卡片标题 |
| `--text-muted` | `n600` | 5.5:1 | 说明文字、时间戳、表头、placeholder |

**唯一允许低于 4.5:1 的文字是禁用态**（`n400`，2.7:1）—— 禁用本来就是"读不出来"的语义。

**强调色每屏只有一个**（`baseline-ui`）。`--accent` 取 `ice700`（`hsl(209 50% 35%)`），它在白底上是 7.1:1、白字压在它上面也是 7.1:1 —— **同一个值同时能当文字色和按钮底色**，所以整站不需要第二个"按钮专用蓝"。原来的 `#5789ae` 配白字只有 3.76:1，是不合格的。

`ice500`（`#5E8FB3`，也就是 README 徽章上的品牌色）**只做标识与图形**，不做文字色 —— 它在白底上只有 3.39:1，够大够粗的图形可以，够不上文字标准。

**非文字对比度也要 3:1**（WCAG 1.4.11）。可交互控件的边框必须用 `--border-strong`（`n300`）或更深，**纯装饰性的分隔细线才允许用 `--border`（`n200`）** —— 这是两个不同的令牌，不要合并（`refactoring-ui`）。

**危险色是一对语义令牌，不是第二个强调色**：`--danger`（亮色 `hsl(6 52% 42%)` / 暗色 `hsl(6 62% 68%)`）与 `--danger-soft`（亮色 `hsl(6 60% 95%)` / 暗色 `hsl(6 30% 20%)`）。**只用于破坏性操作**：`#trashEmpty` 的描边与文字、清空/删除确认框的主按钮。
改动中修掉的一个具体错误：`.btn-ghost:hover` 曾写成 `border-color: var(--danger, var(--accent))`，由于 `--danger` 已定义，`var()` 的兜底永远不生效 —— **所有** ghost 按钮悬停都变红。现在悬停一律走 `--accent` 系。

**强调底上的文字色必须走 `--accent-ink`，不要写 `#fff`。** 亮色 `--accent` 是深冰蓝，白字 7.1:1 没问题；但暗色 `--accent` 是浅冰蓝 `hsl(205 55% 62%)`，白字只有约 2:1 —— 这是原样式表里最严重的一处暗色崩坏。暗色下 `--accent-ink` 是 `hsl(214 30% 12%)`（深色）。

## Themes

亮暗两套**语义同构**：同名令牌在两套里都指向"同一个角色"，不是把颜色反过来。

- **亮色**：面是近白冷色（`n25` / `n50`），文字是深冷蓝（`n700`–`n900`）。
- **暗色**：面是深冷蓝（`hsl(214 26% 13%)`），文字是浅冷白（`hsl(208 32% 96%)`），**强调色要变浅**（`ice600`）—— 暗底上 `ice700` 会糊成一团。

规则：

1. **暗色不是把亮色取反。** 暗色的面之间仍有明度层级（`surface` → `surface-raised`），层级方向与亮色一致（越靠前越亮）。
2. **每一处硬编码颜色都要有暗色对应。** 改动前有 206 处硬编码 hex 和 63 条手写暗色覆盖并存 —— 那是双轨制，改一处漏一处。新规则：**组件只引用语义令牌，不出现 hex**。
3. **暗色 body 背景必须由令牌生成。** 改动前 `body[data-theme="dark"]` 的渐变是硬编码的 `#0a1622 → #0c1a29 → #091521`，三个色停没有一个等于任何令牌。
4. **降透明度偏好要真的生效**：`@media (prefers-reduced-transparency: reduce)` 下把玻璃面换成实色并去掉模糊。

## Typography

**两套字体，各管一半** —— 这是本站排版上最重要的决定：

- `--font-serif`（思源宋体 Variable）：**只给用户写下的内容** —— 日记正文、日记标题、阅读器、导出图。
- `--font-ui`（思源黑体 Variable）：**所有操作界面** —— 导航、按钮、标签、表头、统计、说明文字。

理由：宋体是为印刷和大字号设计的。改动前全站最密的字号恰好是 11–13px（12px 出现 22 次、13px 15 次），全是界面元素，而 `--sans` 的字体队列**以思源宋体打头** —— 也就是说全站没有一个字是真正的无衬线，11px 的宋体横画是断的。分成两套之后，宋体留给"你写的东西"，黑体留给"你操作的东西"，语义上反而更对。

**字号阶梯 10 档**（从 30 个不同值收敛而来）。中文界面小字**下限是 12px** —— 11px 的汉字笔画会粘连。

**行高**：界面 1.4–1.6；写作区与阅读器 **1.8**（`--prose-line-height`）。
这个值要解释一下：Apple 的 Body 行高比是 22/17 ≈ 1.29，那是拉丁文的舒适值；中文的参考区间是 1.6–1.75。改动前是 **2.1**，已经在区间上方。收窄栏宽到 660px 之后，1.8 是"安静但不散"的位置。

**栏宽**：正文 `max-width: 660px`。900px ÷ 16px = **56 字/行**，远超中文的舒适区（30–40 字）。这是"淡雅"应该真正出力的地方 —— **空气放在文字两侧，不放在行与行之间**。

**字距**：中文一律 `letter-spacing: normal`（0）。字距只对**英文 kicker、全大写标签、数字**使用，取值收进两个令牌（`--track-wide: .18em`、`--track-xwide: .3em`）。
改动前有 **11 个** letter-spacing 值（.3/.4/.5/.6/1/1.5/2/2.5/3/4/5px）被当层级手段滥用，h2 用 5px、kicker 也用 5px、正文还要 .6px。**汉字是等宽的、本没有字母间隙，负字距或大正字距都会让字挤在一起或散开** —— Apple 的 tracking 值是为拉丁字母的光学尺寸算的，不能照搬。

**字重只用三档**：400（正文/多数界面）、500（界面强调）、600（标题与数字）。不靠字重表达层级 —— 中文半粗在宋体下会发糊。层级靠**字号差 + 字距（仅限英文）+ 颜色**。

## Layout

**8pt 网格**：`4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128`。
以 Apple 的 8pt 体系为骨架（`4 / 8 / 16 / 24 / 32 / 48`），保留 **12** 作为唯一半档 —— 中文界面的元素密度比拉丁文高，纯 8pt 会把工具栏挤在一起；48 之后延伸 `64 / 96 / 128` 给大版面留白。

**容器宽度只保留三套**：
- `.view` `max-width: 1320px` —— 视图外壳
- `--w-prose: 660px` —— 正文、标题、工具栏、阅读器、导出图（**全部统一到这一个值**）
- `--w-aside: 344px` —— 右栏

改动前有 5 套并存（1680 / 900 / 840 / 920 / 1000），其中 900 还被硬编码进 `.diary-bar` 的 `padding: max(28px, calc((100% - 900px)/2))`。

**三栏骨架**：侧栏 `240px` + 主区自适应（`main` 内边距 `40px clamp(24px,3.4vw,56px) 72px`）+ 右栏 `344px`。断点只保留三个：`1200px`、`960px`（右栏落到写作卡下方）、`640px`。

**点击区最小 44×44px**（Apple HIG，非可选，无豁免）。小于这个尺寸的图标按钮必须用 padding 或伪元素把命中区撑到 44×44，**视觉尺寸可以仍然是 32px**。

## Elevation & Depth

**层级只有两种表达方式：材质与阴影。数量很少。**

材质（`backdrop-filter` + 半透明）**只属于导航层**：
- 允许：侧栏、吸底工具栏、模态、Toast、悬浮面板（白噪音、专注出口）
- **禁止：任何内容卡片、列表、表格、单元格。主内容区一律实色背景。**

这是 Apple HIG 的原文规则（"no glass lists, cards, table cells, or media containers"），也是本站不可读问题的根因 —— 卡片本身就是白玻璃，底下还垫了一层白 scrim。

**玻璃只有一份参数**（`--glass` / `--glass-blur`）：
```css
background: rgba(252,253,255,.84);                    /* 暗色 rgba(20,32,46,.82) */
backdrop-filter: blur(24px) saturate(180%);
border: 1px solid var(--border);
```
改动前有三套互不相同的值并存（令牌 `blur(26px) saturate(165%)`、侧栏 `blur(14px) saturate(1.05)`、面板 `blur(12px) saturate(1.05)`）—— `saturate 165%` 和 `105%` 不是同一种材质，这是"看着不精致"的直接来源。
侧栏的不透明度取到 `.84`（而不是更低）是**实测决定**：`.84` 下侧栏次要文字对最坏情况壁纸仍有 4.9:1，`.72` 时掉到 3.9:1，不过关。
诚实交代：**Apple 从未公开材质的模糊半径 px 值**，上面的 `24px / 180%` 是网页映射，不是 HIG 数值。

**阴影五级按 z 轴位置选，不按好看选**（`refactoring-ui`）：`e1` 卡片 / `e2` 抬起 / `e3` 弹出层 / `e4` 模态。静止的内容卡片只用 `e1`，**不要用大阴影假装层级**。

**z-index 令牌化**（`baseline-ui`：必须有固定标尺，不许任意 z-index）。改动前有 10 档手写值，副作用是 Toast（99）**压在**"退出专注"和白噪音面板（120）**之下**。新标尺见 frontmatter。

**落雪层必须在壁纸之上。** 改动前 `#snowfield` 与 `.wallpaper` 同为 `z-index:0` 且 `position:fixed`，canvas 在 DOM 里排在前面 —— **壁纸直接盖住了雪花**，白天的雪基本看不见，而 README 把落雪写成卖点。落雪层取 `--z-snow: 1`。

### 壁纸参数组：壁纸退、卡片实

背景层**不是"能不能加遮罩"的问题**——改动前已经有遮罩了。真正的问题是**处处求白**：`.scrim` 把壁纸中央洗成 88% 白，卡片本身又是 `rgba(251,252,254,.91)` 的近乎不透明的白，**两层白互相加分**，壁纸和内容一起被冲掉。

判断反过来：**卡片坐到实色上（`--surface` 不透明，`backdrop-filter: none`），遮罩只负责让壁纸"退到内容后面"，不负责把它洗掉。** 四个参数收成一组令牌，一起调、不许单点改：

| 令牌 | 亮色 | 暗色 | 作用 |
|---|---|---|---|
| `--wallpaper-opacity` | `.72` | `.70` | 壁纸自身不透明度 |
| `--scrim-top` | `hsl(206 42% 97% / .62)` | `hsl(212 40% 6% / .66)` | 顶部（标题区）遮罩 |
| `--scrim-mid` | `hsl(205 40% 96% / .10)` | `…/ .30` | 中部 —— **最小，让壁纸透出来** |
| `--scrim-bottom` | `hsl(206 42% 97% / .14)` | `…/ .48` | 底部 |

暗色壁纸另给 `filter: brightness(.72) saturate(.88) blur(.6px)`。
scrim 渐变的中间停靠点是 `34%`：更早（`26%`）时过渡太快，手机窄屏上能看出横向色带。

**壁纸的图片文件、视图↔壁纸映射（今日按日期奇偶轮换 `day`/`cg`，翻阅 `town`、统计 `night`、垃圾桶 `trash`）都不在设计系统里，不得改动。**

## Shapes

**圆角阶梯 6 档**：`6 / 10 / 14 / 20 / 28 / 999px`（从改动前的 20 个值收敛）。

**同心圆角**：嵌套元素的圆角必须满足 `内圆角 = 外圆角 − 内边距`。做不到就在视觉上对齐失败 —— 角落会出现"月牙"般的厚薄不均。改动前的"重型覆盖"段落把 8 处 `border-radius:16px` 全部改写成同一个 22px，嵌套关系被抹平。

**诚实交代**：Apple 的连续圆角（squircle）是超椭圆 `|x/R|^n + |y/R|^n = 1`（n≈5），CSS 的 `border-radius` 只能画圆弧，**画不出来**。真要做需要 SVG 每角 8 段三次贝塞尔。本站不做 —— 只在半径小于 4–6px 时，两者差异是亚像素级的，用 `border-radius` 完全等价。**所以我们的圆角是"圆角"，不是 Apple 的连续圆角，不要在文档或宣传里混称。**

**一处圆角语言**：不混用直角和圆角（`refactoring-ui`）。

## Components

### 侧栏（导航层 · 唯一大面积玻璃）
- `240px` 固定宽，`position: sticky`，`--z-sidebar`，玻璃材质（`--glass` + `--glass-blur`）
- 分组：品牌 / 日期 / 主导航 / 工具 / 署名
- 导航项：44px 高，选中态用 `--accent-soft` 底 + `--accent` 图标与文字，不用阴影
- 小字（署名、说明）不得低于 12px
- 手机（≤960px）：侧栏变成一个 grid 顶栏，区域顺序 `brand quick mail` / `date` / `nav` / `foot`；日期独占整行（品牌列若被日期挤窄，标题会折成两行）

### 内容卡片（实色层）
```css
background: var(--surface);
border: 1px solid var(--border);
border-radius: var(--r-lg);
box-shadow: var(--e0);            /* 或 e1 */
```
正文永不坐在半透明上。

### 按钮
按高度分档：`28 / 32 / 44 / 52px`。主按钮底 `--accent` + 白字（7.1:1），次按钮 `--surface` + `--border-strong` 描边。
按下反馈发生在 **pointer-down**：`transform: scale(.97)`，`transition: transform 100ms ease-out`。**反馈要全程持续，不是松手才发生**（Apple）。

### 输入控件
`font-size: 16px`（iOS 在小于 16px 时会在聚焦时缩放页面）。每个输入框都要有真正的 `<label>`（可用视觉隐藏），placeholder 不是标签。
**绝不阻止粘贴**（`baseline-ui`）。

### 图标
站内 SVG 分两类，尺寸来源不同，**不要混淆**：

- **写死在标记里的**（侧栏、导航、工具条、按钮）自带 `width` / `height` 属性，CSS 只负责 `flex-shrink: 0` 和颜色。
- **JS 生成的**（天气胶囊里的图标）标记里没有尺寸属性，**必须在 CSS 里给死宽高**：`.tag svg{width:14px;height:14px}`。

第二类漏掉尺寸不会报错，但会静默走样：浏览器拿到只有 `viewBox` 的 `<svg>` 后按路径包围盒自行推算，`晴 / 阴 / 雨 / 雪` 算成 18px、`多云` 算成 31px —— 图标撑破胶囊，文字被挤到边框外面。**凡是 `innerHTML` 拼出来的 `<svg>`，都要在样式表里补一条尺寸规则。**

### 空态
必须给一个**明确的下一步**（`baseline-ui`），不是一句"暂无数据"。本站的落法是 `.state-empty`（`<strong>` 说结论 + `<p>` 说下一步），三个视图各自有针对性文案：

| 位置 | strong | p |
|---|---|---|
| 翻阅·还没写 | 还没有任何日记 | 回到「今日执笔」，写下第一篇。 |
| 翻阅·搜索无果 | 没有找到符合条件的日记 | 换个关键词，或清空筛选。 |
| 阅读器 | 雪地上还没有脚印 | 从左侧日历选择一个日子，重读那天的故事。 |
| 垃圾桶 | 垃圾桶是空的 | 删掉的日记会先留在这里，确认不再需要，再彻底清除。 |

阅读器为空时**必须让容器收高**（`.reader:has(.reader-empty){min-height:auto}`）—— 否则会留下一整块空白纸面。

### 输入反馈（打字）
**每一次击键都要有反馈**（用户明确要求"打字要有爽感"），但反馈必须是**低成本的、只动合成层**的：

- `.ice-ripple`：26px 径向墨点，`@keyframes inkBloom 170ms var(--ease-out)`，从光标处绽开后立刻收住。**每次击键一个**，不做节流；靠**并发上限 6 个**（超出则移除最旧的）控制节点数。
- `.ice-flake`：冰晶，`floatUp 1.05s`，**只在保存/封存这类仪式时刻**由 `burstFX(el,5)` 错峰 45ms 打出 5 枚。同一批 WA2 元素，从"持续装饰"改成"事件反馈"。
- 两者都是 `position:absolute` 挂在 `.diary-card` 上，颜色取令牌（`--ink-bloom` / `--flake-1` / `--flake-2`），**不写 hex**；`z-index: 5`。
- 卡片本体在输入时加 `.typing`（描边转 `--ice200`，`::after` 内描边亮起），460ms 后摘掉。
- 光标坐标由隐藏的 `.type-mirror` 量出，需要它保持 `position:absolute` + `visibility:hidden` + `z-index:-1`。

改动前：冰晶只有 30% 概率出现、涟漪节流 160ms（快打时大半击键没有反馈）、颜色硬编码 `#8fb4d1`/`#a6c4dd`（CSS 无法覆盖，暗色模式下不变）。

### Toast
玻璃层，`--z-toast: 400`（必须在所有浮动面板之上）。文案用陈述句，不加感叹号。

### 模态
`--z-modal`，圆角 `--r-xl`，`box-shadow: var(--e4)`，`transform-origin: center`（**模态是唯一豁免"从触发器长出来"的元素**）。
破坏性操作用确认框，且主按钮用危险色（`baseline-ui`）。

### 图片放大（lightbox）
`--z-lightbox`，遮罩不透明度靠媒体本身承载。关闭按钮是**真 `<button>`**（44×44、`aria-label="关闭"`），打开时焦点移入、`Escape` 关闭并把焦点还给触发元素 —— 站内另外五处 Esc 处理（搜索、专注、标注器、更多工具）用的是同一套模式，lightbox 原先漏了，属于补齐一致性而非新增交互。
**唯一允许写死颜色的地方**：关闭按钮的 `hsl(0 0% 100% / .12)` 底 + `hsl(0 0% 100% / .9)` 字。它叠在任意照片上，跟随主题令牌会在浅色照片上消失。

## Do's and Don'ts

本项目有四个外部治理源，下面每条 Don't 都注明出处 —— **没有明文禁止的，不写成 Don't。**

### 必须做
- 内容卡片用实色背景，玻璃只给导航层。（Apple HIG：材质只用于导航/控件层）
- 每一处文字都过 4.5:1（正文）或 3:1（大字与非文字）。最高密度的小字至少 5.5:1。
- 交互反馈在 100–160ms、ease-out，且在 pointer-down 发生。
- 所有动效尊重 `prefers-reduced-motion`：**减少而不是清零** —— 保留透明度与颜色变化，去掉位移与过冲。
- 图层用 z-index 令牌，不写字面量。
- 图标按钮必须有 `aria-label`。
- 中文正文宽度控制在 660px 左右（约 42 字/行）。

### 必须不做
- **不要把浅色半透明叠在浅色半透明上。**（Apple HIG；本站不可读的直接原因）
- **不要把玻璃用在列表、卡片、表格、内容区上。**（Apple HIG）
- **不要为装饰目的使用渐变。**（`baseline-ui`：无明确要求不得用渐变 —— 本站的壁纸遮罩与落雪属于已获授权的例外）
- **不要动布局属性做动画。**只动 `transform` 与 `opacity`。（`baseline-ui`）
- **不要用 `scale(0)`。** 用 `scale(.95–.97)` + `opacity: 0`。（`review-animations`）
- **不要让 UI 动画超过 300ms。**（`review-animations`）
- **不要在 100+/天 的交互上挂动画**（快捷键、核心导航）。（`review-animations`）
- **不要自造缓动曲线，也不要混用两套 `--ease-out`。**（`baseline-ui`；改动前项目值与技能值同名不同值）
- **不要给大 blur / backdrop-filter 面做动画。**（`baseline-ui`）
- **不要让 `will-change` 常驻。**（`baseline-ui`）
- **不要用字距表达中文层级。** 汉字等宽，tracking 是为拉丁字母设计的。
- **不要用 `letter-spacing` 之外再叠 `font-weight` 来表达标题层级** —— 中文半粗会糊。
- **不要用颜色作为唯一的信息载体。**（Apple HIG / `refactoring-ui`）
- **不要一屏出现两个强调色。**（`baseline-ui`）
- **不要在触屏宽度下写未门控的 `:hover`。** 必须包在 `@media (hover: hover) and (pointer: fine)`。（`mobile-native`）
- **不要 `user-scalable=no` / `maximum-scale=1`。**（`mobile-native`）
- **不要把 `user-select: none` 给 `body`**，只给控件。（`mobile-native`）
- **不要阻止输入框粘贴。**（`baseline-ui`）
- **不要用 glow 当主要的交互提示。**（`baseline-ui`）
- **不要手搓键盘与焦点行为。**（`baseline-ui`）
- **不要在成功操作后弹 alert。**（Apple HIG）
- **不要硬编码颜色。** 组件只引用语义令牌。

### 明确豁免（本项目的视觉语言需要，属于已授权例外）
- **渐变**：`.scrim` 与标题区遮罩使用渐变，因为它们是**调节背景亮度的工具**，不是装饰。授权来自用户对 Q19 的选择。
- **长时长的背景过渡**：壁纸交叉淡入 1500ms，独立命名为 `--dur-wallpaper`，**不计入"UI ≤300ms"的预算**。它变换的是背景，不是界面元素。
- **落雪**：连续循环动画，属于氛围而非 UI。必须尊重 `prefers-reduced-motion`（降为静态帧），并支持关闭。
