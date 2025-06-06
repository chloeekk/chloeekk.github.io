---
title: "如何防止Hugo搭建的网站内容被盗"
description: "如何通过版权声明、法律威慑与Hugo技术防护（禁用复制/拖拽/自动水印）防止内容被恶意复制，兼顾SEO友好性与内容安全。"
date: 2025-04-19T10:11:53+08:00
draft: false

categories:
- Hugo

tags:
- Hugo
---

首先需要明确的是：没有任何技术手段能 100% 防止内容被复制（截图、手动重写、爬虫等方式均可绕过防护）。不过，可以通过以下方法显著增加复制难度，降低被批量盗取的可能性。

## 一、基础防护（无需代码）
### 添加版权声明
在每篇文章开头/结尾明确标注版权信息，例如：
> 本文采用 [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/) 协议授权，禁止未经授权的转载、复制或修改。

- CC BY-NC-ND 4.0 协议理论上适用于任何语言的内容（包括中英文），但需注意：
    - 国际效力：CC 协议是全球通用的标准化协议，已在 100+ 国家/地区被法律认可，但需根据当地法律具体执行（例如某些国家可能对“非商业用途”定义不同）。
    - 语言无关性：协议效力与内容语言无关，但建议在声明中同时提供英文版本，尤其是您的读者包含国际用户时。

- 核心权利限制：
    - BY（署名）：他人必须标明原作者。
    - NC（非商业）：禁止将内容用于商业目的（例如售卖你的文章、植入广告盈利）。
    - ND（禁止演绎）：禁止修改原内容（例如翻译、二次创作需单独授权）。


### 法律威慑

在网站底部添加版权声明和联系方式。如果内容非常重要，可考虑添加 DMCA 保护（需注册服务）。

#### 添加版权声明的方法
直接在每篇文章的 **Markdown 文件末尾** 手动添加版权声明（适用于 Hugo 默认内容渲染方式）：  
  ```markdown
  ---
  title: "你的文章标题"
  date: 2025-04-19
  ---

  这里是文章正文...

  > © 2025 你的名字。未经许可禁止转载。
  ```

- **优点**：  
  - 无需修改模板代码，适合技术小白  
  - 可针对不同文章设置不同声明  

- **缺点**：  
  - 需手动为每篇文章添加，效率低  
  - 无法统一修改全站声明  

#### 添加 DMCA 保护的方法
注册 [DMCA.com](https://www.dmca.com/) 后，获取「保护徽章」的 **图片链接**，然后：  
  1. 在 Hugo 的 `/static/images/` 目录下存放 DMCA 徽章图片（如 `dmca-badge.png`）  
  2. 在任意文章或页面中插入图片和链接：  
     ```markdown
     [![DMCA保护](images/dmca-badge.png)](https://www.dmca.com/Protection/Status.aspx?ID=xxx)
     ```
  
添加成功后，在文章或「关于」页面显示徽章，点击跳转到 DMCA 验证页。


## 二、技术防护（修改 Hugo 模板）
### 禁用右键菜单和文本选择
在 Hugo 的模板文件（如 layouts/_default/baseof.html）中添加以下代码。其中，“禁止文本选择”的代码加在 <head> 标签内
```html
<style>
  /* 禁止文本选择 */
  body {
        -webkit-user-select: none;  /* Chrome/Safari */
        -moz-user-select: none;     /* Firefox */
        -ms-user-select: none;      /* IE/Edge */
        user-select: none;
      }
</style>

<script>
  // 禁用右键菜单
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
  });

  // 禁用 Ctrl+C / Cmd+C 快捷键
  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.keyCode === 67) {
      e.preventDefault();
    }
  });
</script>
```
**注意：**
不要直接修改主题目录，因为主题目录（themes/主题名/layouts/）下的模板文件会在主题更新时被覆盖。
Hugo 的模板优先级规则是：项目根目录的 layouts/ 会覆盖主题的同名模板。如果根目录下没有baseof.html文件，需要先从themes文件夹下复制过来。

#### 禁用文本选择是否会影响SEO效果？
不会直接影响 SEO，因为搜索引擎爬虫（如 Google Bot）主要抓取 HTML 源码中的内容，而不是直接受 CSS 样式限制。
<code>user-select: none</code>只是阻止用户通过鼠标选择文本，但文本仍然在 HTML 中正常渲染，对爬虫完全可见。搜索引擎爬虫会忽略大多数 CSS 样式（除非涉及隐藏内容的操作，如 <code>display: none</code> 或 <code>visibility: hidden</code>），因此 <code>user-select: none</code> 不会影响内容的抓取和索引。

### 防止图片拖拽
在 CSS 中添加：
```html
img {
  pointer-events: none; /* 禁止拖拽 */
  -webkit-touch-callout: none; /* 禁用长按菜单（移动端） */
}
```

### 网站图片自动添加水印
#### 1. 确认目录结构和 Markdown 语法
假设你的文章和图片结构如下：
```
content/
└── posts/
    ├── post-1/
    │   ├── index.md      # 文章文件
    │   └── image.png    # 图片文件
    └── post-2/
        ├── index.md
        └── photo.jpg
```

在 index.md 中引用图片的语法为：
```
![图片描述](image.png)
```

#### 2. 启用 Hugo 的 Page Resources 功能
Hugo 默认将文章目录下的文件视为 Page Resources，需确保配置正确。
确认 config.toml 中的资源挂载：
如果未配置，添加以下内容（通常默认已启用）：
```toml
[module]
  [[module.mounts]]
    source = "content"
    target = "content"
```

#### 3. 创建渲染钩子自动处理图片
通过渲染钩子捕获所有 Markdown 图片，并动态添加水印。
- 在项目根目录下创建渲染钩子文件：
```
layouts/
└── _default/
    └── _markup/
        └── render-image.html
```
- 编写渲染钩子逻辑
将以下代码写入 render-image.html：
```html
{{- $original := .Page.Resources.GetMatch (printf "%s" (.Destination | safeURL)) -}}
{{- $watermark := resources.Get "images/watermark.png" -}}

{{- if and $original $watermark -}}
  {{- $watermarkResized := $watermark.Resize (printf "%dx" (int (mul $original.Width 0.3))) -}}

  {{- $processed := $original.Filter (images.Overlay $watermarkResized (sub $original.Width $watermarkResized.Width) (sub $original.Height $watermarkResized.Height)) -}}

  <img src="{{ $processed.RelPermalink | safeURL }}" 
       alt="{{ .Text }}" 
       width="{{ $original.Width }}" 
       height="{{ mul $original.Height 0.4 | int }}" 
       {{ with .Title }}style="width: 100%; max-width: {{ . }};"{{ end }} />

{{- else -}}
  <img src="{{ .Destination | safeURL }}" 
       alt="{{ .Text }}" 
       {{ with $original }}width="{{ .Width }}"{{ end }}
       {{ with $original }}height="{{ mul .Height 0.4 | int }}"{{ end }}
       {{ with .Title }}style="width: 100%; max-width: {{ . }};"{{ end }}/>
{{- end -}}
```

- 准备水印图片
将水印图片（如 watermark.png）存放在 assets/images/ 目录下：
```
assets/
└── images/
    └── watermark.png
```

#### 4. 验证效果
运行<code>hugo server</code>，打开文章页面，检查图片是否自动添加水印。