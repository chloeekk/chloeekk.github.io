# Create A Static Website with Hugo and Host it with Github Pages


## 1. Install Hugo

- Windows：

First install choco package manager, run cmd under **administrator privileges** and execute the following command:

```markup
powershell -NoProfile -ExecutionPolicy unrestricted -Command "iex ((new-object net.webclient).DownloadString('https://chocolatey.org/install.ps1'))"

# Set environment variables
SET PATH=%PATH%;%ALLUSERSPROFILE%\chocolatey\bin
```

Then use choco to install hugo:

`choco install hugo -confirm`

- MacOs：

Use the brew command to install:

`brew install hugo`

- Linux：

Install using the snap command:

`snap install hugo`

To check for successful installation:

Type: `hugo version`, if the version message appears, the installation is successful

## 2. Create a new site

Create a new site by executing the following command:

`hugo new site myblog`

This command will create a folder named myblog, which is the root directory of the blog. The site directory structure is as follows:

```
├── archetypes
│   └── default.md
├── config.toml         # Blog site configuration file
├── content             # Directory of blog posts
├── data
├── layouts             # Website layout
├── static              # Static content
└── themes              # Blog Themes
```

- **archetypes**

Content template files with pre-configured preferences (date, title, draft, etc.) New prototypes can be created with custom pre-configured front-end fields.

- **config.toml**

Hugo uses `config.toml`, `config.yaml` or `config.json` as the default site configuration file.

- **content**

Store all content files.

- **data**

Store the configuration file.

- **layouts**

Store the template as a `.html` file.

- **static**

Store all static content, such as images, CSS, JavaScript, etc.

- **themes**

hugo theme you are using.

## 3. Download the theme

Hugo can't be started without the theme.

After creating a new site, you can choose your favorite theme in the [official store](https://themes.gohugo.io/), click download theme will jump to the theme corresponding github.

First, adjust the terminal path to the themes directory in the myblog folder, and then add the theme via the git clone command (here is the PaperMod theme as an example):

```
cd themes
git clone https://github.com/adityatelange/hugo-PaperMod.git
```

Add the theme to the profile:

`$ echo theme = "PaperMod" >> config.toml`

## 4. Start the blog

Type: `hugo server -D` in the terminal, the service will be occupying port 1313 by default.

After successful execution, a public directory will be generated and the contents of this directory will be all the contents of the static website we have created.

Then you can open `http://localhost:1313` in your browser to see your website.

## 5. Creating an article

Create a new article with the following command:

`hugo new posts/helloworld.md`

Then a file named "helloworld.md" will be created in the content directory.

All articles are placed in the content folder by default. If you have other custom category directories, you need to generate the articles in the specified directory.

Each article will contain the following opening:

```
---
title: "Hello World"
date: 2022-10-19T21:02:01+08:00
draft: true
---
```

draft that is "draft", default value is true, means this content will be ignored when compiled; change to false, this blog will be compiled and used.

## 6. Deploy to Github page

①Add a blank repository in Github named `Github username.github.io`, without any content such as `readme.md` files, etc. This gives you the URL of the repository in Github.

②In the public directory, execute the following commands in sequence:

### Initialize the warehouse
git init

### Add all content to git
git add .

### Commit to git local
git commit -m "first commit"

### Linking to remote git
Note that you need to write your own git address here

git remote add origin https://github.com/Github username/Github username.github.io.git

### Push to remote git
git push origin master`

③The blog content is now hosted on Github and can be accessed at the following address:

`https://Github username.github.io`

If the blog is updated, you will need to use the `hugo` command to generate new content and then push the new content to the Git repository.

