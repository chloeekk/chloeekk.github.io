---
title: "如何使用Hugo搭建博客并部署到Github"
date: 2022-10-20T07:57:53+08:00
draft: false

categories:
- Hugo

tags:
- Hugo
---


## 1. 安装Hugo

- Windows:

首先安装choco包管理器，在**管理员权限**下运行cmd，执行以下命令：

```
markup
powershell -NoProfile -ExecutionPolicy unrestricted -Command "iex ((new-object net.webclient).DownloadString('https://chocolatey.org/install.ps1'))"

# 设置环境变量
SET PATH=%PATH%;%ALLUSERSPROFILE%\chocolatey\bin
```

然后使用choco安装hugo：

`choco install hugo -confirm`

- MacOs:

使用brew命令安装：

`brew install hugo`

- Linux:

使用snap命令安装：

`snap install hugo`

检查安装是否成功：

输入：`hugo version`，如果出现版本信息，则安装成功。

## 2. Hugo 创建新站点

在 Hugo 所在的文件夹中，右键点击鼠标，选择“Bash here”，输入以下命令创建新站点：

`hugo new site myblog`

该命令会创建一个名为 myblog 的文件夹，该文件夹是博客的根目录。站点目录结构如下：

```bash
── archetypes
│ └── default.md
── config.toml # 博客站点配置文件
── content # 博客文章所在目录
── data
── layouts # 网站布局
── static # 静态内容
── themes # 博客主题
```

- **archetypes**

具有预配置首选项（日期、标题、草稿等）的内容模板文件。可以使用自定义预配置的前端字段创建新的原型。

- **config.toml**

Hugo 使用 `config.toml`、`config.yaml` 或 `config.json` 作为默认网站配置文件。

- **content**

存储所有内容文件。

- **data**

存储配置文件。

- **layouts**

将模板存储为 `.html` 文件。

- **static**

存储所有静态内容，如图片、CSS、JavaScript 等。

- **themes**

你使用的 hugo 主题。

## 3. 下载主题

没有主题，Hugo 就无法启动。

创建新站点后，你可以在 [官方商店](https://themes.gohugo.io/) 中选择自己喜欢的主题。点击下载主题会跳转到主题对应的 GitHub。

首先将终端路径调整到myblog文件夹的themes目录下，然后通过git clone命令添加主题（这里以PaperMod主题为例）：

```
cd themes

#初始化git项目，博客将使用git project方式管理
git init

#下载主题
git clone https://github.com/adityatelange/hugo-PaperMod.git

#返回myblog文件夹，也就是你网站的根目录
cd ..

#将主题添加到配置文件
$ echo theme = "PaperMod" >> config.toml
```

或者你也可以直接将PaperMod下的config.toml文件复制到myblog文件夹下，替换原有的config.toml文件。

### 解决“Error RPC failed; curl 18 transfer closed without outstanding read data remaining”

下载主题时可能会遇到此问题。主要可能有三个原因：

1. 缓存不够大，需要增加缓存，配置：

```bash
git config --global http.postBuffer 524288000
```

将缓存从500M设置成5G

2. 原项目提交记录过多，配置：

```bash
git clone -b master https://git.xxxxx --depth 1
```

`-b master`表示只拉取主分支的内容，可以将master改为其他分支名称；`--depth 1`表示只拉取最近一次提交的内容。

3.网络问题

## 4.创建文章

使用以下命令创建新文章：

`hugo new posts/helloworld.md`

然后在content目录下会生成一个名为“helloworld.md”的文件。

所有文章默认放在content文件夹下。如果你有其他自定义的分类目录，则需要将文章生成到指定目录中。

每篇文章都会以以下内容开头：

```
---
title: “Hello World”
date: 2022-10-19T21:02:01+08:00
draft: true
---
```

draft 表示“草稿”，默认值为 true，表示编译时会忽略此内容；如果改为 false，则博客会被编译使用。

## 5. 开始写博客

在终端输入：`hugo server -D`，服务默认会占用 1313 端口。

执行成功后会生成一个公共目录，这个目录下的内容就是我们创建的静态网站的所有内容。

然后在浏览器中打开 `http://localhost:1313` 就可以看到你的网站了。

## 6. 部署到GitHub页面

**[GitHub Pages](https://pages.github.com/)**是静态网页（Static Web Page）的集合，这些静态网页由**[GitHub](https://github.com/ )**托管发布，所以叫GitHub+Pages。

1. 在Github中添加一个空白仓库，仓库名称为`Github用户名.github.io`，不包含任何内容，例如`readme.md`文件等。从这里获取Github中仓库的URL
2. 在公共目录下，依次执行以下命令：

```bash
#初始化仓库
git init

#把所有东西都添加到git中
git add .

#本地提交到git
git commit -m "first commit"

#关联到远程git，注意这里需要写上自己的git地址。
git remote add origin https://github.com/Githubusername/Githubusername.github.io.git

#推送到远程git
git push -u origin master
```

此时博客内容托管在Github上，你可以通过以下地址访问博客：

`https://Githubusername.github.io`

如果后续博客内容有更新，需要使用`hugo`命令生成新内容，然后将新内容推送到Git仓库。

###“fatal: 'origin' does not seem to be a git repository...”的解决方法

使用Git推送代码时，出现“fatal: 'origin' does not seem to be a git repository...”的错误提示，

原因是远程仓库名称origin不存在，可以使用下面的操作方法查看远程仓库名称及路径相关信息。可以删除错误的远程仓库名称，重新添加新的远程仓库：

`git remote -v`：查看远程仓库详情，可以看到仓库名称

`git remote remove origin`：删除origin仓库（如果把origin拼成了origin，则删除错误名称的仓库）

`git remote add origin仓库地址`：重新添加远程仓库地址

`gti push -u origin master`：提交到远程仓库的master trunk

## 理解Hugo的文件夹构成
主题下载到本地后，你会看到很多个文件夹，它们可以区分为Hugo的基础文件夹（即项目创建时或用户手动添加的文件夹）以及Hugo生成静态网站后自动生成的文件夹：

### 基础文件夹
这些文件夹在创建Hugo项目或安装主题时就已经存在，它们是你用来组织网站内容、配置、样式等的主要目录。

- **archetypes**: 定义文章模板，帮助快速创建新内容。
- **content**: 网站的文章和页面内容存放目录，如博客文章、页面等。
- **data**: 用于存放结构化数据文件，可以供模板调用。
- **layouts**: 定义页面布局和模板逻辑，控制网站的呈现方式。
- **static**: 用于存放静态资源，如图片、CSS、JavaScript 等。这些文件会被直接复制到生成的网站中。
- **config.toml**: 网站的配置文件，控制网站的基本设置。
themes: 用于存放网站的主题文件。LoveIt 主题就是在这个文件夹内。

此外，LoveIt主题还有一些特定的文件夹：
- **en / zh-cn**: 用于多语言支持，分开存放不同语言的内容。
- **js**: 存放自定义的 JavaScript 文件。
- **lib**: 存放前端库或插件（如 jQuery、FontAwesome 等）。
- **page**: 存放特定的页面文件，如“关于我”、“联系”等页面。
- **posts**: 存放博客文章。
- **svg**: 存放 SVG 格式的矢量图标或图像。
- **tags**: 生成特定标签页面，帮助通过标签组织内容。

### 运行Hugo后自动生成的文件夹
这些文件夹是 Hugo 在生成静态网站时创建的，它们存储的是 Hugo 处理后的输出内容或中间文件。你不需要手动创建或修改这些文件夹。

- **public**: Hugo 执行 hugo 命令后生成的网站文件会被存放在此。它包含最终的 HTML、CSS、JS、图片等资源，准备部署到服务器上。
- **resources**: 存放 Hugo Pipes 处理后的资源文件，如压缩后的 CSS、优化后的图片等。这些文件用于提升性能。

## Hugo运行时涉及的文件夹举例
### 使用Hugo创建站点
创建 Hugo 站点是项目初始化的过程，Hugo会生成一些基础文件夹和文件，用于管理网站的内容、样式和功能。

操作命令：
`hugo new site mysite`


运行过程及涉及的文件夹：
- **archetypes**: Hugo 会生成一个 archetypes/default.md 文件，这是创建新文章时的模板，定义文章的默认格式和元数据（如 title、date、tags 等）。
- **content**: 这个文件夹最开始是空的，它是用于存放网站文章和页面的目录。你可以创建子文件夹（如 posts）来组织不同类型的内容。
- **data**: 空的，供你存放结构化数据（如 JSON、YAML、TOML）以供模板使用。
- **layouts**: 空的，用于存放自定义页面布局模板文件。你可以在这里创建自己的页面布局，或修改主题提供的模板。
- **static**: 空的，存放静态文件（如图片、CSS、JS 等），这些文件会被直接复制到生成的站点中。
- **config.toml**: 生成一个默认的配置文件，包含基础网站配置选项（如网站名称、语言、主题等）。

此外，如果你安装了主题（如 LoveIt），Hugo 会将主题文件放到 themes 文件夹中，包含主题的样式、布局、静态资源等。
创建站点后，你可以通过修改 config.toml 文件来设置站点的基本信息，比如 baseURL、languageCode、title，以及选择使用的主题。

### 使用Hugo创建新文章
创建新的文章（post）是基于现有站点结构，使用定义好的内容模板来生成具体的文章文件。

操作命令：
`hugo new posts/my-first-post.md`

运行过程及涉及的文件夹：
- **archetypes**: 创建新文章时，Hugo 会从 archetypes/default.md 中读取文章模板，自动生成文章的头部元数据（Front Matter），如 title、date、draft 等。这确保每篇文章有一致的基础结构。

- **content/posts**: 新文章会被创建在 content/posts/ 文件夹下。posts 文件夹存放的是所有的博客文章，my-first-post.md 就是刚刚创建的新文章文件。你可以通过编辑这个文件来撰写文章的内容。

文章文件通常是 markdown 格式，包含文章标题、发布时间、标签、分类等 Front Matter 信息和正文内容。
- **static**: 如果文章中引用了图片或其他静态资源，这些资源需要放在 static 文件夹中，Hugo 会将它们复制到最终生成的站点中。

- **config.toml**: 一些全局配置（如网站的语言、默认的主题、菜单等）可能会影响新文章的显示效果。
