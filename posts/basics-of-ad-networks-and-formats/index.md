# Basics of Ad Networks and Formats


## What Is an Ad Network?

In the internet advertising ecosystem, an **ad network** plays a crucial but often overlooked role. Simply put, it acts like a middleman, connecting **advertisers** and **publishers**, enabling ads to circulate efficiently across websites, apps, and video platforms.

Without ad networks, advertisers would need to negotiate with each media individually, which is very inefficient. At the same time, small and medium-sized websites or apps would struggle to connect with enough advertisers, often leaving ad space unsold. Ad networks solve this “two-sided problem.”

The value of ad networks can be summarized in several key points:

1. **Traffic Aggregation**

   * They consolidate ad inventory scattered across long-tail media into large-scale traffic pools.
   * For advertisers, this means “one access, multiple placements,” reducing campaign costs.
   * For publishers, it helps them find ad demand more quickly and minimize unsold inventory.

2. **Targeted Distribution**

   * Ad networks tag ad inventory with information such as user location, interests, device type, and browsing behavior.
   * Advertisers can target their campaigns to reach users more likely to engage.
   * This improves ad performance and ROI.

3. **Price Standardization**

   * Different websites and apps often have their own pricing, making comparisons difficult.
   * Ad networks standardize billing models (CPM, CPC, CPA, etc.) and data metrics, making pricing transparent and measurable.
   * Advertisers can plan budgets more easily, and publishers can sell inventory fairly.


## How Ad Networks Work?

Think of an ad network as an “ad marketplace.” On one side, it aggregates ad inventory (apps, websites), and on the other, it brings together advertisers who want to promote their products. The network matches supply and demand.

### 1. Supply Side (Publishers)

* Like landlords, publishers own “ad space”—banner ads on a website, interstitials in an app, pre-rolls in a short video.
* They hand over these ad spaces to the network and wait for advertisers.
* They also provide data such as impressions, clicks, and user engagement to the network.

### 2. Demand Side (Advertisers)

* Advertisers are like tenants, bringing budgets to the marketplace to show ads to the right audience.
* They set goals (e.g., “increase downloads” or “boost sales”), select target groups (location, interests, age), and set bids.
* Example: A game company wants to promote a new mobile game to users aged 18–25 and is willing to pay \$20 per download.

### 3. Matching & Bidding

* When a user opens an app or website, the ad network quickly matches eligible advertisers in a “real-time auction.”
* The highest bid with the most relevant ad wins the ad space.
* Common billing models:

  * **CPM**: Pay per thousand impressions.
  * **CPC**: Pay per click.
  * **CPA**: Pay per action (e.g., download or registration).

### 4. Data Feedback & Optimization

* After the campaign, the network reports metrics: impressions, clicks, conversions.
* Advertisers adjust budgets and strategies, while the network uses algorithms to optimize ad delivery for better results.

**Example:**

* You play a free mobile game and see a 5-second ad for another popular game.
* The game app provides the ad space (supply side).
* The advertiser is the popular game company, aiming for downloads.
* The ad network matches the ad to the right audience and decides which ad to show.
* If you download the game, the advertiser pays, and the app earns revenue.



## Ad Platform Types and Ecosystem

The ad industry is like a large marketplace with different roles: some provide space, some sell or buy ad inventory, and some manage the rules. Here are common platform types:

### Publisher Platforms

* Owners of users and traffic, essentially the “landlords” of ad space.
* Examples: news website banners, short video pre-rolls, rewarded videos in mobile games.
* They provide ad inventory to ad platforms in exchange for revenue.

### Advertiser Platforms

* The “buyers” who want to promote products or services.
* Examples: e-commerce promotions, new mobile games, new store openings for a beverage brand.
* They place orders through platforms to reach potential users.

### Ad Networks

* Serve as a “middleman marketplace.”
* Aggregate ad space from multiple websites and apps and sell to advertisers.
* Benefits advertisers with “one-stop access” and publishers with easier monetization.
* Example: Many small mobile games show ads via the same ad network.

### Ad Exchanges

* Like a “stock exchange for ads.”
* Automates and transparently handles buying and selling ad inventory, supporting real-time bidding (RTB).
* Example: When you open a news page, dozens of advertisers may bid in 0.1 seconds for the ad slot.

### Demand-Side Platforms (DSP)

* Tools that help advertisers buy ads.
* Automatically determine the best ad placements, bid amounts, and audience targeting.
* Example: An e-commerce brand promoting “back-to-school stationery sets” can use a DSP to target only students.

### Supply-Side Platforms (SSP)

* Tools that help publishers sell ad space.
* Manage inventory, set floor prices, and choose the most profitable buyers.
* Example: A news app maximizes revenue by selling ad space via SSP to multiple networks or exchanges.

### Data Management Platforms (DMP)

* Provide audience insights.
* Collect user behavior data (legally) to help advertisers find the right audience.
* Example: A travel website knows a user recently searched for flights and can target hotel ads via DMP.

Think of the ad ecosystem like a **rental market**:

* **Publishers** = landlords (own ad space)
* **Advertisers** = tenants (have budgets)
* **Ad networks/exchanges** = marketplaces (match buyers and sellers)
* **DSP** = tenants’ agent (helps advertisers pick space)
* **SSP** = landlords’ agent (helps publishers sell space)
* **DMP** = data consultant (advises who fits best)



### Platform Variations: Single vs. Full-Stack Platforms

Most platforms originally serve a **single role**:

* **Single DSP**: Only buys ads for advertisers, optimizing campaigns without managing inventory.
* **Single SSP**: Only sells inventory for publishers, optimizing revenue without direct advertiser interaction.

With industry evolution, **full-stack (dual-role) platforms** have emerged:

#### What Is a Full-Stack Platform?

* Combines **DSP and SSP functions**: buys traffic for advertisers and sells inventory for publishers.
* Think of it as “marketplace + agent” in one platform.

#### Advantages of Full-Stack Platforms

1. **Higher efficiency** – matches supply and demand faster and more accurately.
2. **Data feedback loop** – advertiser and publisher data improve campaign performance and monetization.
3. **Lower intermediaries** – one platform handles both buying and selling, reducing friction.


## Ad Product Types

There are various ad formats, each with unique characteristics and use cases:

| Ad Format                        | User Experience                              | Typical Use Case                   | Example Features                                         |
| -------------------------------- | -------------------------------------------- | ---------------------------------- | -------------------------------------------------------- |
| **Display Ads (Banner/Display)** | Low interference, usually top/bottom of page | News websites, app pages           | Small banner or skyscraper ads on websites or apps       |
| **Native Ads**                   | Blends with content, low disruption          | News, social media                 | In-feed ads, recommended content                         |
| **Search Ads**                   | High-intent users, strong relevance          | Search engines, shopping platforms | Ads based on search keywords, e.g., Google Ads           |
| **Feed Ads**                     | Embedded in content feed, low disruption     | Social media, news apps            | Appears in content lists, e.g., Moments or Toutiao feeds |
| **Video Ads**                    | Highly engaging but time-consuming           | Video platforms, short video apps  | Pre-roll, mid-roll, or post-roll video ads               |
| **Rewarded Ads**                 | User watches voluntarily for rewards         | Games, education apps              | Users earn coins, items, or course benefits              |
| **Interstitial Ads**             | Full-screen, medium disruption               | App page transitions, game levels  | Full-screen ads requiring user interaction               |
| **Pop-up/Floating Ads**          | Interruptive, high disruption                | Promotions, announcements          | Pop-ups or overlays, usually with a close button         |

