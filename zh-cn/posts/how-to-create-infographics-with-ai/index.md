# 如何用AI制作infographics？


**信息图表（Infographics）** 已成为提升内容质量和用户参与度的关键要素。无论是用于深化博客文章的理解，还是优化社交媒体内容的传播效率，一张设计精良的信息图表都能有效实现复杂的概念可视化，使其更具说服力和专业性。

## 方法一：重新利用已有的信息图表

这是最快捷、最直观的入门方法，尤其适用于你已经对设计风格有初步想法，或希望节省从零开始构思布局的时间。

该方法的本质是利用 AI 的图像识别和编辑能力。你提供一个**视觉模板**（即一个现有的信息图表），然后通过精准的提示词，让 AI 将模板的**设计骨架**保留下来，同时将**内容、配色和品牌元素**全部替换为你所需的信息。

### 1. 寻找合适的“模板”

* **原则：** 在 Google 图片等搜索并选择一个设计**简单、结构清晰**的现有信息图表。
* **选择标准：** 避免选择过于复杂的图表（包含大量文本或复杂的流程图），选择那些**布局基础、文本量适中**的样本，这能确保 AI 更容易识别和替换元素。

![simple-infographic-search-results](simple-infographic-search-results.png)

### 2. 上传素材并启动 AI

除了上传你找到的**现有信息图表图片**作为设计模板，你还需要上传你的**品牌 Logo 或头像**用于颜色提取和品牌标识。

### 3. 撰写精准的 Prompt

这里我用的是 Sora 作为示范。

成功的关键在于提供**详尽且具体的指示**。AI 需要知道你希望保留哪些元素、替换哪些元素，以及替换后的具体内容。

| Prompt 关键组成部分 | 目的与具体指令示例 |
| :--- | :--- | 
| **内容替换** | 指示 AI 移除旧主题，并列出所有新内容。**（这是最重要的细节！）** |
| **品牌配色** | 要求 AI 从你上传的 Logo 中提取颜色，并应用于新的信息图表设计。 |
| **品牌标识** | 要求 AI 在指定位置（如左上角）放置你上传的 Logo 或头像。 |
| **图标调整** | 要求 AI 更改或更新图标，使其与新的主题（如“AI 技术”或“营销”）相匹配。 |

Prompt示例：
```
I want you to edit this infographic and make it the '6 Benefits of Gemini'. Use my attached logo and place it on the top left of the infographic. 
Also change the colors based on my logo.
For the 6 benefits of Gemini, use these: Accelerate complex research, Streamline daily workflows, Generate high-quality content, Enhance decision-making with insights, Automate repetitive processes, Improve productivity across tools.
Also change the icons that make more sense based on Al/tech.
```

![reuse-existing-inforgraphics](reuse-existing-inforgraphics.png)


我们来检查下Sora生成的图和我们的参考图以及提供的prompt之间的匹配度：

![sora-result-1](sora-result-1.png)

1. 布局：和提供的参考模板基本一致：左上角为logo，右上角为标题，下方的6个要素平均排列
2. 文字要素：两张图都有问题。左图少了“Generate high-quality content”的内容，同时“Automate repetitive processes”出现了两次；右图的文字无问题，但在图片底部擅自出现了未要求绘制的图案，看起来是变形的logo

### 优点与注意事项

| 优点 | 注意事项 |
| :--- | :--- |
| **速度极快** | AI 生成的结果可能存在**细微的文本错误**（如拼写错误或数字误标）。 |
| **保持结构** | 需要注意原模板的优秀设计结构的保留程度，确保布局美观。 |
| **需要校对** | 对于不完美的小细节，可能需要使用 **Canva 或 Photoshop** 等外部工具进行最后的校正和完善。 |
| **品牌化简单** | 通过上传 Logo 即可一键更换配色，实现快速品牌统一。 | |

**总结：** 这种方法最适合快速制作具有高度品牌化、基于清晰列表或点式结构的信息图表。投入的细节过多（特别是精确的文本内容），AI 生成的效果可能会变差。


## 方法二：将现有书面内容（如博客文章）转换为信息图表

与方法一（基于视觉模板）不同，方法二更侧重于**内容驱动**。你将长篇的文字内容（如一篇博客文章）提供给 Sora，让 AI 理解其核心信息，并根据这些信息**从头构思信息图表的布局、文本摘要和相关图标**。

这种方法的优点在于：

* **最大化内容价值：** 将一篇博客文章转化为信息图表，可以将其发布到社交媒体、邮件或作为文章摘要，触达更广泛的受众并增加内容的复用率。
* **省时省力：** 无需手动从长篇内容中提炼要点或设计布局，AI 会自动完成这些工作，大大节省了时间和精力。
* **确保信息准确性：** 由于 AI 直接从你提供的原始文章中提取信息，可以更好地确保信息图表内容的准确性和连贯性。

### 1. 准备你的书面内容

挑选一篇你希望转化为信息图表的博客文章、报告摘要或任何结构化的长篇文字内容。

复制你选定内容的**完整文本**。请确保文本清晰、逻辑性强，这将帮助 AI 更好地理解和概括。

### 2. 上传品牌元素并输入 Prompt

上传你的品牌 Logo 文件。这不仅是为了在信息图表中加入你的品牌标识，更重要的是，你可以指示 AI **提取 Logo 中的颜色**，并将其应用于信息图表的整体配色方案。
提供清晰的指令，告知 AI 你的意图和具体要求：

| Prompt 关键组成部分 | 目的与具体指令示例 |
| :--- | :--- |
| **任务指令** | 明确告知 AI 的主要任务是创建信息图表。 |
| **品牌标识** | 指示 AI 使用你上传的 Logo 和配色。 |
| **图表标题** | 提供信息图表的具体标题。 |
| **设计要求** | 强调确保视觉效果良好，内容适配。 |
| **内容导入** | 将准备好的博客文章文本粘贴到 Prompt 中。 |

Prompt示例：
```
I want you to create a simple infographic based on the blog post I provide. 
Use the attached logo and title it 'How to Evaluate B2B Marketing?'. Make sure everything looks nice and fits inside the image. Here's the blog post: [Paste Blog Content Here].
```

![sora-result-2](sora-result-2.png)

乍眼一看好像生成的图片效果还不错，但细节有很多不足：
1. 混淆了logo和标题
2. 文字有变形、乱码、压线的问题
3. 内容过多，图片和文字被截断

## 方法三：从零开始生成内容和设计 (AI 策划)

这种方法完全依赖于AI自身的理解能力，你只需提供一个主题或一个核心问题，AI 就会负责信息的收集、要点的提炼，并根据这些内容即时生成信息图表的设计。

AI 在这个方法中扮演了双重角色：
1.  **内容研究员：** AI 利用其知识库或搜索能力，围绕你的主题快速收集并总结关键信息或最佳实践。
2.  **视觉设计师：** AI 基于提炼出的内容，自动构思并生成与之匹配的布局、图标和文本排版。

这种方法的优点在于：
  * **完全自动化：** 你无需提供任何文本或模板，AI 会处理从信息策划到视觉生成的所有环节。
  * **适用于新主题：** 非常适合快速为你不熟悉或需要最新信息的领域生成内容。
  * **简单且直接：** Prompt 简单，只需要专注于你想表达的核心主题。


### 1. 确定你的主题或问题

选择一个清晰、目标明确的主题，例如：“如何平衡远程工作和生活？”或“2025 年内容营销的五大趋势。”

### 2. 撰写 Prompt（简单但具体）

你的 Prompt 应该告诉 AI **它需要研究什么**以及**它需要如何呈现**。

| Prompt 关键组成部分 | 目的与具体指令示例 |
| :--- | :--- |
| **主题研究** | 要求 AI 收集信息并提炼要点。示例：“[你的主题] 的五个最佳实践是什么？” |
| **任务指令** | 要求 AI 基于收集到的信息创建信息图表。示例：“使用你知道的关于 [主题] 的信息，制作一个有用的信息图表。” |
| **设计细节** | 明确要求为每个要点配备相应的视觉元素。示例：“包含五个最佳实践，并为每个最佳实践配上一个相应的扁平化图标。” |

Prompt示例：
```
Using the information you know about Google Ads, can you create a helpful infographic with five best practices, with one corresponding flat icon image for each best practice.
```

![google-ads-best-practices-by-chatgpt](google-ads-best-practices-by-chatgpt.png)

让AI自己从零到一生成的图片质量非常不错，没有错字、变形、缺漏等问题，最大的不足在于：内容偏向宽泛单一。

### 3. 针对特定受众或风格进行优化

当你将目标受众或风格加入 Prompt 时，AI 生成的质量会非常高，它适用于各种教育和特定主题的内容创建。

| 目标受众/风格 | Prompt 范例 | 成功之处 |
| :--- | :--- | :--- |
| **基础教育** | "Can you create an infographic that explains photosynthesis to 5-year-olds?" | 采用简单的措辞、高对比度的卡通图标和基础布局，完美匹配儿童认知。 |
| **健康/养生** | "Create an infographic about gut health. Tone and style should be medical themed. Content focus on foods to eat and avoid for the general public." | 生成清晰的“可食/应避免”列表，配上相关食物图标，设计简洁专业。 |
| **小众主题研究** | "Generate an infographic titled 'The Secret Life of House Dust'. Visualize the microscopic ecosystem found in household dust (mites, bacteria, fungi, pollen)." | 即使主题非常小众，AI 也能快速研究并配上精确的组成比例图和健康影响的图标。 |
| **通用信息** | "Create an infographic with five facts about the Roman Empire." | AI 快速提炼并列出五条权威性事实，并配以历史或建筑风格的图标。 |



## 优化工作流程

虽然AI能够快速生成完整的信息图表，但在处理复杂设计或确保零错误的情况下，采用优化的工作流程至关重要。

### 1. 拆分任务：将复杂设计分解为组件

AI 在处理大量信息时容易出现文本被截断或设计混乱的问题。因此，优化策略建议将一个复杂的信息图表**分解成更小的、可管理的组件**。

* **问题所在：** 当你要求 AI 生成一个包含六个步骤、每个步骤都有详细描述的垂直长图时，通常会导致文本错乱或图片被切断。
* **解决方案：** 不要一次性生成整个图表，而是要求 AI **专注于生成单个、高质量的图形模块**：
    * **Prompt 示例：** “为我的信息图表的‘付费广告’部分创建一个专业设计的模块。模块应包含一个图标、一个简短标题、一段描述和一个专业提示（Pro Tip）。”
* **结果：** 这样生成的每个模块（如“付费广告”模块、“内容创作”模块）都会拥有更高的设计完成度和文本准确性，避免了整体设计崩塌的风险。

### 2. 生成精细化资产

AI 在生成与主题匹配、风格一致的图标方面表现出色。你可以利用这一点，要求 AI 专门为你准备一套用于外部设计的图标集。

* **用途：** 当你想要在 Canva 等工具中手动组装或编辑信息图表时，你需要一套与 AI 生成的风格保持一致的图标。
* **Prompt 示例：** “请创建 10 个营销主题的扁平化（Flat Design）图标。风格需要与这张附加图片中图标的样式相似。”（你可以附上 AI 之前生成的某个成功图标的截图。）
* **结果：** AI 会为你提供一个**风格统一的图标库**。你可以将这些图标截图或下载，并在外部设计工具中精确地放置在你需要的位置。

### 3. 外部组装与完善

这是工作流程中实现“零错误”和品牌专业化的最后一步。

* **弥补 AI 缺陷：** AI 生成的图表偶尔会遗留如**数字错位（只标出 1、3、5，跳过 2、4）**、**流程箭头混淆**或**细微拼写错误**等问题。
* **组装组件：** 将你在步骤 1 中生成的多个独立模块（内容、设计均已高质量完成）导入到外部设计平台。
* **专业化处理：** 在 Canva 中，你可以轻松地：
    * 统一背景和品牌色，套用你品牌的专属字体。
    * 快速修正 AI 图表中的小错误，如调整错位的数字、修正拼写错误。
    * 将 Logo 精确放置，并添加版权或网址等品牌信息。

**结论：** 优化的工作流程（**AI 生成组件 + AI 生成图标 + 外部工具精细组装**）是制作出既快速高效、又兼具专业设计水准和零错误的高质量信息图表的最佳策略。


