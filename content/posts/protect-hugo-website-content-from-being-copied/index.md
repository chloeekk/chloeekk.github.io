---
title: "Protect Hugo Website Content from Being Copied"
description: "Learn to prevent content theft with copyright notices, legal deterrence, and Hugo technical protections (disable copy/paste, auto-watermarking) while maintaining SEO compatibility."
date: 2025-04-19T10:11:53+08:00
draft: false

categories:
- Hugo

tags:
- Hugo
---

First, it must be clearly understood: There is no technical method that can 100% prevent content from being copied (methods like screenshots, manual rewriting, or crawlers can bypass protections). However, the following methods can significantly increase the difficulty of copying and reduce the risk of bulk theft.

## Basic Protections (No Coding Required)
### Add Copyright Notices
Include clear copyright information at the beginning/end of each article, for example:
> This article is licensed under [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/). Unauthorized reposting, copying, or modification is prohibited.

- The CC BY-NC-ND 4.0 license is theoretically applicable to content in any language (including Chinese and English), but note:
    - **International Validity**: CC licenses are globally standardized agreements recognized by law in 100+ countries/regions, but enforcement depends on local laws (e.g., definitions of "non-commercial use" may vary).
    - **Language Neutrality**: The license's validity is independent of content language, but provide an English version of the notice if your audience includes international users.

- Core Restrictions:
    - **BY (Attribution)**: Others must credit the original author.
    - **NC (Non-Commercial)**: Prohibits commercial use (e.g., selling articles or using them for ad revenue).
    - **ND (No Derivatives)**: Prohibits modifications (translations or adaptations require separate authorization).

### Legal Deterrence
Add a copyright notice and contact information at the bottom of your website. For critical content, consider DMCA protection (requires registration).

#### How to Add Copyright Notices
Manually add notices to the **end of each article's Markdown file** (compatible with Hugo's default rendering):
  ```markdown
  ---
  title: "Your Article Title"
  date: 2025-04-19
  ---

  Here is the article content...

  > © 2025 Your Name. Unauthorized reproduction prohibited.
  ```

- **Advantages**:  
  - No code/template modifications needed; suitable for non-technical users  
  - Customizable notices per article  

- **Disadvantages**:  
  - Manual addition is time-consuming  
  - No centralized management for site-wide notices  

#### Adding DMCA Protection
After registering at [DMCA.com](https://www.dmca.com/), obtain the **image link** for the "Protection Badge" and:  
  1. Place the DMCA badge image (e.g., `dmca-badge.png`) in Hugo's `/static/images/` directory  
  2. Insert the image and link in articles or pages:  
     ```markdown
     [![DMCA Protection](images/dmca-badge.png)](https://www.dmca.com/Protection/Status.aspx?ID=xxx)
     ```
  
The badge will appear on articles or your "About" page, linking to DMCA's verification page.

## Technical Protections (Modify Hugo Templates)
### Disable Right-Click and Text Selection
Add the following code to Hugo's template file (e.g., `layouts/_default/baseof.html`). Place the text selection prevention code within the `<head>` tag:
```html
<style>
  /* Disable text selection */
  body {
        -webkit-user-select: none;  /* Chrome/Safari */
        -moz-user-select: none;     /* Firefox */
        -ms-user-select: none;      /* IE/Edge */
        user-select: none;
      }
</style>

<script>
  // Disable right-click menu
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
  });

  // Disable Ctrl+C / Cmd+C shortcuts
  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.keyCode === 67) {
      e.preventDefault();
    }
  });
</script>
```
**Important**:  
Do not modify theme directory files directly (`themes/theme-name/layouts/`), as they will be overwritten during theme updates.  
Hugo prioritizes templates in the root `layouts/` directory. If `baseof.html` doesn't exist there, copy it from the theme directory first.

#### Does Disabling Text Selection Affect SEO?
No direct impact. Search engine crawlers (e.g., Google Bot) primarily parse HTML source code rather than being restricted by CSS styles.  
The `user-select: none` property only prevents mouse-based text selection by users. Text remains visible in the HTML source, fully accessible to crawlers. Search engines ignore most CSS styles (except techniques like `display: none` or `visibility: hidden`), so `user-select: none` won’t affect crawling or indexing.

### Prevent Image Dragging
Add to CSS:
```html
img {
  pointer-events: none; /* Disable dragging */
  -webkit-touch-callout: none; /* Disable long-press menu (mobile) */
}
```

### Automatic Watermarking for Images
#### 1. Verify Directory Structure and Markdown Syntax
Assume the following structure:
```
content/
└── posts/
    ├── post-1/
    │   ├── index.md      # Article file
    │   └── image.png    # Image file
    └── post-2/
        ├── index.md
        └── photo.jpg
```

Image reference syntax in `index.md`:
```
![Image description](image.png)
```

#### 2. Enable Hugo Page Resources
Hugo treats files in article directories as Page Resources by default. Verify `config.toml`:
```toml
[module]
  [[module.mounts]]
    source = "content"
    target = "content"
```

#### 3. Create Render Hook for Automatic Watermarking
Use a render hook to process all Markdown images dynamically.  
- Create render hook file at:
```
layouts/
└── _default/
    └── _markup/
        └── render-image.html
```
- Add this code to `render-image.html`:
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

- Place watermark image (e.g., `watermark.png`) in:
```
assets/
└── images/
    └── watermark.png
```

#### 4. Verify Implementation
- Local preview:  
  Run `hugo server` and check if watermarks appear on article images.  
- Output directory:  
  Processed images will be generated in `public/` with paths like:  
  `public/posts/post-1/image_hu1234_watermarked.png`