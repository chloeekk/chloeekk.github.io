---
title: "Hugo主题优化"
date: 2025-07-01T08:01:10+08:00
draft: true

---

## 超过一个canonical标签
用Bing自带的检测工具检查了一下网站，报告提示存在“More than one canonical tag”的问题：

![more-than-one-canonical-tag](more-than-one-canonical-tag.png)

“More than one canonical tag” 的意思是：我网站的某个页面中包含了多个` <link rel="canonical"> `标签，而一个页面应该只包含一个 canonical 标签来明确指示搜索引擎哪一个 URL 是该内容的首选版本。

于是我随机挑选了一个页面，检查源代码，发现确实同时存在两个重复的`canonical`标签，虽然指向的是同一个 URL，但从 SEO 规范上讲，它依然是一个问题：
![two-canonical-tags](two-canonical-tags.png)

这种情况常见于以下几种情形：

- 页面模板（如 HTML 模板、React 组件、Next.js 的 `<Head>`）

- 静态页面构建器（如 Hugo、Gatsby、Jekyll）自动插入了一次

- 又手动加了一次（例如你自己加了一行 `<link rel="canonical">`）

我的网站是用Hugo和GitHub Pages搭建的，而Hugo会自动生成 canonical 标签。默认情况下，Hugo 会在我启用了 `<head>` 的模板中自动插入一条 canonical 标签，例如：
```gohtml
{{- if .Permalink -}}
<link rel="canonical" href="{{ .Permalink | safeURL }}">
{{- end -}}
```

但是，如果我又在模板中手动添加了一条，或者用了某些主题，主题里也写了一条，那么就会出现我在前面所说的：
页面中有两个 `<link rel="canonical">` 标签，尽管 href 相同。

但是我怎么知道重复的 canonical 标签在哪个文件呢？我选择在VS Code里直接进行全文搜索：

![vs-code-full-text-search](vs-code-full-text-search.png)

重复的标签存在于以下三个文件里：

- `layouts/_default/baseof.html` → 我自己项目的模板

- `themes/Lovelt/layouts/_default/baseof.html` → 主题自带的模板

- `themes/Lovelt/layouts/partials/head/link.html` → 主题中分离的 head 片段

很明显，我需要删除其中一个`baseof.html`中和 canonical标签相关的代码。此处，我们需要考虑 Hugo 模板的优先级：在 Hugo 中，如果你在项目目录下有和主题中同名的模板文件，项目目录的那个会被使用（优先级更高）。
但是需要注意，这只适用于单个文件的“整体替换”，不会影响 partial 文件是否仍被你的模板显式引用！
举例来说，如果你自己项目的 `layouts/_default/baseof.html` 中显式调用了：
```gohtml
{{ partial "head/link.html" . }}
```
那么即使主题自带 `baseof.html` 被“覆盖”了，你仍然通过 partial 引用了主题中的 `link.html`，它依然会执行，仍然会插入一条 canonical 标签。

考虑到我之前已经在自己项目的模板里添加了自定义代码，所以我选择删除`layouts/_default/baseof.html`中关于`link.html`的引用代码：

![delete-link-html](delete-link-html.png)

推送代码到线上环境后，可以看到源代码里已经没有重复的 canonical 标签了：
![duplicate-canonical-tags-result](duplicate-canonical-tags-result.png)

## Duplicate without user-selected canonical
在我解决完前面提到的“重复canonical标签”的问题之后，Google Search Console提示我有页面索引的新问题：Duplicate without user-selected canonical

这个问题是：某些页面（比如 `/tags/obsidian/`）被 Google 判断为重复内容，而我却 **没有明确声明哪个是 canonical（主页面）**。

看起来，这个问题的出现和我前面修改代码的操作是有联系的：

* 我删掉了某些页面上的 `<link rel="canonical">`，导致这些页面现在没有 canonical 标签
* Hugo 的 `taxonomy` 页面（如 `/tags/obsidian/`）默认不会自动生成 `<link rel="canonical">`，除非我手动加上

所以导致：

* 文章页没问题（主题模板控制页面生成）
* 分类页 / 标签页 / RSS 页，没有 canonical 标签
* Google 无法判断这些聚合页的主版本
最终出现了 “Duplicate without user-selected canonical”

对于下面这些非文章页面，即 Hugo 默认生成的页面，**不会自动加 canonical标签**，需要我手动在模板里处理

* `/tags/[tag-name]/` ← taxonomy page
* `/categories/[category-name]/`
* `/tags/[tag-name]/index.xml` ← RSS Feed
* `/categories/[name]/index.xml`

