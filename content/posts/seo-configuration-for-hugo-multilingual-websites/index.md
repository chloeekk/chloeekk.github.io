---
title: "SEO Configuration for Hugo Multilingual Websites"
description: "Fix Hugo multilingual SEO: Set up hreflang tags, optimize language settings & resolve indexing conflicts to ensure proper page crawling."
date: 2025-04-29T07:16:35+08:00
draft: false

categories:
- Hugo
- Digital Marketing

tags:
- Hugo
- Digital Marketing
---



## Potential Reasons Why Hugo Multilingual Sites Are Not Properly Indexed by Search Engines
I recently noticed an issue with newly published articles: **Google only indexes one language version of the same article (either Chinese or English)**. There are occasional cases where both versions get indexed, but this is rare. I began investigating potential configuration issues, which may include:

### Multilingual Configuration Issues
- Ensure proper multilingual configuration in `config.toml` or `config.yaml`, e.g.:
```toml
       [languages.en]
       weight = 1
       languageName = "English"
       contentDir = "content/en"

       [languages.zh]
       weight = 2
       languageName = "中文"
       contentDir = "content/zh"
```
- Confirm each article's `index.md` front matter contains language identifiers like `language: en` or `language: zh`.

### Missing `hreflang` Tags
Search engines require `hreflang` tags to recognize different language versions. Incorrect implementation may lead to single-language indexing.
- Right-click to view page source in browser and search for `hreflang` tags, verifying mutual links between Chinese/English versions.

### Sitemap Generation Issues
- Visit `yoursite.com/sitemap.xml` to confirm inclusion of all Chinese/English page URLs.
- Ensure `config.toml` doesn't disable sitemap generation via `disableKinds`.

### Duplicate Content Issues (SEO Conflicts)
If Chinese/English pages share identical URL paths (e.g., `/posts/article1`), search engines may treat them as duplicate content.

### Crawler Frequency Limitations
New websites or infrequently updated sites may not have all pages crawled yet.

### GitHub Pages Deployment Issues
As my site is built with Hugo and GitHub Pages, deployment verification is essential:
- Confirm `public` folder correctly generates static files for both languages (e.g., `/en/` and `/zh/` directories).
- Check GitHub Pages build logs for errors.

## Troubleshooting Results
### Multilingual Configuration Issues
While multilingual settings are defined in `config.toml`, article `index.md` files lack language identifiers in front matter.
![toml-multilingual-settings](toml-multilingual-settings.png)

However, since I use Hugo's filename suffix approach for multilingual content (e.g., `index.zh-cn.md` for Chinese and `index.md` as default language), Hugo automatically matches languages through file extensions. Example:
- `index.md` → Default language (e.g., `en`)
- `index.zh-cn.md` → Chinese (requires `zh-cn` language configuration in `config.toml`)
Thus, no need to add `language` field in front matter.

### Missing `hreflang` Tags
No `hreflang` tags exist in page source code, requiring additional configuration.

### Other Potential Issues
- Sitemap generation: Separate en/zh-cn sitemaps contain all URLs without disabled generation
- URL path differences and deployment: Correct language paths in `public/` directory (e.g., `public/en/article1/` and `public/zh-cn/article1/`) confirm Hugo's proper language handling

## Adding hreflang Tags in Hugo

### What is hreflang?
`hreflang` is an HTML attribute specifying different language/regional versions of a webpage. Declared via `<link>` tags in page headers, it helps search engines like Google identify multilingual/regional variants of content. Example:
```html
<link rel="alternate" hreflang="en" href="https://example.com/en/page/" />
<link rel="alternate" hreflang="zh-CN" href="https://example.com/zh/page/" />
```

### Do Hugo + GitHub Pages Sites Need hreflang?

#### When hreflang is Required
1. **Multilingual Content**: Multiple language versions (e.g., English/Chinese)
2. **Regional Targeting**: Content tailored for specific regions (e.g., `en-US` vs `en-GB`)
3. **SEO Optimization Needs**: Prevent search engines from treating multilingual content as duplicates and improve target audience rankings.

#### When hreflang is Unnecessary
Single-language websites without multilingual/regional variations.

### How to Add hreflang Tags in Hugo?

#### Step 1: Configure Hugo Multilingual Support
Define supported languages in `config.toml`:
```toml
[languages]
  [languages.en]
    languageName = "English"
    weight = 1
    contentDir = "content/en"
  [languages.zh]
    languageName = "中文"
    weight = 2
    contentDir = "content/zh"
```

#### Step 2: Add hreflang Tags in Templates
Insert this code in global header templates (e.g., `layouts/partials/head.html`):
```html
<head>
  {{ range .Translations }}
  <link rel="alternate" hreflang="{{ .Language.Lang }}" href="{{ .Permalink }}" />
  {{ end }}
  <link rel="alternate" hreflang="{{ .Language.Lang }}" href="{{ .Permalink }}" />
</head>
```
This generates corresponding `hreflang` tags for all translated versions.

#### Step 3: Verify Implementation
- Use [Google Search Console](https://search.google.com/) "International Targeting" report to check errors.
- Validate tag presence and accuracy using tools like [Screaming Frog](https://www.screamingfrog.co.uk/).
