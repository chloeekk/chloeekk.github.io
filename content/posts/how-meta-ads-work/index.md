---
title: "How the Meta Ads System Works"
date: 2026-09-12T16:05:05+08:00
draft: true

---

In Ads Manager, advertisers can choose a campaign objective, set a budget and audience, upload creative, and specify the result they want Meta to optimize for. The interface presents advertising as a collection of configurable settings. Once an ad goes live, however, how does the system decide which impression opportunities it can access, who sees it, and how much budget to use to compete for those impressions?

Advertisers are not buying a predetermined group of people or a fixed set of placements. Whenever an ad opportunity appears on Facebook, Instagram, or another Meta placement, the system filters the ads that are eligible at that moment, predicts what may happen if each ad is shown to the current user, and uses an auction and ranking process to determine delivery. Budget, bidding, audience, creative, and the optimization event all affect this real-time decision process.

[Meta's introduction to Andromeda](https://engineering.fb.com/2024/12/02/production-engineering/meta-andromeda-advantage-automation-next-gen-personalized-ads-retrieval-engine/) shows that its advertising recommendation system uses a multi-stage architecture. It first retrieves relevant candidates from a very large pool of ads, then uses more complex models to predict the value those ads may create for users and advertisers before completing the ranking and delivery process. Understanding this decision chain helps media buyers see what each campaign setting actually changes.

## From an Ad Request to an Impression: The Delivery Process

When someone refreshes Feed, browses Stories, or watches Reels, the page may contain an opportunity to show an ad. For the advertising system, this generates an ad request. The delivery process can be simplified as follows:

```text
An ad opportunity appears
→ Filter for eligible ads
→ Retrieve relevant ad candidates
→ Predict the probability of the desired action
→ Calculate Total Value and rank the candidates
→ Deliver based on budget and pacing
→ Use subsequent user behavior as new feedback
```

![Meta ad delivery decision chain: after an impression opportunity appears, the system checks eligibility, retrieves candidate ads, predicts action probabilities, runs the auction and ranking process, controls pacing, and delivers the selected ad. Subsequent user behavior becomes feedback for future predictions and delivery.](meta-ad-delivery-decision-chain.svg)

1. **Eligibility defines the participation boundary.** The system checks location, age, placement, review status, schedule, budget, billing, and compliance requirements. Ads that do not qualify cannot enter the current opportunity.
2. **Candidate Retrieval narrows the pool.** The number of potentially eligible ads is enormous, so the system first retrieves a smaller set of more relevant candidates before passing them to more complex ranking models. In its public material about Andromeda, Meta describes reducing tens of millions of ads to a few thousand candidates.
3. **Prediction estimates the desired action.** The system predicts the likelihood that the optimization event will occur if the current ad is shown to the current user. Optimizing for App Install, KYC Complete, or Purchase changes both the prediction target and the audience ultimately reached.
4. **The auction compares Total Value.** Candidate ads are evaluated using Advertiser Bid, Estimated Action Rate, and Ad Quality. Bid is only one component.
5. **Pacing controls participation over time.** The system considers budget, remaining time, bid strategy, and the current opportunity when deciding when to enter auctions and when to reserve budget for later opportunities.
6. **Feedback updates future decisions.** A user may ignore the ad, click it, install the app, or complete a deeper event. Behavior observed on Meta, along with events supplied through a [data flow built with App SDK, MMP, Pixel, or CAPI](/posts/meta-ads-data-tracking/), can become feedback for later predictions.

This process does not automatically teach Meta the full commercial value of a customer. If a campaign optimizes for Install, the system learns who is more likely to install. If First Transaction is what actually matters to the business, the advertiser still needs product-funnel and internal data to determine whether those installs created value. That target should first be defined through the [business model, conversion journey, and unit economics](/posts/meta-ads-business-strategy/).

## Total Value: Why the Highest Bid Does Not Always Win

The auction compares the value of candidate ads for the current impression opportunity. Meta's public framework contains three core components: Advertiser Bid, Estimated Action Rate, and Ad Quality.

```text
Total Value = Advertiser Bid × Estimated Action Rate + Ad Quality
```

[Meta's explanation of its ad auction and Total Value](https://ai.meta.com/blog/advertising-fairness-variance-reduction-system-vrs/) states that the ad with the highest Total Value is more likely to win the impression. Increasing the bid therefore changes only one part of the auction; the probability of the desired action and the expected ad experience also matter.

### Advertiser Bid: The Value Used to Compete for a Result

Advertiser Bid represents the value an advertiser is prepared to place on the desired action. With automated bidding, a media buyer does not manually submit a price for each impression. The system participates in auctions according to the bid strategy, budget, and available opportunity.

Three concepts need to remain separate. Budget defines how much money can be used during the delivery period. Bid Strategy determines how the system balances cost and scale. Advertiser Bid is the auction component that enters the Total Value calculation. A larger budget can create access to more opportunities, but it does not automatically make each auction entry more competitive.

### Estimated Action Rate: The Probability of the Desired Action

Estimated Action Rate can be understood as the system's prediction of how likely this user is to complete the desired action after seeing this ad. It depends on the user, ad, delivery context, and optimization event; it is not a permanent score attached to the creative.

```text
Estimated Action Rate
= f(user signals, ad signals, delivery context, optimization event, historical feedback)
```

Here, `f` simply indicates that several inputs contribute to the prediction. It is not an actual function disclosed by Meta, and advertisers cannot view an individual user's prediction score.

Estimated Action Rate is not the same as CTR. When a campaign optimizes for Link Click, click probability is close to the desired outcome. When it optimizes for KYC Complete or Purchase, the system predicts the corresponding event. An ad can generate a high CTR while producing a low rate of deeper conversion.

### Ad Quality: Including the Ad Experience in Ranking

Ad Quality allows the auction to consider the experience an ad may create for the user. Meta may consider user feedback and low-quality attributes such as withheld information, sensationalized language, or engagement bait.

Ad Quality has a different meaning from Policy Review. Passing review makes an ad eligible to run; it does not guarantee strong quality in the auction. Production polish alone is not a measure of Ad Quality either. A simple creator-style video that is clear and relevant can be more competitive than an expensive ad that lacks relevance.

This is especially important for fintech advertising. Claims about returns, presentation of risk, fee disclosure, and product eligibility affect both compliance and trust. Exaggerated promises may attract clicks while also producing negative feedback, low-quality traffic, and weaker downstream conversion.

### Total Value Changes With Each Impression Opportunity

When the user, placement, time, competitors, or optimization event changes, Estimated Action Rate and the relative ranking can change as well. The simulated data below illustrates how the three components can jointly influence the result.

| Candidate ad | Bid index | Estimated Action Rate index | Ad Quality index | Illustrative Total Value | Rank |
| --- | ---: | ---: | ---: | ---: | --- |
| Ad A | 7 | 8 | 6 | 62 | 1st |
| Ad B | 9 | 5 | 7 | 52 | 3rd |
| Ad C | 6 | 9 | 2 | 56 | 2nd |

Ad B has the highest bid index but a lower estimated action rate. Ad C has the highest estimated action rate, but weaker Ad Quality reduces its overall result. For a different user, the Estimated Action Rates of all three ads may be reordered and another ad may win.

When Meta says it is finding people who are more likely to convert, it is not first creating a fixed list of users. The system continually compares the value of the “ad–user–desired action” combination within each specific impression opportunity.

## How Machine Learning Finds People More Likely to Convert

Meta cannot know in advance which individual user will convert. It uses available data to estimate the probability of different outcomes, then prioritizes budget toward impression opportunities that appear more likely to generate the optimization event.

Models can use signals about the user and delivery context, the ad and creative, advertiser-supplied events, and campaign settings such as audience, budget, and bidding. [Meta's explanation of sequence learning in advertising](https://engineering.fb.com/2024/11/19/data-infrastructure/sequence-learning-personalized-ads-recommendations/) also shows that the order and timing of behavior can contribute to representations of user interests and ad preferences. These signals become probability estimates, not fixed rules that a media buyer can inspect.

### The Optimization Event Defines What Success Means

The optimization event selected by the advertiser becomes the result the system prioritizes predicting and acquiring. For a fintech app, different events provide different definitions of success:

| Optimization event | People the system is more likely to find | Main advantage | Main risk |
| --- | --- | --- | --- |
| App Install | People willing to download the app | Higher event volume and faster feedback | Install may not predict KYC completion or trading |
| Registration | People willing to create an account | Closer to product use than Install | Low-friction registration may attract low-quality users |
| KYC Complete | People willing and able to complete identity verification | Closer to a qualified financial customer | Lower volume; the verification process affects feedback |
| First Deposit | People willing to fund the account | More closely related to commercial value | Slower feedback; payment flow affects results |
| First Transaction | People who begin using the core transaction feature | Closer to revenue and long-term value | Sparse events and longer delay |

Deeper events are usually more closely related to business value, but they also provide fewer training examples. The choice needs to balance business relevance, event volume, feedback speed, and data quality.

Meta can only optimize around the success label it receives. If a campaign selects KYC Complete, the system tries to improve its ability to acquire that event. First Transaction Rate, Retention, and LTV among those KYC users still need to be validated with business data.

### Learning Phase Describes Feedback Accumulation, Not Profitability

After a new ad set is launched or a significant edit is made, Ads Manager may show the Learning status. The system is collecting feedback under the current creative, audience, optimization event, budget, and bidding conditions, so results and Cost per Result are more likely to fluctuate.

Learning Phase does not mean Meta trains a separate model from scratch for every ad set. Based on Meta's published multi-stage recommendation architecture, a more useful interpretation is that the platform already has models trained on large-scale data, while the new delivery unit still needs to calibrate delivery under its current conditions. Meta has not disclosed the full internal implementation of Learning Phase.

[Meta's guidance on Learning Phase](https://www.facebook.com/business/help/112167992830700) commonly uses roughly 50 optimization events per ad set within seven days as a reference for stable delivery. This number can help assess whether event volume and budget are aligned; it is not a universal profitability threshold or a guaranteed algorithmic switch.

```text
Expected weekly optimization events
= Daily Budget × 7 ÷ expected Cost per Optimization Event
```

If the daily budget is $100 and the expected Cost per KYC Complete is $40, the ad set can generate only about 17–18 KYC completions per week. If the account runs four similar ad sets, the limited feedback is divided even further.

Learning Limited indicates that the system is unlikely to receive enough events for stable delivery. It does not replace a business assessment. A high-value campaign may generate only a few First Transactions per week while maintaining an acceptable CAC and LTV. An Install campaign that has left Learning Phase may still acquire many users who never complete KYC or make a transaction.

![Comparison between Meta learning status and fintech app business outcomes: Ad Set B is Learning Limited and has fewer KYC completions, yet it achieves the lowest Cost per First Transaction and highest D90 Contribution LTV. Ad Set C is Active and has the lowest Cost per KYC Complete, but weaker transaction rate and customer value.](learning-status-business-outcome.svg)

In this simulated example, Ad Set B has fewer KYC Complete events and is therefore Learning Limited, but its First Transaction Rate and D90 Contribution LTV meet business requirements. Ad Set C is Active and has a lower platform-reported Cost per KYC Complete, yet its downstream customer quality is weaker. Delivery status describes the feedback conditions; internal data determines whether the results are worth buying.

Changing the optimization event, audience, creative, or bid strategy can alter the prediction target, candidate space, or auction conditions and may restart learning. Media buyers should avoid frequent edits without a clear hypothesis, rely on the status currently shown in Ads Manager, and avoid treating heuristics such as “never increase the budget by more than 20%” as universal platform rules.

## How Audience Targeting Provides Constraints and Signals

Meta's audience settings do not select a fixed list of people in advance. They define who can be reached and provide directions for finding users. The system then combines creative, the optimization event, and historical feedback to predict and rank eligible impression opportunities.

### Controls Define Boundaries the System Cannot Cross

Location, minimum age, exclusions, and compliance eligibility are generally constraints the system must obey. For example, a fintech app may operate only in licensed markets, require users to meet a minimum age, and exclude existing customers. Those conditions should be implemented through the available Audience Controls.

| Source of constraint | Fintech app example | Consequence of an incorrect setting |
| --- | --- | --- |
| Service coverage | Target only countries or regions where acquisition is permitted and the product is available | Users install but cannot open or use an account |
| User eligibility | Minimum age or another necessary requirement | Shallow events convert, but users cannot pass later checks |
| Acquisition definition | Exclude existing customers, employees, and test accounts | New-customer budget is spent on existing users |
| Compliance requirements | Product category, advertising policy, and local regulation | Rejected ads, account restrictions, or ineligible customers |

These settings directly change which auctions the ad can enter. Each restriction should have a clear business basis. Adding constraints without such a basis reduces the system's room to find effective opportunities.

### Suggestions Provide Direction; Audience Size Defines Exploration Space

Interest, Lookalike Audience, Custom Audience, and other inputs may be used as suggestions within Advantage+ Audience. They can give the system an initial direction while allowing it to explore outside the suggested range when doing so is expected to improve results. Which settings act as Controls or Suggestions depends on the campaign interface currently available. [Meta Blueprint's Advantage+ Audience course](https://trainingworkshops.facebookblueprint.com/student/path/253166-advantage-plus-audiences) likewise discusses data sources, Detailed Targeting, Custom Audiences, and Lookalike Audiences within one audience strategy.

The value of a signal depends on its source behavior and data quality. An audience source built from First Transaction is usually more closely related to business value than one built from Install alone. A large Lookalike source made up of low-value registrants may continue directing the system toward people who are easy to register.

A Broad Audience creates a larger candidate space, but the system still selects individual opportunities using Estimated Action Rate and Total Value. Delivery is neither random nor evenly distributed. A Narrow Audience may look more specific, yet it can exclude potentially valuable users, reduce the number of available auctions, and make sparse deep events even harder to accumulate.

A practical question is whether a targeting condition excludes people who cannot create value, or merely expresses the advertiser's assumption about an ideal customer.

### Creative and the Optimization Event Also Shape the Delivered Audience

Creative attracts people with different needs, risk preferences, and levels of awareness. The optimization event tells the system which response is worth finding again. For example, two ads may use the same Broad Audience: creative that emphasizes easy registration may generate more registrations, while an ad that clearly explains transaction features, fees, and eligibility may have a lower CTR but attract more users who complete KYC and make a first transaction.

The delivered audience is jointly shaped by Audience Controls, audience suggestions, creative, the optimization event, budget, and the auction. Audience Size is a potential range; Delivered Audience is the outcome created under actual delivery conditions.

This article does not need to reproduce the full measurement process. The essential step is to connect Meta delivery with business outcomes: examine which placements and users the budget actually reached, then compare Registration, KYC Complete, First Transaction, and downstream value. If low-cost registrations concentrate among users who never transact, the advertiser should review the optimization event, creative message, and necessary controls rather than scale solely on platform CPA.

![Relationship between Meta audience controls, audience signals, and algorithmic delivery: Audience Controls use service location, minimum age, exclusions, and policy eligibility to define Audience Size. Custom Audience, Lookalike, Interest, Creative, and the Optimization Event provide signals. Meta then uses Estimated Action Rate, Total Value, budget, and auction conditions to form the Delivered Audience.](audience-controls-signals-delivery.svg)

## How Budget, Bid Strategy, and Pacing Determine Spend

After a budget is set, Meta does not buy a fixed number of impressions or conversions at a fixed price. Competition, Estimated Action Rate, and Ad Quality can differ for every opportunity. The system must decide whether the current opportunity is worth entering while reserving enough budget for later opportunities.

| Campaign input | Question it answers | Main effect |
| --- | --- | --- |
| Performance Goal / Optimization Event | What result should the system obtain? | Defines the behavior predicted and optimized |
| Bid Strategy | Under what cost or value conditions should the system enter auctions? | Determines the bidding approach and acceptable opportunities |
| Budget | How much can be spent during the delivery period? | Determines the overall scale available for buying and exploration |

Pacing turns these inputs into a spending pattern over time.

### Budget Provides Resources; Bid Strategy Sets Participation Conditions

Budget defines the resources available to the delivery system. It cannot create qualified opportunities by itself. A campaign may underdeliver even with a large budget when the audience is too narrow, cost controls are too strict, creative response is weak, or the optimization event is difficult to generate.

Bid Strategy determines whether the system prioritizes result volume, conversion value, or a specific cost or return constraint. [Meta's guidance on bid strategies](https://www.facebook.com/business/help/1619591734742116) describes approaches centered on spend, goals, or manual control. Tighter constraints generally reduce the number of auctions the system can accept. When a target is substantially below what the market can deliver, underdelivery and lower result volume are common outcomes.

For a fintech app, the cost constraint also needs to match the business meaning of the optimization event. A Cost per KYC Complete Goal should be derived from the historical relationship between KYC completion, First Transaction, revenue, and payback. The final Target CAC cannot be substituted directly for the appropriate cost of an intermediate event.

### Pacing Allocates Budget Between Current and Future Opportunities

Pacing considers remaining budget, remaining time, bid strategy, expected opportunities, and current predicted value when deciding how aggressively to enter auctions.

```text
Whether to enter the current auction, and how aggressively
= remaining budget + remaining time + expected opportunities + bid strategy + current predicted value
```

This is a conceptual model for media buyers, not an actual formula disclosed by Meta. The system may spend faster when more high-predicted-value users are available and slow down when competition rises, qualified opportunities decline, or cost controls are difficult to satisfy. An hourly or single-day spend curve is therefore insufficient to diagnose pacing; the full delivery period, event delay, and business outcomes also matter.

### Why CPA Can Increase After a Budget Increase

A campaign achieving a low CPA at its current budget has found relatively favorable opportunities at that scale. To generate more results after a budget increase, the system usually needs to enter more auctions and expand into marginal opportunities with higher costs or lower prediction confidence.

Suppose an ad set spends $100 per day and generates five KYC Complete events at an average cost of $20. After the budget increases to $200, it generates eight KYC Complete events:

```text
Original results: $100 ÷ 5 = $20
Overall result after scaling: $200 ÷ 8 = $25
Marginal cost of the additional results: ($200 - $100) ÷ (8 - 5) = $33.33
```

Budget increased by 100%, result volume by 60%, and Average CPA from $20 to $25. The campaign generated more results, but the Marginal CPA of the three additional results was $33.33. Whether the scale-up is worthwhile depends on the overall cost relative to Target CAC and on the First Transaction Rate and LTV of the additional KYC users.

A budget change may also alter pacing, the auctions available to the campaign, and learning status. A fixed rule such as “increase budget by no more than 20%” cannot replace account-level validation. A more reliable approach is to define acceptable cost and customer-quality ranges in advance, scale in stages, and allow deeper events enough time to mature.

![Meta Budget, Bid Strategy, and Pacing decision diagram: Performance Goal, Bid Strategy, and Budget enter the pacing process, which dynamically selects auctions. Simulated data shows that increasing budget from $100 to $200 raises results from five to eight and Average CPA from $20 to $25, while the Marginal CPA of the additional results is $33.33.](budget-bid-strategy-pacing.svg)

## Conclusion: What Media Buyers Can Actually Control

Meta ad delivery can be summarized as a continuous decision loop. Constraints determine which opportunities an ad can enter. Retrieval identifies candidate ads. Models predict the desired action. The auction compares Total Value. Pacing allocates budget. User behavior then becomes feedback for future decisions.

Media buyers cannot see the candidate pool, prediction score, or final Total Value for each auction, but they can change the inputs supplied to the system:

| Controllable input | Main effect on delivery | Question for the media buyer |
| --- | --- | --- |
| Optimization Event | Defines the result the system predicts and learns | Is the event close to business value, with enough stable feedback? |
| Creative | Influences user response, ad signals, and experience | Does the creative attract people likely to complete the desired action? |
| Data feedback | Supplies feedback about the desired behavior | Are events accurate, timely, and complete? |
| Audience Controls | Define the user and auction boundaries | Which constraints are necessary, and which are assumptions? |
| Placement and format | Change the delivery contexts available | Is the creative suitable for the placements receiving delivery? |
| Bid Strategy | Defines the trade-off between cost, value, and scale | Do the constraints match the business's acceptable range? |
| Budget | Determines the scale of exploration and buying | Can additional budget still acquire valuable marginal results? |

These variables need to be evaluated as one system. Expanding the audience creates more candidate opportunities, but additional users may not respond when creative coverage is weak. A deeper optimization event can improve alignment with business value while increasing volatility when events are sparse. Relaxing cost controls can restore spend while also increasing Marginal CPA.

The practical value of understanding the system is a more reliable diagnostic order. When a campaign cannot spend, check eligibility boundaries, audience space, cost controls, and event feedback. When costs rise, consider the auction environment, creative response, pacing, and the quality of incremental users together. When platform results appear to improve, use internal CAC, Retention, LTV, and Payback Period to determine whether the business outcome improved as well.
