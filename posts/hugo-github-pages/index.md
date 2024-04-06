# How to use Hugo to Build a Blog and Deploy it to Github Page




## 1. Install Hugo

- Windows:

First install the choco package manager, run cmd under **administrator rights**, and execute the following command:

```markup
powershell -NoProfile -ExecutionPolicy unrestricted -Command "iex ((new-object net.webclient).DownloadString('https://chocolatey.org/install.ps1'))"

# Set environment variables
SET PATH=%PATH%;%ALLUSERSPROFILE%\chocolatey\bin
```

Then use choco to install hugo:

`choco install hugo -confirm`

- MacOs:

Install using brew command:

`brew install hugo`

- Linux:

Install using snap command:

`snap install hugo`

Check whether the installation is successful:

Enter: `hugo version`. If the version information appears, the installation is successful.

## 2. Hugo creates a new site

In the folder where Hugo is located, right-click the mouse, select "Bash here", and enter the following command to create a new site:

`hugo new site myblog`

This command will create a folder named myblog, which is the root directory of the blog. The site directory structure is as follows:

```
├── archetypes
│ └── default.md
├── config.toml # Blog site configuration file
├── content # Directory where blog posts are located
├── data
├── layouts # Website layout
├── static # Static content
└── themes # Blog theme
```

- **archetypes**

Content template file with preconfigured preferences (date, title, draft, etc.). New prototypes can be created with custom pre-configured front-end fields.

- **config.toml**

Hugo uses `config.toml`, `config.yaml` or `config.json` as the default website configuration file.

- **content**

Store all content files.

- **data**

Store configuration files.

- **layouts**

Store templates as `.html` files.

- **static**

Stores all static content such as images, CSS, JavaScript, etc.

- **themes**

The hugo theme you use.

## 3. Download theme

Hugo cannot be started without a theme.

After creating a new site, you can choose your favorite theme in the [Official Store](https://themes.gohugo.io/). Clicking to download the theme will jump to the GitHub corresponding to the theme.

First adjust the terminal path to the themes directory of the myblog folder, and then add the theme through the git clone command (here, take the PaperMod theme as an example):

```bash
cd themes

#Initialize the git project, the blog will be managed using git project method
git init 

#Download theme
git clone https://github.com/adityatelange/hugo-PaperMod.git 

#Return to the myblog folder, which is the root directory of your website
cd .. 

#Add theme to configuration file
$ echo theme = "PaperMod" >> config.toml 
```

Or you can directly copy the config.toml file under PaperMod to the myblog folder and replace the original config.toml file.

### Solve "Error RPC failed; curl 18 transfer closed without outstanding read data remaining"

You may encounter this problem when downloading a theme. There are three main possible reasons:

1. The cache is not large enough. You need to increase the cache. Configuration:

```bash
git config --global http.postBuffer 524288000
```

Set cache from 500M to 5G

2. The original project has too many submission records, configuration:

```bash
git clone -b master https://git.xxxxx --depth 1
```

`-b master` indicates that only the content of the main branch will be pulled. You can change master to the name of another branch; `--depth 1` indicates that only the content of the most recent submission will be pulled.

3. Network problems

## 4. Create article

Create a new article with the following command:

`hugo new posts/helloworld.md`

Then a file named "helloworld.md" will be generated in the content directory.

All articles are placed in the content folder by default. If you have other custom category directories, you need to generate articles into the specified directory.

Each article will begin with the following:

```
---
title: "Hello World"
date: 2022-10-19T21:02:01+08:00
draft: true
---
```

draft means "draft". The default value is true, which means that this content will be ignored when compiling; if it is changed to false, the blog will be compiled and used.

## 5. Start a blog

Enter: `hugo server -D` in the terminal. The service will occupy port 1313 by default.

After successful execution, a public directory will be generated, and the content in this directory is all the content of the static website we created.

Then open `http://localhost:1313` in the browser to see your website.

## 6. Deploy to GitHub page

**[GitHub Pages](https://pages.github.com/)** is a collection of static web pages (Static Web Page). These static web pages are composed of **[GitHub](https://github.com/ )** Hosting and publishing, so GitHub + Pages.

1. Add a blank repository in Github. The repository name is `Github username.github.io` and does not contain any content, such as `readme.md` file, etc. Get the URL of the repository in Github from this
2. In the public directory, execute the following commands in sequence:

```bash
#Initialize warehouse
git init

#Add everything to git
git add .

#Submit to git locally
git commit -m "first commit"

#Associate to remote git. Note that you need to write your own git address here.
git remote add origin https://github.com/Githubusername/Githubusername.github.io.git

#Push to remote git
git push -u origin master
```

At this point, the blog content is hosted on Github. You can access the blog through the following address:

`https://Githubusername.github.io`


If the blog content is updated in the future, you need to use the `hugo` command to generate new content, and then push the new content to the Git repository.

### Solution to "fatal: 'origin' does not appear to be a git repository..." 

When using Git to push code, the error message "fatal: 'origin' does not appear to be a git repository..." appears.

The reason is that the remote warehouse name origin does not exist. You can use the following operation method to view the remote warehouse name and path related information. You can delete the wrong remote warehouse name and re-add a new remote warehouse:

`git remote -v`: View the remote warehouse details and you can see the warehouse name

`git remote remove origin`: Delete the origin warehouse (if you spell origin as origin, delete the wrong name warehouse)

`git remote add origin warehouse address`: re-add the remote warehouse address

`gti push -u origin master`: Submit to the master trunk of the remote warehouse
