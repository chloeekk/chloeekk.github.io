# Obsidian Bases完整教程：用属性、筛选和公式管理笔记


当Obsidian里只有几十篇笔记时，文件夹和标签通常已经够用。但随着笔记越来越多，你可能会开始遇到这些问题：哪些书还没读完？哪些项目即将到期？最近30天写了哪些Daily Notes？

一篇篇打开笔记当然也能找到答案，只是效率很低。你真正需要的，是一种可以按照状态、日期、评分等条件自动整理笔记的方法。

Obsidian Bases就是为这类需求设计的。它可以把分散在不同Markdown文件中的Properties汇总成表格、卡片或列表，让你像查看数据库一样筛选、排序和编辑笔记，同时保留Obsidian本地存储的特点。

不过，在创建第一个Base之前，有一个概念必须先弄清楚：**Bases负责展示和整理数据，Properties才是数据本身。**


## Obsidian Bases是什么？

[Obsidian Bases](https://help.obsidian.md/bases)是Obsidian的核心插件，用来为笔记创建类似数据库的视图。它可以读取笔记中的Properties，并根据这些结构化信息显示、筛选、排序和编辑文件。

假设你有一个`Books`文件夹，里面放着几十篇读书笔记。每篇笔记都记录了作者、阅读状态、评分和完成日期。创建Base后，你可以把这些笔记显示为一张表格：

| 文件名 | 作者 | 阅读状态 | 评分 | 完成日期 |
|---|---|---|---|---|
| Atomic Habits | James Clear | 已读 | 4.5 | 2026-07-18 |
| Deep Work | Cal Newport | 在读 |  |  |
| The Psychology of Money | Morgan Housel | 未读 |  |  |

你还可以在同一个Base中创建多个视图，例如“正在阅读”“已经读完”“四星以上”和“封面展示”。这些视图读取的是同一批笔记，只是筛选条件和展示方式不同。

### Bases不是一套独立的数据库

Bases看起来像Notion等工具中的数据库，但它并不会把笔记迁移到一个封闭的数据系统中。

它的工作方式更接近一个动态窗口：

- 每一行仍然对应Vault中的一个文件。
- 每一列通常对应文件名、路径或某个Property。
- 修改Base中的属性值，会同步修改原始Markdown笔记中的对应属性。
- 筛选、排序和列布局等视图设置，不会改写笔记正文。
- 删除`.base`文件不会删除它所展示的Markdown笔记。

所有内容仍保存在本地文件中。笔记的数据位于Markdown文件顶部的Properties区域，而视图配置可以保存在独立的`.base`文件中，也可以通过`base`代码块直接嵌入普通笔记。

因此，Bases并不是用来取代Markdown，而是用来帮助你从另一个角度查看和管理Markdown文件。

### Obsidian Bases和Notion数据库有什么区别？

如果你用过Notion，看到Bases的表格和卡片视图时，很容易把两者理解成同一种工具。它们的确都能用属性组织内容，也都支持筛选、排序和多个视图，但底层逻辑并不相同。

最直观的区别是数据从哪里来：

```text
Obsidian：Markdown笔记 → Properties → Base读取并生成视图
Notion： Notion数据库 → 创建数据库条目（页面）→ 使用不同视图展示
```

![Obsidian Bases与Notion数据库的数据组织逻辑对比：Obsidian从本地Markdown笔记和Properties生成Base视图，Notion先创建数据库再添加页面与属性](obsidian-bases-vs-notion.png)

在Obsidian中，笔记先存在，Base再读取这些文件。即使没有Base，Markdown笔记和Properties仍然可以正常打开和编辑。

在Notion中，[数据库本身是一组页面的容器](https://www.notion.com/help/intro-to-databases)。每个数据库条目都是一个Notion页面，属性、页面内容和数据库视图共同存在于Notion工作区中。

| 对比维度 | Obsidian Bases | Notion数据库 |
|---|---|---|
| 数据来源 | Vault中已有的Markdown文件和Properties | Notion数据库中的页面和属性 |
| 存储方式 | 数据直接保存在本地Markdown文件中 | 内容保存在Notion工作区，可将指定页面下载供离线使用 |
| 离开数据库后 | 删除`.base`文件，原始笔记仍然存在 | 条目本身属于数据库，删除数据库会影响其中的页面 |
| 视图 | Table、List、Cards、Map，可由社区插件扩展 | Table、Board、Timeline、Calendar、List、Gallery等 |
| 属性能力 | 适合文本、数字、日期、列表、复选框及公式等常见需求 | 还提供Relation、Rollup、Person、Button等更丰富的数据库属性 |
| 文件可移植性 | Markdown文件可直接用其他文本编辑器打开 | 可以导出为Markdown与CSV，但日常编辑仍以Notion工作区为中心 |
| 更适合 | 重视本地文件、个人知识管理和长期可控性的用户 | 重视多人协作、关系型数据和一体化工作区的用户 |

这并不意味着Bases一定比Notion更好，或者Notion一定更强。两者解决问题的出发点不同：**Bases是在本地笔记之上增加数据库式视图，Notion则把数据库本身作为组织页面的重要容器。**

如果你最在意笔记以普通Markdown文件长期保存在自己手中，Bases会更自然；如果你的工作依赖团队成员、权限、Relation和Rollup等功能，Notion通常更成熟。对已经在使用Obsidian的人来说，Bases最大的价值不是复制一套Notion，而是在不改变本地文件工作流的前提下，获得更直观的数据管理能力。

### Bases适合哪些场景？

Bases特别适合管理“内容不同，但拥有相同字段”的一组笔记。例如：

- **阅读清单**：作者、状态、评分、开始日期、完成日期
- **项目管理**：负责人、优先级、截止日期、进度
- **内容日历**：文章类型、关键词、发布状态、发布日期
- **Daily Notes索引**：日期、心情、精力、运动、每日总结
- **论文与资料库**：作者、年份、主题、阅读状态
- **电影或作品收藏**：类型、评分、封面、观看状态

如果你经常需要回答“符合某些条件的笔记有哪些”，Bases通常会比手动浏览文件夹更方便。

### 哪些情况不需要使用Bases？

Bases并不是每个Vault都必须配置。如果你只有少量笔记，或者主要通过全文搜索和双向链接查找内容，文件夹与标签可能已经足够。

以下情况也不适合急着使用Bases：

- 你不愿意为同类笔记维护统一的Properties。
- 你需要复杂的关系型数据库约束或多人业务流程。
- 你希望执行高度自定义的JavaScript查询和自动化逻辑。
- 你还没有明确要解决的问题，只是想先建立一套复杂系统。

最好的起点不是创建一个包含几十列的“万能数据库”，而是选择一个真实场景，例如阅读清单，并只添加当前确实会使用的字段。


## 使用Bases前先理解Properties

[Properties](https://help.obsidian.md/properties)是附加在笔记上的结构化信息。它们通常显示在笔记顶部，并以“属性名 + 属性值”的形式描述这篇笔记。

例如，一篇读书笔记可以包含以下Properties：

```yaml
---
type: book
author: James Clear
status: reading
rating: 4
finished: false
date_started: 2026-08-01
tags:
  - books
  - productivity
---
```

这些信息在Obsidian界面中可以直接编辑，在Markdown源文件中则以YAML格式保存。Bases读取这些字段后，就能按照`status`筛选正在阅读的书，按照`rating`对书籍排序，或者按照`date_started`显示最近开始阅读的内容。

换句话说：如果Properties填写混乱，Base也会跟着混乱。创建Base之前，先设计好少量、清晰且一致的属性，通常比研究复杂公式更重要。

### Obsidian支持哪些属性类型？

Obsidian目前支持以下属性类型：

| 属性类型 | 示例 | 适用场景 |
|---|---|---|
| Text | `reading` | 状态、作者、分类、简短说明 |
| List | `books, productivity` | 多位作者、多个主题、相关人员 |
| Number | `4.5` | 评分、金额、数量、进度 |
| Checkbox | `true` | 是否完成、是否收藏、是否归档 |
| Date | `2026-08-22` | 开始日期、截止日期、发布日期 |
| Date & time | `2026-08-22T10:30:00` | 会议时间、提醒时间、事件记录 |
| Tags | `books` | 使用`tags`属性为笔记添加标签 |

属性类型不仅影响它在界面中的编辑方式，也会影响Bases如何筛选、排序和计算。例如，数字属性可以比较大小，日期属性可以按时间先后排序，复选框属性则只有选中和未选中两种状态。

需要注意的是，同一个属性名在整个Vault中会共用同一种类型。如果`rating`已经被设为Number，就不应该在另一篇笔记中把它当作一段文字使用。

### 属性应该怎么命名？

Obsidian并不强制你使用某一种命名风格，但一致性非常重要。下面这些字段看起来相似，实际上会被识别为不同的属性：

```yaml
status: reading
Status: reading
book-status: reading
book_status: reading
```

为了避免同一个含义分散成多个字段，可以为自己的Vault制定一套简单规则：

- 属性名统一使用小写。
- 中英文选一种，不要来回混用。
- 多个单词统一使用下划线或短横线连接。
- 同一个含义只保留一个属性名。
- 日期统一使用`YYYY-MM-DD`格式。
- 状态值使用固定选项，例如`unread`、`reading`和`finished`。

我更推荐使用简短的英文属性名，例如`status`、`rating`和`date_finished`。这不是Bases的硬性要求，但它们在公式、模板和其他插件中通常更容易复用。

### Properties应该放什么，不应该放什么？

Properties适合保存简短、原子化、需要筛选或排序的信息，例如状态、日期和评分。长篇摘要、阅读感想和会议记录仍然应该写在笔记正文中。

一个简单的判断方法是：**以后是否会根据这个信息筛选、排序、分组或计算？** 如果答案是“会”，它适合成为Property；如果只是供人阅读的连续内容，放在正文里通常更自然。

此外，Properties目前不适合存放需要渲染的Markdown内容，也不支持在界面中直接管理复杂的嵌套属性。刚开始使用时，尽量保持数据结构扁平简单。

### 用模板保持Properties一致

手动为每篇笔记重复输入属性，很容易出现拼写、类型和格式不一致的问题。更稳妥的做法是为读书笔记、项目笔记或Daily Notes分别创建模板，让同类笔记从一开始就拥有相同的字段。

例如，一份最基础的读书笔记模板可以只包含：

```yaml
---
type: book
author:
status: unread
rating:
date_started:
date_finished:
cover:
---
```

不必一开始就加入十几个属性。先从5至7个真正有用的字段开始，等实际使用一段时间后，再根据筛选和展示需求调整。

如果你还没有使用过模板，可以先参考[Obsidian模板指南](https://chloevolution.com/zh-cn/posts/obsidian-templates/)，建立统一的Properties结构。下一步，我们会使用这套读书笔记属性创建第一个Obsidian Base。


## 创建第一个Obsidian Base

下面以“阅读清单”为例，从零创建一个可以实际使用的Base。完成后，你会得到一张包含书名、作者、阅读状态、评分和日期的表格，并且可以直接在其中修改属性。

整个过程分为五步：

1. 启用Bases核心插件。
2. 准备三篇带有统一Properties的读书笔记。
3. 创建一个独立的`.base`文件。
4. 设置筛选条件，限制Base的数据范围。
5. 选择需要在Base中显示的Properties。

### 第一步：启用Bases核心插件

Bases是Obsidian官方提供的核心插件，不需要从社区插件市场下载安装。

1. 打开Obsidian，进入“设置”（Settings）。
2. 在左侧菜单中选择“核心插件”（Core plugins）。
3. 搜索`Bases`。
4. 打开Bases右侧的开关。

![obsidian-bases-enable-plugin](obsidian-bases-enable-plugin.png)

启用后，命令面板和文件浏览器中会出现创建Base的相关选项。如果完全找不到Bases，请先更新Obsidian。Table和Cards视图需要Obsidian 1.9或更高版本，List视图则需要1.10或更高版本。

### 第二步：准备三篇读书笔记

在Vault中创建一个`Books`文件夹，在里面新建三篇Markdown笔记，并用`assets`子文件夹存放封面图片：

```text
Books/
├── assets/
│   ├── atomic-habits.jpg
│   ├── deep-work.jpg
│   └── the-psychology-of-money.jpg
├── Atomic Habits.md
├── Deep Work.md
└── The Psychology of Money.md
```

为三篇笔记添加相同的Properties。下面是一组可以直接使用的示例数据：

> 复制时，只复制代码块内部从第一行`---`到最后一行`---`的内容，并粘贴到笔记最顶部。代码块上方显示的`yaml`只是本文用于语法高亮的语言标记，不属于笔记内容，不需要复制；代码块外层的三个反引号也不要复制。

**Atomic Habits.md**

```yaml
---
type: book
author: James Clear
status: finished
rating: 4.5
date_started: 2026-07-02
date_finished: 2026-07-18
cover: "[[assets/atomic-habits.jpg]]"
---
```

**Deep Work.md**

```yaml
---
type: book
author: Cal Newport
status: reading
rating:
date_started: 2026-08-15
date_finished:
cover: "[[assets/deep-work.jpg]]"
---
```

**The Psychology of Money.md**

```yaml
---
type: book
author: Morgan Housel
status: unread
rating:
date_started:
date_finished:
cover: "[[assets/the-psychology-of-money.jpg]]"
---
```

封面图片不是创建Base的必要条件。如果你暂时没有图片，可以让`cover`保持为空；等后面配置Cards视图时再补充。

这里最关键的是三篇笔记都使用了相同的属性名和状态值。`type: book`用于确定哪些文件属于阅读清单，`status`用于区分未读、在读和已读，其他字段则负责显示和排序。

### 第三步：创建Books.base

根据[Obsidian官方文档](https://help.obsidian.md/bases/create-base)，创建Base有三种常用方式：

- **文件浏览器**：右键单击目标文件夹，选择“New base”。
- **命令面板**：运行“Bases: Create new base”。
- **左侧Ribbon**：点击“Create new base”按钮。

在这个案例中，可以右键单击`Books`文件夹，选择“New base”，然后将文件命名为：

```text
Books.base
```

打开文件后，你会看到默认的Table视图。`.base`文件保存的是筛选条件、显示属性、排序方式和视图设置，不是读书笔记本身。

如果你不想创建独立文件，也可以使用“Bases: Insert new base”命令，把Base直接嵌入当前Markdown笔记。不过对于第一次练习，使用独立的`Books.base`更容易理解和管理。

### 第四步：设置Base的数据范围

新建的Base默认可能显示整个Vault中的文件。这不是程序出错，而是因为它还没有任何筛选条件。

打开Base顶部工具栏中的“Filter”，在“All views”区域添加以下条件：

```text
type is book
```

这个筛选条件会读取笔记的`type`属性，只保留值为`book`的文件。因为它被添加在“All views”中，所以之后创建的表格、卡片和列表视图都会继承这个数据范围。

你也可以使用文件夹作为范围，例如只显示`Books`文件夹中的文件。两种方法的差别是：

| 筛选方式 | 优点 | 适用情况 |
|---|---|---|
| `type is book` | 文件移动到其他文件夹后仍可被识别 | 主要依靠Properties组织笔记 |
| 文件位于`Books`文件夹 | 简单直观，不依赖`type`属性 | 所有读书笔记都固定放在同一文件夹 |

我更推荐使用`type is book`。这样以后即使把某篇笔记移动到作者文件夹或归档目录，只要`type`属性没有改变，它仍然会出现在阅读清单中。

> 注意：“All views”筛选决定整个Base可以使用哪些文件；“This view”筛选只影响当前视图。数据范围这类基础条件适合放在“All views”，而“只看正在阅读”等临时或局部条件适合放在“This view”。

### 第五步：选择要显示的Properties

打开工具栏中的“Properties”菜单，保留并排列以下字段：

- File name
- author
- status
- rating
- date_started
- date_finished

暂时隐藏`type`和`cover`。`type`只用于筛选，没有必要占用表格空间；`cover`则留到Cards视图中使用。

现在，你应该能看到三本书组成的阅读清单。尝试把`Deep Work`的`rating`填为`4`，或者将`status`从`reading`改为`finished`，再打开原始笔记查看Properties。你会发现修改已经写回对应的Markdown文件。

到这里，第一个Base就创建完成了。它不是一张需要重复维护的表格，而是三篇读书笔记的实时视图。

![obsidian-bases-table-view](obsidian-bases-table-view.png)

## 使用不同的Bases视图

一个Base可以包含多个视图，每个视图都可以拥有自己的布局、显示字段、筛选和排序方式。例如，同一个`Books.base`可以同时包含“全部书籍”“正在阅读”“已读完”和“封面展示”。

点击左上角的视图名称，再选择“Add view”，就可以创建新视图。也可以通过命令面板运行“Bases: Add view”。

根据当前[Views官方文档](https://help.obsidian.md/bases/views)，Obsidian提供Table、Cards、List和Map等布局，社区插件还可以增加其他布局。对大多数个人知识库来说，最常用的是前三种。

### Table：适合查看和编辑结构化数据

Table是Base的默认视图。每一行代表一个文件，每一列显示文件信息或Property。

它最适合以下场景：

- 对比多篇笔记的多个属性。
- 集中修改状态、评分、日期等数据。
- 按数字或日期排序。
- 查看项目进度、内容计划和阅读清单。

在`Books.base`中，可以把默认视图重命名为“全部书籍”，并设置：

- 显示`author`、`status`、`rating`、`date_started`和`date_finished`。
- 按`status`分组。
- 在每个分组内按`rating`从高到低排序。

Table视图还可以调整行高。Short适合紧凑的数据清单，Medium或Tall则能显示更多内容。如果需要统计已填写评分的书籍数量或平均评分，可以右键单击列标题并选择“Summarize”，在列底部添加Filled、Average等汇总结果。

Table的优点是信息密度高、编辑方便；缺点是封面和视觉内容不够突出。需要快速处理数据时优先用Table，需要浏览图片时则更适合Cards。

### Cards：适合封面、图片和作品展示

Cards把文件显示为画廊式卡片，可以在卡片顶部展示封面图片。它适合：

- 读书和电影清单。
- 图片库与作品集。
- 旅行地点和灵感收藏。
- 需要通过视觉快速识别内容的资料库。

在视图菜单中选择“Add view”，布局选择“Cards”，将它命名为“封面展示”。然后进入该视图的设置：

1. 将“Image property”设为`cover`。
2. 根据图片比例选择“Cover”或“Contain”。
3. 调整卡片大小与图片宽高比。
4. 在Properties菜单中保留`author`、`status`和`rating`。

`cover`属性可以使用本地附件的内部链接，也可以使用外部图片URL。例如：

```yaml
cover: "[[assets/atomic-habits.jpg]]"
```

“Cover”会让图片填满封面区域，必要时裁切边缘；“Contain”会完整显示图片，但周围可能出现留白。书籍封面通常适合Contain，尺寸和比例比较统一的照片则更适合Cover。

Cards适合浏览，不适合一次比较很多字段。如果卡片上显示的属性太多，视觉重点会被稀释。通常保留标题、作者、状态和评分就足够了。

![obsidian-bases-cards-view](obsidian-bases-cards-view.png)

### List：适合轻量索引和移动端浏览

List将文件显示为项目符号或编号列表，比Table更简洁，比Cards更紧凑。它适合：

- 最近更新的笔记。
- 简单的文章或资料索引。
- 移动端快速浏览。
- 只需要标题和一两个辅助属性的清单。

创建List视图后，可以选择项目符号、数字或不显示标记。如果开启“Indent properties”，次要属性会缩进显示在主项目下方；关闭后，多个属性会通过逗号等分隔符显示在同一行。

例如，可以创建一个名为“正在阅读”的List视图，并在“This view”中设置：

```text
status is reading
```

然后把File name放在Properties菜单的第一位，下面只保留`author`和`date_started`。这样你打开Base时，可以快速看到当前正在读什么以及从哪天开始阅读。

List视图需要Obsidian 1.10或更高版本。如果你的视图菜单里只有Table和Cards，先检查Obsidian版本，而不是重复创建Base。

### Map：适合带有位置数据的笔记

Map视图可以将文件显示为交互式地图上的标记，适合旅行笔记、地点收藏和客户位置等场景。它需要Obsidian 1.10或更高版本，并安装相应的Maps插件。

阅读清单不需要地图，因此本文不展开配置。如果你的笔记没有经纬度或位置属性，也没有必要为了使用全部视图而添加Map。

### 如何为阅读清单设计多个视图？

完成以上设置后，`Books.base`可以包含四个互补的视图：

| 视图名称 | 布局 | 当前视图筛选 | 主要用途 |
|---|---|---|---|
| 全部书籍 | Table | 无 | 查看和编辑所有读书笔记 |
| 正在阅读 | List | `status is reading` | 快速查看当前阅读任务 |
| 已读完 | Table | `status is finished` | 按评分或完成日期回顾书籍 |
| 封面展示 | Cards | 无 | 通过封面浏览整个书库 |

这四个视图共用“All views”中的`type is book`筛选，因此都只会读取读书笔记；每个视图再用自己的筛选和布局解决不同问题。

选择视图时不必追求越多越好。一个简单原则是：**Table负责管理数据，Cards负责视觉浏览，List负责快速查找。** 只有当一个新视图能够明显减少操作步骤时，才值得把它保留下来。


## 筛选、排序和分组笔记

当Base中只有三篇示例笔记时，手动浏览并不困难；但当阅读清单增加到几十甚至几百本书后，筛选、排序和分组才会真正发挥作用。

这三个功能解决的问题不同：

- **筛选（Filter）**：决定哪些文件会出现在当前结果中。
- **排序（Sort）**：决定这些文件按照什么顺序排列。
- **分组（Group）**：把具有相同属性值的文件放在同一个区块中。

你可以先用筛选缩小范围，再对结果进行排序或分组。例如，先筛选所有已读完的书，再按评分从高到低排列，最后按完成年份分组。

### All views和This view有什么区别？

打开Base顶部的“Filter”菜单后，会看到“All views”和“This view”两个区域：

![obsidian-bases-filter-all-views](obsidian-bases-filter-all-views.png)

- **All views**中的筛选条件应用于整个Base。
- **This view**中的筛选条件只应用于当前视图。

前面设置的`type is book`属于基础数据范围，应该放在“All views”。这样Table、Cards和List视图都只会显示读书笔记。

“正在阅读”“四星以上”或“最近读完”这类条件则应该放在“This view”。它们只服务于某一个视图，不会影响同一Base中的其他视图。

如果一个视图突然没有任何结果，可以分别检查这两个区域。全局筛选和当前视图筛选会同时生效，只要其中一个条件不满足，文件就不会显示。

### 如何添加筛选条件？

普通筛选条件由三个部分组成：

1. **Property**：要检查的笔记属性或文件属性。
2. **Operator**：比较方式，例如等于、包含、大于或早于。
3. **Value**：要比较的值。

不同的属性类型会提供不同的Operator。Text适合判断等于或包含，Number可以比较大小，Date可以判断早于或晚于，Checkbox则适合判断是否选中。

下面是阅读清单中常用的筛选方式：

| 需求 | 筛选条件 | 建议放置位置 |
|---|---|---|
| 只显示读书笔记 | `type is book` | All views |
| 只显示正在阅读 | `status is reading` | This view |
| 只显示评分不低于4分 | `rating is greater than or equal to 4` | This view |
| 排除未开始阅读的书 | `status is not unread` | This view |
| 只显示指定文件夹 | 文件位于`Books` | All views或This view |
| 只显示包含`books`标签的笔记 | Tags包含`books` | All views或This view |

界面中的文字会根据Obsidian语言和属性类型有所不同，但逻辑始终是“属性 + 比较方式 + 值”。

### 使用日期和文件信息筛选

除了自己添加的Properties，Bases还可以读取文件路径、创建时间、修改时间和标签等内置文件信息。

例如，你可以创建以下视图：

- 最近7天修改过的读书笔记。
- 最近30天读完的书。
- 位于`Books`文件夹及其子文件夹中的文件。
- 包含`books`标签的所有笔记。

对于普通条件，优先使用可视化筛选菜单。如果菜单无法表达需要的逻辑，可以点击代码图标打开Advanced filter editor。以下是几个常用的高级筛选表达式：

```text
file.inFolder("Books")
file.hasTag("books")
file.mtime > now() - "7d"
date_finished >= today() - "30d"
```

它们分别表示：文件位于`Books`及其子文件夹、文件包含`books`标签、文件最近7天修改过，以及完成日期在最近30天内。

高级筛选更灵活，但也更容易因为属性名、引号或类型错误而没有结果。新手先用可视化菜单完成大部分筛选，只在确有需要时使用表达式即可。

### 组合多个筛选条件

当一个条件不够用时，可以使用三种组合方式：

- **All the following are true（AND）**：所有条件都必须成立。
- **Any of the following are true（OR）**：任意一个条件成立即可。
- **None of the following are true（NOT）**：排除满足条件的文件。

例如，要创建“高评分已读书籍”视图，可以选择“All the following are true”，并添加：

```text
status is finished
rating is greater than or equal to 4
```

要创建“待读书籍”视图，可以选择“Any of the following are true”，然后添加：

```text
status is reading
status is unread
```

组合筛选时，建议先逐个确认每个条件都能返回正确结果，再把它们放进同一个条件组。这样更容易发现是哪个条件导致结果为空。

### 如何排序笔记？

打开顶部工具栏中的“Sort”，选择需要排序的Property，再选择方向：

- Text可以按A→Z或Z→A排序。
- Number可以从小到大或从大到小排序。
- Date可以从旧到新或从新到旧排序。

阅读清单中常用的排序方式包括：

- 按`rating`从高到低，优先查看高分书籍。
- 按`date_started`从新到旧，查看最近开始阅读的书。
- 按`date_finished`从新到旧，回顾最近读完的书。
- 按File name的字母顺序排列，建立稳定的书目索引。

一个视图可以设置多个排序条件。排在上面的条件优先级更高。例如，先按`status`排序，再按`rating`从高到低排序，结果会先按照阅读状态排列，同一状态内再按照评分排列。

如果排序结果和预期不一致，先检查属性类型。保存成Text的`rating`会按照字符顺序排列，而不是按照数字大小排列。

### 如何分组笔记？

分组会根据某个Property的值，把结果拆分成多个可折叠区块。对于阅读清单，最实用的是按`status`分组：

```text
finished
reading
unread
```

打开“Sort”菜单，选择`status`，然后将它设置为Group。这样不需要创建三个独立视图，也能在同一张表中区分已读、在读和未读书籍。

![obsidian-bases-sort-group](obsidian-bases-sort-group.png)

目前一个视图只支持按照一个Property分组，但分组后仍然可以添加多个排序条件。例如，先按`status`分组，再让每组中的书按照`rating`从高到低排列。

分组适合帮助你快速观察数据结构，但如果某个属性有几十个不同的值，例如作者名称，分组后会产生大量区块。这种情况通常更适合使用筛选或排序。


## 使用Bases公式和汇总

Properties保存你手动输入的数据，公式（Formula）则根据这些数据自动计算新的结果。

例如，`pages_read`和`total_pages`记录已读页数和总页数，公式可以自动计算阅读进度；`target_date`记录计划完成日期，公式可以计算距离目标还有多少天。

根据[Obsidian公式官方文档](https://obsidian.md/help/formulas)，公式属性可以进行数值计算、文本处理、日期计算、条件判断和列表处理。计算结果只保存在Base配置中，不会作为新Property写入每篇Markdown笔记。

### 添加公式前准备三个Properties

为了继续使用前面的阅读清单案例，需要为`Deep Work.md`增加三个属性。由于这篇笔记已经有Properties，最简单的方法是直接使用笔记顶部的属性编辑界面：

1. 打开`Deep Work.md`。
2. 点击Properties区域底部的“Add property”，或使用“Add file property”命令。
3. 新建`pages_read`，将类型设为Number，值填写`120`。
4. 新建`total_pages`，将类型设为Number，值填写`304`。
5. 新建`target_date`，将类型设为Date，值选择`2026-09-01`。

如果选择器中已经出现这些属性名，直接选择即可；如果没有，就输入完整名称并创建。设置完成后，笔记顶部应该多出以下三个字段：

| Property | 类型 | 示例值 |
|---|---|---|
| `pages_read` | Number | `120` |
| `total_pages` | Number | `304` |
| `target_date` | Date | `2026-09-01` |

![obsidian-bases-add-formula-properties](obsidian-bases-add-formula-properties.png)

如果你更习惯直接编辑YAML，可以从笔记右上角的菜单切换到Source Mode，然后把下面三行添加到**现有Properties的结束符`---`之前**：

```yaml
pages_read: 120
total_pages: 304
target_date: 2026-09-01
```

> 这里只添加三行属性，不要再次添加一组`---`，也不要复制代码块上方的`yaml`或外层反引号。一篇笔记顶部只需要一组Properties区域。

其他两篇笔记可以暂时不添加这些字段，公式会根据每一行的实际数据分别计算。

### 如何创建一个公式属性？

1. 打开Base顶部工具栏中的“Properties”。
2. 点击菜单底部的“Add formula”。
3. 输入公式名称。
4. 在“Formula”字段中输入表达式。
5. 确认编辑器出现绿色对勾，然后关闭窗口。

创建成功后，公式会像普通Property一样出现在Properties菜单中。你可以把它添加到Table或Cards视图，也可以使用公式结果进行筛选和排序。

公式可以引用三种数据：

- **Note properties**：笔记中的Properties，例如`rating`和`pages_read`。
- **File properties**：文件本身的信息，例如`file.name`和`file.mtime`。
- **Formula properties**：同一个Base中的其他公式，引用方式为`formula.公式名称`。

### 公式示例一：计算阅读进度

创建一个名为`progress_percent`的公式，并输入：

```text
if(total_pages > 0, ((pages_read / total_pages) * 100).round(0), "")
```

当`pages_read`为120、`total_pages`为304时，结果约为`39`，表示已经阅读39%。

![obsidian-bases-formula-results](obsidian-bases-formula-results.png)

这里没有直接在公式结果后添加`%`，是为了让结果继续保持Number类型。这样你仍然可以按进度排序、筛选“进度大于50”的书，或者计算整个视图的平均进度。可以将该列的显示名称改为“阅读进度（%）”。

### 公式示例二：计算距离目标日期的天数

创建一个名为`remaining_days`的公式：

```text
if(target_date, ((target_date - today()) / 86400000).ceil(), "")
```

日期相减后会得到毫秒数，`86400000`是一天包含的毫秒数。公式将结果换算为天并向上取整：

- 正数表示距离目标日期还有多少天。
- `0`表示目标日期是今天。
- 负数表示已经超过目标日期。

这个公式同样适用于项目截止日期、文章发布日期和任务到期时间。

如果你只需要便于阅读的相对日期，而不需要按剩余天数计算或排序，也可以使用：

```text
if(target_date, target_date.relative(), "")
```

它会返回类似“in 3 days”或“2 days ago”的文本。

### Formula和Summary有什么区别？

Formula与Summary都能计算数据，但计算范围不同：

| 功能 | 计算对象 | 示例 |
|---|---|---|
| Formula | 针对每一篇笔记分别计算 | 每本书的阅读进度、剩余天数 |
| Summary | 汇总当前视图中整列数据 | 平均评分、书籍数量、总页数 |

公式会为每一行产生一个结果。汇总则只在Table视图的列底部显示一个整体结果，而且只统计当前筛选后可见的文件。

例如，在“已读完”视图中为`rating`列添加Average，得到的是已读书籍的平均评分；切换到“全部书籍”视图后，另一个视图可以使用不同的汇总设置。

### 如何添加汇总？

1. 在Table视图中右键单击列标题。
2. 选择“Summarize…”。
3. 选择适合当前属性类型的汇总方式。

常用汇总包括：

| 属性类型 | 可用汇总 | 适用示例 |
|---|---|---|
| 任意类型 | Empty、Filled、Unique | 统计空值、已填写数量或不同值数量 |
| Number | Average、Sum、Min、Max、Median | 平均评分、总页数、最高评分 |
| Date | Earliest、Latest、Range | 最早和最近完成日期 |
| Checkbox | Checked、Unchecked | 已完成与未完成数量 |

在阅读清单中，可以为File name列使用Filled统计当前显示的书籍数量，为`rating`列使用Average计算平均评分，为`total_pages`列使用Sum计算总页数。

如果视图已经按`status`分组，汇总结果会显示在每个分组顶部，方便比较已读、在读和未读书籍的数据。

### 公式没有结果时检查什么？

如果公式显示为空或报错，优先检查：

- 属性名是否与笔记中的拼写完全一致。
- Number属性是否被误设为Text。
- Date属性是否使用正确的日期类型。
- 文本值是否使用单引号或双引号包围。
- 参与计算的字段是否为空。
- 是否错误地让两个公式互相引用，形成循环。

公式编辑器会自动补全可用的属性和函数，并用绿色对勾表示语法有效。输入时尽量从自动补全列表中选择属性，可以减少拼写错误。

对大多数新手来说，阅读进度和剩余天数已经足够覆盖常见需求。先让公式解决一个真实问题，再根据需要增加复杂度，比一开始复制大量公式更容易维护。


## Obsidian Bases与Dataview有什么区别？

在Bases出现之前，很多Obsidian用户会使用[Dataview](https://blacksmithgu.github.io/obsidian-dataview/)把笔记整理成动态表格、列表或任务视图。两者都能读取Markdown笔记中的元数据，也都可以筛选、排序、分组和计算，因此很容易产生一个问题：有了Bases之后，还需要Dataview吗？

答案不是简单的“需要”或“不需要”。Bases与Dataview有一部分功能重叠，但操作方式和能力边界并不相同。

### Bases和Dataview的核心差异

| 对比维度 | Obsidian Bases | Dataview |
|---|---|---|
| 类型 | Obsidian核心插件 | 社区插件 |
| 安装方式 | 随Obsidian提供，只需启用 | 需要从Community plugins安装并启用 |
| 主要操作方式 | 图形界面，也可以编辑`.base`语法 | Dataview Query Language（DQL）、内联查询或DataviewJS |
| 数据来源 | 笔记Properties和文件信息 | YAML Frontmatter、Inline Fields、标签、任务、列表及文件信息 |
| 常用输出 | Table、Cards、List、Map等视图 | TABLE、LIST、TASK、CALENDAR及自定义JavaScript输出 |
| 编辑数据 | 可以在Base视图中直接修改笔记属性 | 主要用于查询和展示，普通查询结果通常不能直接编辑原笔记属性 |
| 查询能力 | 适合常用筛选、公式、排序和分组 | DQL更灵活，DataviewJS还能处理复杂逻辑和自定义展示 |
| 学习成本 | 较低，适合通过界面逐步配置 | 需要学习查询语法；DataviewJS还需要JavaScript基础 |
| 维护成本 | 随Obsidian核心功能更新 | 依赖社区插件、查询语法和插件兼容性 |
| 更适合 | 新手、可视化管理、直接编辑Properties | 复杂查询、任务汇总、Inline Fields和自定义自动化展示 |

最重要的区别可以概括为：**Bases更像一个可以编辑数据的可视化管理界面，Dataview更像一个从笔记中读取数据并生成结果的查询引擎。**

Dataview官方文档也明确将它定位为展示和计算工具，而不是元数据编辑器。一个主要例外是TASK查询中的任务复选框：在查询结果里勾选任务，可以同步更新原始笔记中的任务状态。

### 同一个阅读清单，两种实现方式

假设我们要实现以下需求：

- 只显示`Books`文件夹中`type`为`book`的笔记。
- 只保留`status`为`finished`的书籍。
- 显示作者和评分。
- 按评分从高到低排列。

在Bases中，可以通过界面完成：

1. 在All views中设置`type is book`。
2. 在当前视图中设置`status is finished`。
3. 在Properties中显示`author`和`rating`。
4. 在Sort中将`rating`设置为从高到低。

在Dataview中，可以在普通Markdown笔记里插入下面的DQL代码块：

````markdown
```dataview
TABLE author AS "作者", rating AS "评分"
FROM "Books"
WHERE type = "book" AND status = "finished"
SORT rating DESC
```
````

两种方法得到的结果相近，但使用体验不同：Bases把配置选项显示在界面中，适合边看边调整；Dataview把逻辑集中写在代码块中，复制、复用和修改查询更方便，但需要理解`FROM`、`WHERE`和`SORT`等语法。

### 哪些情况优先使用Bases？

以下需求更适合优先尝试Bases：

- 不想安装社区插件或学习查询语言。
- 希望直接在表格中修改状态、评分和日期。
- 需要Cards等视觉化视图浏览封面和图片。
- 查询逻辑以常规筛选、排序、分组和公式为主。
- 希望通过界面发现和调整字段，而不是维护代码块。

如果你刚开始使用Obsidian数据库式功能，Bases通常是更自然的起点。它能满足阅读清单、项目列表、内容日历和简单仪表盘等常见场景。

### 哪些情况Dataview仍然更合适？

Dataview在以下场景中仍然有明显价值：

- 需要查询笔记正文中的Inline Fields。
- 需要跨笔记汇总具体任务，而不只是文件级Properties。
- 需要使用TABLE、LIST、TASK和CALENDAR查询类型。
- 需要复杂的数据转换、多层逻辑或高度自定义的输出。
- 已经拥有大量稳定运行的DQL或DataviewJS查询。
- 需要通过DataviewJS调用查询API并生成自定义内容。

DataviewJS的自由度很高，但它本质上是在笔记中执行JavaScript。复制他人的DataviewJS代码前，应先理解代码会读取或执行什么，不要直接运行来源不明的脚本。

### Bases可以和Dataview一起使用吗？

可以。两者并不是互斥关系。

前文创建的`author`、`status`、`rating`和`date_finished`等Properties保存在Markdown文件的YAML Frontmatter中，Bases和Dataview都可以读取。你不需要为了使用另一种工具重新维护一套数据。

一种实用的组合方式是：

- 使用Bases集中编辑和检查Properties。
- 使用Dataview汇总任务、Inline Fields或复杂查询结果。
- 简单视图优先使用Bases，只有当Bases无法清晰表达需求时再使用Dataview。

这种方式既能降低日常维护成本，也不必放弃Dataview在复杂查询方面的灵活性。

### 已有Dataview工作流需要迁移吗？

如果现有Dataview查询运行稳定，没有必要为了使用新功能而全部重写。

可以先选择一个简单查询，例如阅读清单或项目列表，用Bases重新实现并比较实际体验：

- 如果你经常需要直接修改属性，Bases可能更方便。
- 如果查询包含任务、Inline Fields或复杂转换，继续使用Dataview通常更省事。
- 如果两种方式各有所长，可以让它们在同一个Vault中并存。

对于新用户，我建议先学习Properties和Bases；等到遇到Bases难以解决的真实需求时，再学习DQL。对于已经熟悉Dataview的用户，Bases更适合作为一个新的可视化编辑入口，而不是必须替换原有查询的迁移目标。


---

Obsidian Bases最重要的价值，不是把Obsidian变成另一个Notion，而是为本地Markdown笔记增加一种更直观的管理方式。

理解Bases时，只需要记住三个层次：

1. **Properties保存数据**：作者、状态、评分和日期仍然保存在Markdown笔记中。
2. **Base组织数据**：筛选、排序、分组和公式决定如何处理这些信息。
3. **View展示数据**：Table适合编辑，Cards适合浏览，List适合快速查看。

如果你准备跟着本文开始实践，不需要立即设计一个复杂系统。可以先完成下面这条最短路径：

1. 选择一个真实场景，例如阅读清单。
2. 确定5至7个真正需要的Properties。
3. 创建3篇示例笔记并统一属性名称和类型。
4. 创建一个Base，并在All views中限制数据范围。
5. 先保留一个Table视图，确认数据能够正常显示和编辑。
6. 根据需要增加Cards或List视图。
7. 实际使用一段时间后，再添加筛选、公式和汇总。

不要一开始就创建几十个属性、十几个视图或大量公式。字段越多，后续维护成本越高；真正好用的Base，通常只保留能够帮助你做出判断或减少重复操作的信息。

当阅读清单运行稳定后，可以把同样的方法应用到项目管理、内容日历、Daily Notes索引或论文资料库中。核心流程不会改变：先统一Properties，再设置数据范围，最后根据使用场景选择视图。

如果你还需要完善基础工作流，可以继续阅读：[Obsidian模板指南](https://chloevolution.com/zh-cn/posts/obsidian-templates/)可以帮助你统一Properties，[Obsidian Daily Notes完整教程](https://chloevolution.com/zh-cn/posts/obsidian-daily-notes/)可以作为Bases仪表盘的数据来源，[Obsidian插件完全指南](https://chloevolution.com/zh-cn/posts/obsidian-plugins/)则适合了解Dataview等社区插件。

Bases不需要一次搭建完成。先用它解决一个具体问题，持续使用，再根据真实需求调整，这通常比追求一套“完美的知识管理系统”更有效。

