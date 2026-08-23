---
title: "A Practical Guide to Efficiently Managing Images in Obsidian"
description: "From inserting images to resizing them, from managing file paths to centering layouts, this article comprehensively covers the methods of using images in Obsidian, helping you build a clearer and more professional note-taking system with both text and images."
date: 2025-07-05T13:31:21+08:00
draft: false

categories:
- Obsidian


---


When taking notes in Obsidian, using images is almost inevitable. Copying and pasting images directly is indeed convenient, but over time you'll find that the images are chaotically placed, resizing them is troublesome, and centering an image is even more difficult. Another pitfall is that when you delete an image from a note, the file doesn’t actually disappear but remains hidden in the root directory.

If you have not created a vault or configured the **Files & Links** options yet, complete the [Obsidian installation and basic setup guide](https://chloevolution.com/posts/how-to-install-obsidian/) before planning your attachment folders.

## What Exactly Are Images in Obsidian?

When it comes to images, many people’s first thought is that "inserting an image means adding an image directly." However, in Obsidian, images are more like references to "external files." In other words, the images aren’t directly embedded in the note content but are stored in folders on your computer and then displayed in the notes through links or references.

This explains why deleting an image from a note doesn’t remove the image file from the folder—**the note only references it, while the image file itself remains independent**. Understanding this is key to better managing your image resources, such as consolidating them into a dedicated folder to avoid clutter and facilitate future backups and organization.

## How to Insert Images in Obsidian

Inserting images in Obsidian isn’t complicated. Below are several common methods along with their pros and cons:

### 1. Copying and Pasting Images

This is the quickest and easiest method. You can copy an image directly from your computer (such as a screenshot or an image from a webpage) and paste it into Obsidian’s editor. Obsidian will automatically save the image to the default attachments folder (usually `.obsidian/assets` or another folder you’ve specified) and generate a reference code for the image in the note.

If you regularly add screenshots, meeting photos, or daily records to a journal, combine these attachment settings with an [Obsidian Daily Notes workflow](https://chloevolution.com/posts/obsidian-daily-notes/) so each day's images do not accumulate in the vault root.

**Pasted Image Naming Rules**:

By default, Obsidian uses the format `Pasted image` + `timestamp` to name pasted images, for example:
- `Pasted image 20250705133021.png`
- `Pasted image 20250705133156.png`

The timestamp format is year-month-day-hour-minute-second (YYYYMMDDHHmmss), ensuring each pasted image has a unique filename to avoid naming conflicts.

**Pasted Image Storage Location**:

The storage location for pasted images depends on your settings:
1. If you’ve set a "Default location for new attachments" (e.g., `assets`), images will be saved to that folder
2. If no setting is configured, images will be saved to the vault’s root directory
3. If you’ve selected "In subfolder under current folder," an attachments folder will be created in the note’s directory

> **Pros**: Simple operation, no need to worry about file paths.

> **Cons**: If you’re not careful, images may end up scattered in multiple locations, and the attachments folder can become messy over time, making management difficult.

As shown in the image below, I copied and pasted an image into the editor. Obsidian automatically saved the image in the root directory, separate from other existing folders. The image is named based on the date and is displayed in PNG format. At the same time, the note’s body automatically generated a reference code for the image:

![paste-image-in-obsidian](paste-image-in-obsidian.png)

### 2. Manually Inserting Images Using Markdown Syntax

If you already have image files saved somewhere on your computer, it’s better to use Markdown syntax to insert them. The format is:

```markdown
![[image-filename.png]]
```

Here, `[[ ]]` is Obsidian’s unique linking syntax, representing a reference to a file in the vault. If your image is in a subfolder of the vault, such as an `assets` folder, the path would be written as:

```markdown
![[assets/image-filename.png]]
```

Alternatively, you can use standard Markdown syntax:

```markdown
![](assets/image-filename.png)
```

> **Pros**: You have full control over where the images are stored, avoiding a cluttered attachments folder.

> **Cons**: You need to ensure the image path is correct before inserting, or the image won’t display.

### 3. Dragging and Dropping Images into the Editor

You can drag an image file from your computer directly into Obsidian’s editing window. The system will automatically copy the image to the default attachments folder and generate the corresponding reference code. This is essentially similar to the first method of "copying and pasting images directly."

> **Pros**: Intuitive and convenient, more stable than copying and pasting.

> **Cons**: Still requires attention to attachments folder management.

### 4. Inserting Web Image Links

Obsidian also supports inserting web images using standard Markdown syntax:

```markdown
![](https://example.com/image-link.jpg)
```

This method doesn’t save the image locally but loads it directly from the web.

> **Pros**: Doesn’t take up local storage, suitable for temporary references.

> **Cons**: Requires an internet connection; images may not display if the network is unstable.

As shown below, I right-clicked on a webpage to copy the image link and then used Markdown syntax to write it into the note body:
![copy-image-address](copy-image-address.png)

Since this method doesn’t involve local image storage, no corresponding image appears in the directory panel on the left:
![insert-web-image-obsidian](insert-web-image-obsidian.png)

### 5. Download Web Images as Local Attachments

Web images do not take up space in your vault, but they always depend on the original website. If you go offline, the source image is deleted, or the website changes its URL, the image in your note may stop displaying.

This is especially common when using [Obsidian Web Clipper](https://chloevolution.com/posts/obsidian-web-clipper/). By default, Web Clipper does not download images from a page. It keeps their original URLs in the Markdown note. Everything may look normal immediately after clipping, but the images are not actually stored in your vault and may disappear when you open the note offline.

To preserve them, use Obsidian’s built-in `Download attachments for current file` command. It downloads web images referenced by the current note and replaces the external URLs with links to local attachments in your vault.

To run the command:

1. Open the note containing web images.
2. Press `Ctrl/Cmd + P` to open the Command palette.
3. Search for `Download attachments for current file`.
4. Run the command and confirm the images to download when prompted.
5. Wait for the downloads to finish, then check that the images still display in the note.

Downloaded images are saved to the default attachment location configured in Obsidian. If you have not set an attachment folder yet, read the next section first and choose a dedicated folder such as `assets` so that the files do not accumulate in the vault root.

Afterward, switch to Source mode to inspect the image reference. An external URL such as:

```markdown
![](https://example.com/image.jpg)
```

is normally replaced with an internal attachment link such as:

```markdown
![[image.jpg]]
```

The command only processes the currently open note; it does not download web images from an entire folder at once. If you have many older notes to process, start with one test note, confirm that the attachment location and links are correct, and then run it on the remaining notes one by one.

Some websites use temporary URLs, authentication, or hotlink protection, so individual downloads may still fail. After running the command, do not only check whether files appeared in the attachment folder. Open the note and make sure none of the images has become a broken internal link.


## How to Specify a Folder for Image Storage?

### 1. Create a Dedicated Image Folder

Open your Obsidian vault folder.

Create a new folder in the root directory, such as `assets` (you can also name it `images`, `media`, or any other preferred name).

Place all the images you want to insert into this folder.

As shown below, I created an `Assets` folder in the root directory to store images. You can also see that previously pasted images were saved directly in the root directory by default:
![create-folder-for-images](create-folder-for-images.png)

### 2. Change the Default Storage Location for Images

By default, Obsidian saves copied-pasted or dragged-and-dropped images to the default attachments folder. If you haven’t changed the settings, this is usually the root directory or a folder under `.obsidian`.

If you want all images to be stored in your newly created `assets` folder, **it’s recommended to modify the default attachments folder path**. This way, copied-pasted or dragged-and-dropped images will automatically be saved to your specified folder, making management easier.

1. Open Obsidian and click the gear icon in the lower-left corner to access Settings.
2. Navigate to the **Files & Links** option.
3. In the "Default location for new attachments" field, enter the name of your new folder, such as `assets`.
4. After saving the settings, all copied-pasted or dragged-and-dropped images will be saved to the `assets` folder.

**About the Different Attachment Folder Options**:

In the "Default location for new attachments" setting, you’ll see the following options:

- **Vault folder**: Images are saved in the vault’s root directory, mixed with note files (not recommended)
- **In subfolder under current folder**: Creates a subfolder (e.g., an `attachments` folder) in the same directory as the note to store images
- **In the folder specified below**: You can enter a fixed folder name (e.g., `assets`), and all images will be saved to this folder (most recommended)

**Customizing Pasted Image Naming Templates** (requires plugins):

While Obsidian’s default `Pasted image 20250705133021.png` naming format avoids conflicts, it’s not very intuitive. If you want to customize the naming rules, you can use community plugins:

- **[Paste Image Rename](https://github.com/reorx/obsidian-paste-image-rename)** plugin: Displays a rename dialog immediately after pasting an image, or allows you to set automatic naming templates (e.g., using the note title as a prefix)
- **[Attachment Management](https://github.com/trganda/obsidian-attachment-management)** plugin: Provides advanced attachment management features, including automatic renaming and batch organization

Installation steps:

1. Go to Settings > Community Plugins > Browse
2. Search for the plugin name, click Install, and enable it
3. Configure the naming template in the plugin settings, for example:
   - `{notename}-{date}` generates filenames like `my-note-20250705.png`
   - `{date}-{time}` generates filenames like `20250705-133021.png`

> **Note**: If you already have images stored in the default location, they won’t be moved automatically. You’ll need to organize them manually.

![set-default-location-for-images](set-default-location-for-images.png)

## How to Hide Image Files in the Sidebar

If you frequently paste images into your notes, over time the file explorer on the left will become cluttered with image files, especially those named like `Pasted image 20250705123456.png`. Finding a Markdown file becomes a hassle, affecting your productivity.

Fortunately, Obsidian offers several ways to hide these image files from the sidebar, keeping your file list cleaner and more organized.

### 1. Using the File Explorer's Exclude Feature

Obsidian's built-in file explorer supports excluding specific folders—this is the simplest and most straightforward method:

1. Open Obsidian and click the gear icon in the lower-left corner to access Settings.
2. Navigate to the **Files & Links** option.
3. In the "Excluded files" field, enter the name of your image folder, such as `assets`.
4. After saving, the `assets` folder and its contents will no longer appear in the file explorer.

![files-and-links-excluded-files](files-and-links-excluded-files.png)

> **Pros**: Simple setup, one-time configuration, ideal for users who store all images in a single folder.

> **Cons**: The entire folder will be hidden. If you occasionally need to view or manage image files, you'll have to access them through your system file manager.

### 2. Collapsing the Attachments Folder

If you don't want to completely hide the image folder but just want to make it less prominent, you can simply collapse it in the file explorer:

1. In the left file explorer, locate the folder containing your images (e.g., `assets`).
2. Click the small triangle next to the folder name to collapse it.
3. The folder remains visible, but the image files inside won't be displayed in full.

> **Pros**: High flexibility—you can expand it anytime to view the contents.

> **Cons**: After restarting Obsidian, the folder may automatically expand again, requiring you to collapse it manually.

### 3. Using Third-Party Plugins to Filter File Types

If you want more granular control, such as hiding only specific image formats (PNG, JPG, etc.), you can use community plugins:

- **[File Explorer Note Count](https://community.obsidian.md/plugins/file-explorer-note-count)** plugin: Can count files and supports filtering by file type.
- **[Hider](https://community.obsidian.md/plugins/obsidian-hider)** plugin: Can hide specific file types or folders with customizable rules.

Installation steps:

1. Go to Settings > Community Plugins > Browse.
2. Search for the plugin name, click Install, and enable it.
3. Configure the file types or rules you want to hide in the plugin settings.

> **Pros**: Powerful functionality—filter by file extension, naming patterns, and more.

> **Cons**: Requires installing an additional plugin, adding a slight learning curve.

### 4. Hiding Image Files with CSS (For Advanced Users)

If you're familiar with CSS, you can use custom styles to hide image files directly in the interface:

1. Create a `.obsidian/snippets` folder in your vault (if it doesn't already exist).
2. Create a new `.css` file, such as `hide-images.css`, and paste the following content:

```css
/* Hide image files in the file explorer */
.nav-file-title[data-path$=".png"],
.nav-file-title[data-path$=".jpg"],
.nav-file-title[data-path$=".jpeg"],
.nav-file-title[data-path$=".gif"],
.nav-file-title[data-path$=".svg"],
.nav-file-title[data-path$=".webp"] {
  display: none;
}
```

3. Return to Obsidian, go to Settings > Appearance > CSS snippets, and enable the `hide-images.css` file.
4. All common image formats will now be hidden from the sidebar.

> **Pros**: Fully customizable—you can precisely control which file types to hide.

> **Cons**: Requires some CSS knowledge, and this only hides files visually; the files themselves remain in the vault.


**My Recommendation**: If you store all your images in a single folder (e.g., `assets`), Method 1 (excluding the folder) is the most convenient. If you occasionally need to view images, use Method 2 (collapsing the folder). For more flexible control, try Method 3 with plugins.


## Methods for Adjusting Image Sizes

After inserting an image, many people encounter the issue of images being too large or too small, making them look uncoordinated. Unfortunately, Obsidian’s default Markdown syntax offers limited control over image sizing. However, there are still a few practical tricks to help you adjust image sizes flexibly.

### 1. Using HTML Tags to Adjust Image Width

Obsidian supports embedding HTML tags in Markdown, so you can use the `<img>` tag to directly set the width, for example:

```html
<img src="assets/image-filename.png" width="300">
```

Here, `width="300"` sets the image width to 300 pixels, and the height will adjust proportionally.

> **Pros**: Straightforward and simple, allows precise control over image width.

> **Cons**: Requires writing a bit of HTML code, which may be slightly inconvenient.

### 2. Using Extended Markdown Syntax (Supported by Some Themes)

Some Obsidian themes or community plugins support syntax like the following to adjust image size:

```markdown
![[assets/image-filename.png|300]]
```

Here, `|300` sets the width to 300 pixels.

**Note**: This isn’t supported by all themes, and default Obsidian may not fully support it. Test it first before relying on it.

As shown below, adding the pixel value after the filename significantly reduces the image size:
![adjust-image-size-in-obsidian](adjust-image-size-in-obsidian.png)

### 3. Using CSS Custom Styles (For Advanced Users)

If you’re familiar with CSS, you can add custom styles to your Obsidian theme’s `obsidian.css` file to uniformly control image sizes, for example:

```css
.markdown-preview-section img {
  max-width: 80%;
  height: auto;
}
```

This ensures that images in preview mode don’t exceed 80% of the screen width, making them more suitable for different screen sizes.


## How to Center Images

### 1. Centering Using HTML Tags

The simplest and most compatible method is to nest the image in an HTML tag and specify center alignment:

```html
<p align="center">
  <img src="assets/image-filename.png" width="400">
</p>
```

Alternatively, you can write it like this:

```html
<div style="text-align: center;">
  <img src="assets/image-filename.png" width="400">
</div>
```

You can adjust the `width` value as needed.

### 2. Using CSS for Global Centering (For Frequent Users)

If you want **all images to be centered by default in preview mode**, you can use Obsidian’s CSS snippets feature:

1. Create a `.obsidian/snippets` folder in your vault (if it doesn’t already exist).
2. Create a new `.css` file, such as `center-images.css`, and paste the following content:

```css
.markdown-preview-view img {
  display: block;
  margin: 0 auto;
}
```

3. Return to Obsidian, go to Settings > Appearance > CSS snippets, and enable the `center-images.css` file.
4. All images in preview mode will now be automatically centered.

Both methods are simple and cater to different preferences. Use HTML tags for one-off centering or CSS snippets for a global, one-time solution.

## How to Display Multiple Images Side by Side

Sometimes you may need to display multiple images side by side in your notes, such as comparing products, showing photos from different angles, or creating an image grid layout. Unfortunately, Obsidian's default Markdown syntax doesn't support side-by-side images—all images are displayed vertically. However, we can achieve this effect using a few techniques.

### 1. Using HTML Tables for Side-by-Side Images

The simplest and most straightforward method is to use HTML `<table>` tags to arrange images:

```html
<table>
  <tr>
    <td><img src="assets/image1.png" width="300"></td>
    <td><img src="assets/image2.png" width="300"></td>
  </tr>
</table>
```

If you want three images side by side, simply add a third `<td>` tag:

```html
<table>
  <tr>
    <td><img src="assets/image1.png" width="250"></td>
    <td><img src="assets/image2.png" width="250"></td>
    <td><img src="assets/image3.png" width="250"></td>
  </tr>
</table>
```

You can also add captions below the images:

```html
<table>
  <tr>
    <td><img src="assets/image1.png" width="300"></td>
    <td><img src="assets/image2.png" width="300"></td>
  </tr>
  <tr>
    <td align="center">Option A</td>
    <td align="center">Option B</td>
  </tr>
</table>
```

The alignment effect is shown below:
![aligned-images-html](aligned-images-html.png)


> **Pros**: Good compatibility, suitable for precise control over image positioning and spacing.

> **Cons**: Code is somewhat verbose, requires manual adjustment of each image's width.

### 2. Using Flexbox CSS for Responsive Image Grids

If you want a more flexible layout, you can use CSS Flexbox to create responsive image grids. This approach is particularly suitable when you have multiple images:

```html
<div style="display: flex; flex-wrap: wrap; gap: 10px;">
  <img src="assets/image1.png" style="width: 300px;">
  <img src="assets/image2.png" style="width: 300px;">
  <img src="assets/image3.png" style="width: 300px;">
</div>
```

The `gap: 10px` controls the spacing between images, which you can adjust as needed. If you want images to automatically adapt to screen width, you can use percentages:

```html
<div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">
  <img src="assets/image1.png" style="width: 30%; min-width: 200px;">
  <img src="assets/image2.png" style="width: 30%; min-width: 200px;">
  <img src="assets/image3.png" style="width: 30%; min-width: 200px;">
</div>
```

This way, images will automatically wrap on different screen sizes, maintaining a good display effect.

> **Pros**: Responsive design, suitable for different screen sizes, relatively concise code.

> **Cons**: Requires some CSS knowledge.

### 3. Using CSS Grid for Image Layouts (For Advanced Users)

If you want to create more complex image grid layouts, CSS Grid is the most powerful option:

```html
<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
  <img src="assets/image1.png" style="width: 100%;">
  <img src="assets/image2.png" style="width: 100%;">
  <img src="assets/image3.png" style="width: 100%;">
  <img src="assets/image4.png" style="width: 100%;">
  <img src="assets/image5.png" style="width: 100%;">
  <img src="assets/image6.png" style="width: 100%;">
</div>
```

`grid-template-columns: repeat(3, 1fr)` creates a 3-column grid with equal width. If you want a 2-column layout, change it to `repeat(2, 1fr)`.

> **Pros**: Neat layout, suitable for creating image galleries or portfolio showcases.

> **Cons**: Requires CSS Grid knowledge.

### 4. Using Community Plugins for Image Layouts

If you don't want to write code, you can try community plugins to achieve side-by-side images and grid layouts:

- **[Image Layout](https://github.com/vertis/obsidian-image-layouts)** plugin: Specifically designed for image layouts, supports multiple preset styles.
- **[Gallery View](https://community.obsidian.md/plugins/gallery-view)** plugin: Can create image galleries with grid layouts and lightbox effects.

Installation steps:

1. Go to Settings > Community Plugins > Browse.
2. Search for the plugin name, click Install, and enable it.
3. Use the specific syntax from the plugin documentation to insert side-by-side images.

> **Pros**: No coding required, simple syntax or graphical interface to implement.

> **Cons**: Depends on third-party plugins, may have compatibility issues.


**My Recommendation**: If you only occasionally need to display 2-3 images side by side, Method 1 with HTML tables is the simplest. If you frequently need to create image grids or responsive layouts, learning Method 2's Flexbox will be very helpful. If you don't want to touch code at all, just use Method 4's plugins.

## How to Add Captions and Descriptions to Images

When writing technical documentation, academic notes, or product descriptions, you often need to add captions or descriptions to images, such as "Figure 1: System Architecture Diagram." While Obsidian's basic Markdown syntax has limited support for image captions, there are still several ways to achieve this effect.

### 1. Using Markdown Alt Text

The simplest method is to use alt text in Markdown image syntax:

```markdown
![Figure 1: System Architecture Diagram](assets/architecture.png)
```

Here, `Figure 1: System Architecture Diagram` is the alt text. However, **this alt text typically won't display in Obsidian's preview mode**. It's mainly used for:
- Displaying alternative text when the image fails to load
- Helping screen readers understand image content (accessibility)
- SEO optimization (if you publish your notes to a website)

> **Pros**: Simple syntax, follows Markdown standards.

> **Cons**: Not visible in Obsidian's preview mode, not suitable for scenarios requiring visible captions.

### 2. Adding Text Description Directly Below the Image

The most straightforward method is to write a line of description directly below the image reference:

```markdown
![](assets/architecture.png)

*Figure 1: System Architecture Diagram - Shows the interaction between frontend, backend, and database*
```

Or use centered format:

```markdown
![](assets/architecture.png)

<p align="center"><em>Figure 1: System Architecture Diagram</em></p>
```

> **Pros**: Simple and direct, no extra code needed, visible in both edit and preview modes.

> **Cons**: Text and image have no clear semantic association, limited style control.

### 3. Using HTML `<figure>` and `<figcaption>` Tags

If you want a more standardized caption format, you can use HTML5's `<figure>` and `<figcaption>` tags:

```html
<figure>
  <img src="assets/architecture.png" width="600">
  <figcaption>Figure 1: System Architecture Diagram - Shows the interaction between frontend, backend, and database</figcaption>
</figure>
```
![figcaption-example](figcaption-example.png)

You can also customize caption styles with CSS. Create a CSS file in the `.obsidian/snippets` folder:

```css
figure {
  margin: 20px auto;
  text-align: center;
}

figcaption {
  margin-top: 10px;
  font-size: 0.9em;
  color: #666;
  font-style: italic;
}
```

This will center the caption, make the font slightly smaller and gray, giving it a more professional appearance.

> **Pros**: Semantic tags, customizable styles, follows HTML5 standards.

> **Cons**: Requires writing HTML code, slightly more tedious.

### 4. Using Community Plugins for Automatic Figure Numbering

If you need to automatically number all images (Figure 1, Figure 2, Figure 3...), you can use community plugins:
- **[Image Captions](https://github.com/bicarlsen/obsidian-image-captions)** plugin: Automatically converts image alt text into visible captions.

Installation steps:

1. Go to Settings > Community Plugins > Browse
2. Search for the plugin name, click Install, and enable it
3. Use the plugin's special syntax to insert images with captions

For example, after installing the Image Captions plugin, the previously invisible alt text will automatically display below the image:

```markdown
![Figure 1: System Architecture Diagram](assets/architecture.png)
```

The plugin will automatically display `Figure 1: System Architecture Diagram` as caption text below the image.

> **Pros**: Automatic numbering, consistent styling, supports cross-referencing, ideal for long documents or academic papers.

> **Cons**: Depends on third-party plugins, requires learning plugin-specific syntax.


**My Recommendation**: If you only occasionally need to add image captions, Method 2 (writing text directly below the image) is the simplest. If you need a more standardized format, use Method 3's `<figure>` tags. If you're writing long documents that require extensive captions and automatic numbering, Method 4's plugins will greatly improve efficiency.

## What Image Formats Does Obsidian Support?

If you take photos with your iPhone and want to paste them into Obsidian, you may find that the images don't display, or certain special formats fail to load properly. Understanding which image formats Obsidian supports and how to handle incompatible formats can help you avoid these issues.

### Natively Supported Image Formats in Obsidian

Obsidian supports most common image formats:

- **PNG** (.png) - Lossless compression, supports transparent backgrounds, ideal for screenshots and icons
- **JPG/JPEG** (.jpg, .jpeg) - Lossy compression, smaller file size, ideal for photos
- **GIF** (.gif) - Supports animation, suitable for simple animated images
- **SVG** (.svg) - Vector format, infinitely scalable without quality loss, ideal for icons and diagrams
- **WebP** (.webp) - Modern image format introduced by Google, high compression rate, small file size
- **BMP** (.bmp) - Bitmap format, larger file size, rarely used

All these formats can be directly inserted into Obsidian notes without additional conversion.

### HEIC Format Issues and Solutions

**What is HEIC?**

HEIC (High Efficiency Image Container) is the default photo format used by Apple since iOS 11. It has a smaller file size than traditional JPG format but has poor compatibility.

**Why doesn't HEIC display in Obsidian?**

Obsidian doesn't natively support HEIC format because it requires specific decoders, and support is insufficient on Windows and some Linux systems.

**Solutions:**

#### Method 1: Change iPhone to Capture JPG Format

This is the simplest preventive method:

1. Open iPhone "Settings"
2. Go to "Camera" > "Formats"
3. Select "Most Compatible" (instead of "High Efficiency")

After this, photos will automatically be saved as JPG format and can be used directly in Obsidian.

> **Note**: This setting only affects newly taken photos; existing HEIC photos need to be converted separately.

#### Method 2: Use Online Conversion Tools

There are many free online tools that can convert HEIC to JPG:

- **[CloudConvert](https://cloudconvert.com/heic-to-jpg)** - Supports batch conversion, no installation required
- **[HEICtoJPG.com](https://heictojpg.com/)** - Simple and fast, local conversion protects privacy
- **[FreeConvert](https://www.freeconvert.com/heic-to-jpg)** - Comprehensive features, supports multiple formats

The process is simple: upload HEIC files, click convert, and download the JPG files.

#### Method 3: Use Desktop Conversion Software

If you frequently need to convert large numbers of HEIC images, consider installing dedicated conversion tools:

**Windows:**
- **[iMazing HEIC Converter](https://imazing.com/heic)** - Free, clean interface, supports batch conversion
- **[CopyTrans HEIC](https://www.copytrans.net/copytransheic/)** - Free, allows Windows to view HEIC files directly

**Mac:**
- Mac systems natively support HEIC format. You can open HEIC files with the "Preview" app, then go to "File" > "Export" and select JPG format

**Cross-platform:**
- **[XnConvert](https://www.xnview.com/en/xnconvert/)** - Free and open source, supports Windows/Mac/Linux, powerful features

#### Method 4: Auto-Convert When Using AirDrop or Share

iPhone can automatically convert to compatible formats when sending photos to other devices via AirDrop or the "Share" function:

1. Select photos in the iPhone Photos app
2. Tap the "Share" button
3. Select "Options"
4. Change "Automatic" to "Compatible"
5. Send to your computer and it will be in JPG format

### How to Choose the Right Image Format to Optimize Vault Size

If your Obsidian vault is getting larger and images are taking up a lot of space, consider optimizing image formats:

**1. Use PNG for screenshots and icons**
- For text screenshots, UI screenshots, and anything requiring clarity, use PNG format
- If screenshots contain large photo content, consider converting to JPG

**2. Use JPG or WebP for photos**
- For regular photos, use JPG with 80-85% compression quality, virtually indistinguishable to the naked eye
- For even smaller file sizes, convert to WebP format (25-35% smaller than JPG)

**3. Use SVG for icons and vector graphics**
- Logos, icons, flowcharts, etc., should prioritize SVG format
- SVG files are small and scale without quality loss

**4. Avoid BMP and uncompressed PNG**
- BMP format is too large and unnecessary to use
- When exporting PNG, make sure to select compression options

**Recommended compression tools:**

- **[TinyPNG](https://tinypng.com/)** - Online compression for PNG and JPG, high compression rate with almost no loss
- **[Squoosh](https://squoosh.app/)** - Made by Google, supports multiple format conversion and compression, can compare effects online
- **[ImageOptim](https://imageoptim.com/)** (Mac) - Local batch compression tool, simple operation


**My Recommendation**: If you use iPhone, the easiest approach is to change the settings to capture JPG format directly. If you already have many HEIC photos, use online conversion tools. To reduce vault size, periodically compressing images with TinyPNG or Squoosh will be very helpful.

## How to Clean Up Unused Images

Remember that pitfall mentioned at the beginning of the article? After deleting image reference code from Obsidian notes, the image file itself remains in the folder. Over time, this accumulates many "orphaned images"—images that aren't referenced by any notes but still take up storage space.

If you've been using your vault for a while, there are likely many such redundant files. Regularly cleaning up these unused images helps keep your vault tidy and reduces backup and sync burden.

### What Are Unused Images?

Unused images (also called orphaned images or orphaned attachments) are:
- Image files that exist in your vault
- But are not referenced by any note through `![[]]` or `![]()` syntax

Common causes:
1. Deleted image references from notes but forgot to delete the files
2. Renamed or moved images, leaving old files behind
3. Pasted images during testing that were no longer needed
4. Extra images brought in when importing notes from elsewhere

### Method 1: Use Community Plugins for Automatic Detection and Cleanup

The most convenient method is to use dedicated plugins for attachment management. If you have not enabled third-party extensions yet, first review the [Obsidian community plugin installation and safety guide](https://chloevolution.com/posts/obsidian-plugins/) for installation locations, updates, and risk evaluation.

#### Plugin Recommendation 1: Consistent attachments and links

**[Consistent attachments and links](https://github.com/dy-sh/obsidian-consistent-attachments-and-links)** is a powerful attachment management plugin that can:

- Automatically detect unreferenced attachment files
- Batch delete orphaned images and attachments
- Automatically rename attachment files to match note names
- Automatically organize attachments into specified folders

Installation and usage:

1. Go to Settings > Community Plugins > Browse
2. Search for "Consistent attachments and links", click Install and enable it
3. In the plugin settings, find the "Delete unused attachments" option
4. Click the "Delete unused attachments confirmation" button
5. The plugin will list all unreferenced attachments; confirm to batch delete

![consistent-attachments-and-links-plugin](consistent-attachments-and-links-plugin.png)

> **Pros**: Comprehensive features, can clean all orphaned attachments with one click, and automatically organize file structure.

> **Cons**: Need to carefully check the list before deleting to avoid accidentally deleting useful files.

#### Plugin Recommendation 2: Janitor

**[Janitor](https://github.com/Canna71/obsidian-janitor)** is a plugin focused on cleaning and maintaining vaults:

- Scans and displays all orphaned attachment files
- Supports previewing the list of files to delete
- Can set automatic cleanup rules

Installation and usage:

1. Go to Settings > Community Plugins > Browse
2. Search for "Janitor", click Install and enable it
3. Use the command palette (Ctrl/Cmd + P) and type "Janitor"
4. Select "Scan for orphaned files" to scan for orphaned files
5. Confirm and execute cleanup operation

> **Pros**: Clean interface, focused on cleanup functionality, fast scanning.

> **Cons**: Relatively limited features, not as comprehensive as Consistent attachments and links.

### Method 2: Manual Detection and Cleanup (For Small-Scale Cleanup)

If your vault isn't large, or you only want to clean specific image files, you can operate manually:

#### Step 1: Use Global Search to Confirm if Image is Referenced

1. In Obsidian, press Ctrl/Cmd + Shift + F to open global search
2. Enter the image filename (without path), e.g., `Pasted image 20250705133021.png`
3. If search results are empty, this image is not referenced by any note

#### Step 2: Delete Files in the File System

1. Open your vault folder
2. Navigate to the image folder (e.g., `assets`)
3. Find confirmed unused image files
4. Delete or move to trash

> **Note**: Before deleting, it's recommended to backup your vault first, or move files to a temporary folder and observe for a while before permanently deleting.

### Method 3: Use Command-Line Tools for Batch Detection (For Advanced Users)

If you're familiar with command-line tools, you can use scripts to find orphaned image files.

**Using grep and find on Mac/Linux:**

```bash
# Navigate to vault directory
cd /path/to/your/vault

# Find all image files
find assets -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" \) > all_images.txt

# Check each one for references (requires manual processing of output)
while read image; do
  filename=$(basename "$image")
  grep -r "$filename" . --include="*.md" > /dev/null || echo "Unused: $image"
done < all_images.txt
```

This script will list all images that can't be found referenced in Markdown files.

> **Pros**: High flexibility, can customize search rules.

> **Cons**: Requires some command-line knowledge, not suitable for beginners.

### Cleanup Precautions

1. **Always backup before deleting**: Cleanup operations are irreversible. Backup your entire vault first, or move files to a temporary folder and observe for a few days.

2. **Watch for web images and external links**: Plugins typically only detect local file references. If you use web image links (`![](https://...)`), they won't be identified as unused.

3. **Check templates and template files**: Some images may be referenced in templates, but plugins might miss them during scanning. Confirm before deleting.

4. **Watch for filename conflicts**: If multiple image files have the same name but are in different folders, global search might misjudge. Manual confirmation needed.

5. **Consider retention period**: For images that just had references deleted, consider keeping them for a period (e.g., 30 days) and observe before permanently deleting.


**My Recommendation**: If your vault has many orphaned images, using the "Consistent attachments and links" plugin for one-click cleanup is the easiest. If you only occasionally clean a few images, using global search for manual confirmation is sufficient. Either way, always backup before cleaning!
