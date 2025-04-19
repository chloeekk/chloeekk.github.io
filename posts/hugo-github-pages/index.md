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

## Understand Hugo's folder structure
After the theme is downloaded locally, you will see many folders, which can be divided into Hugo's basic folders (i.e., folders added when the project is created or manually by the user) and folders automatically generated after Hugo generates a static website:

### Basic folders
These folders already exist when you create a Hugo project or install a theme. They are the main directories you use to organize website content, configuration, styles, etc.

- **archetypes**: Define article templates to help quickly create new content.
- **content**: The website's article and page content storage directory, such as blog posts, pages, etc.
- **data**: Used to store structured data files that can be called by templates.
- **layouts**: Define page layout and template logic to control the presentation of the website.
- **static**: Used to store static resources, such as images, CSS, JavaScript, etc. These files will be copied directly to the generated website.
- **config.toml**: The website's configuration file controls the basic settings of the website.
themes: Used to store the website's theme files. The LoveIt theme is in this folder.

In addition, the LoveIt theme has some specific folders:
- **en / zh-cn**: for multi-language support, separate content for different languages.
- **js**: for custom JavaScript files.
- **lib**: for front-end libraries or plug-ins (such as jQuery, FontAwesome, etc.).
- **page**: for specific page files, such as "About Me", "Contact", etc.
- **posts**: for blog posts.
- **svg**: for vector icons or images in SVG format.
- **tags**: for generating specific tag pages to help organize content by tags.

### Folders automatically generated after running Hugo
These folders are created by Hugo when generating static websites. They store the output content or intermediate files processed by Hugo. You do not need to create or modify these folders manually.

- **public**: The website files generated by Hugo after executing the hugo command will be stored here. It contains the final HTML, CSS, JS, images and other resources, ready to be deployed to the server.
- **resources**: Stores resource files processed by Hugo Pipes, such as compressed CSS, optimized images, etc. These files are used to improve performance.

## Examples of folders involved in Hugo runtime
### Create a site with Hugo
Creating a Hugo site is the process of project initialization. Hugo will generate some basic folders and files to manage the content, style and functions of the website.

Operation command:
`hugo new site mysite`

Running process and folders involved:
- **archetypes**: Hugo will generate an archetypes/default.md file, which is a template for creating a new article, defining the default format and metadata of the article (such as title, date, tags, etc.).
- **content**: This folder is empty at first. It is a directory for storing website articles and pages. You can create subfolders (such as posts) to organize different types of content.
- **data**: Empty, for you to store structured data (such as JSON, YAML, TOML) for template use.
- **layouts**: Empty, used to store custom page layout template files. You can create your own page layouts here, or modify the templates provided by the theme.
- **static**: Empty, store static files (such as images, CSS, JS, etc.), which will be copied directly to the generated site.
- **config.toml**: Generate a default configuration file containing basic website configuration options (such as website name, language, theme, etc.).

In addition, if you install a theme (such as LoveIt), Hugo will put the theme file in the themes folder, including the theme's style, layout, static resources, etc.
After creating a site, you can modify the config.toml file to set the basic information of the site, such as baseURL, languageCode, title, and choose the theme to use.

### Create a new article using Hugo
Creating a new article (post) is based on the existing site structure, using the defined content template to generate specific article files.

Operation command: `hugo new posts/my-first-post.md`

Running process and folders involved:
- **archetypes**: When creating a new article, Hugo will read the article template from archetypes/default.md and automatically generate the article's header metadata (Front Matter), such as title, date, draft, etc. This ensures that each article has a consistent infrastructure structure.

- **content/posts**: The new article will be created in the content/posts/ folder. The posts folder stores all blog posts, and my-first-post.md is the new article file just created. You can edit this file to write the content of the article.

Article files are usually in markdown format, containing Front Matter information such as article title, release time, tags, categories, and body content.
- **static**: If images or other static resources are referenced in the article, these resources need to be placed in the static folder, and Hugo will copy them to the final generated site.

- **config.toml**: Some global configurations (such as the website language, default theme, menu, etc.) may affect the display of new articles.

After the website is built, if you need to monitor traffic, it is recommended to [integrate Google Analytics](https://chloevolution.com/posts/integrate-google-analytics-with-hugo-website/).
