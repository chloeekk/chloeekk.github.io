---
title: "The Underlying Logic of Investing: How to Understand Interest Rates and Returns?"
description: "Master nominal rates, real returns, and performance evaluation in one read. Learn how to break down the risk-free rate and risk premiums, avoid arithmetic vs. geometric mean pitfalls, and use TWR and MWR to distinguish portfolio performance from cash-flow timing effects."
date: 2025-11-05T21:46:32+08:00
draft: false

---


In finance and investing, **interest rates (Rate)** and **returns (Return)** are two foundational concepts. They form the basis of all asset pricing and performance measurement. Understanding their relationship and differences is the first step toward building a robust investment decision framework.

**Essentially:**

* **Interest Rate (Rate):** As the **discount rate**, it determines the **current price of an asset**. It reflects the time value of money and the compensation required for taking on risk.
* **Return (Return):** As the **rate of gain**, it measures the **actual performance** of an investment. It shows how much value an asset generates over time.

The most direct metric for evaluating returns is the **Holding Period Return (HPR)**—the percentage change in an investment’s value over a period. However, HPR only reflects the overall outcome.

A rigorous investment analysis must look beyond a single HPR and examine three core dimensions behind returns:

1. **Time Value:** The cost of time and how **compounding** contributes to long-term returns.
2. **Risk Compensation:** How much of the return compensates for **default, liquidity, and maturity** risks.
3. **Timing of Cash Flows:** How the timing of contributions and withdrawals affects the **actual compound return** realized by investors.



## Part I: Interest Rates — Valuing Assets

### 1. The Nature and Triple Role of Interest Rates: Why Do Returns Exist?

The essence of interest rates lies in the **Time Value of Money**. A sum of money today is worth more than the same amount in the future because today’s money can be invested immediately to generate returns. Therefore, delaying consumption—i.e., investing—requires compensation.

This compensation is rooted in **Time Preference**. Investors prefer **consuming now** to consuming the same amount later. The interest rate is the incentive that persuades investors to give up current consumption and allocate capital to future productive activities.

Suppose **Alex** has 100,000 yuan in cash.

He can:

* **Consume now** (e.g., buy a high-end laptop), or
* **Delay consumption (invest)** by lending 100,000 yuan to **Beth**, a small business owner, for one year.

If Beth returns only 100,000 yuan after a year, Alex gains nothing and **sacrifices the satisfaction of using the money now**. To compensate Alex for this **time preference**, Beth must pay interest—this interest is the compensation for delayed consumption.

#### Clarification: Time Preference vs. Consumption Preference

“Time preference” concerns the trade-off between **present money** and **future money**, not between two different goods at the same time.

If Alex chooses **today** to buy a TV instead of a laptop, that’s a matter of **utility and personal preference**, not time value of money, and has nothing to do with the interest rate.



### The Three Roles of Interest Rates

| Role                           | Definition                                                                                                 | Example                                                                                                                                 |
| :----------------------------- | :--------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------- |
| 1. **Required Rate of Return** | The *minimum* return investors expect for taking on a given risk.                                          | **Alex’s baseline:** After evaluating Beth’s business risk, Alex decides he needs at least **8%** per year to make the loan acceptable. |
| 2. **Discount Rate**           | Used to convert **future cash flows** into **present value**. A higher discount rate lowers present value. | **Valuation:** Beth promises to repay 108,000 yuan in one year. Alex discounts it at 8% to get a present value of 100,000 yuan.         |
| 3. **Opportunity Cost**        | The return forgone from the *best alternative investment* with similar risk.                               | **Comparing options:** If a similar-risk stock fund returns 7%, then lending to Beth at 6% imposes a 7% opportunity cost on Alex.       |

In Alex’s decision:

* **Opportunity cost** (7%) and **required return** (8%) shape his minimum acceptable rate.
* **Discount rate** (8%) determines whether the future cash flow is worth the present investment.



### Equilibrium Interest Rate: Where Supply Meets Demand

The **equilibrium interest rate** is the market rate where **supply of funds** (savings/investment willingness) matches **demand for funds** (borrowing willingness). It shifts with inflation expectations, growth, and monetary policy.

Its relationship with required return:

* **Equilibrium Interest Rate:** A **market concept**, the rate the market collectively agrees is appropriate for a given risk.
* **Required Rate of Return:** An **individual investor’s minimum acceptable rate**.

A rational investor anchors their required return to the market equilibrium rate. The two often converge in practice.



### The Structure of Interest Rates

Everyday quoted rates—bank deposit rates, mortgage rates, etc.—are **nominal interest rates**. They combine time value, inflation expectations, and compensation for different risks:

```
Nominal Rate ≈ Real Risk-Free Rate + Inflation Premium + Risk Premiums
```



### Real Risk-Free Rate

The real risk-free rate is the **pure time value of money**, excluding both inflation and risk of default/liquidity/maturity.



### Inflation Premium

Since future purchasing power changes, investors demand compensation for expected inflation:

```
(1 + r_nominal) = (1 + r_real)(1 + i)
```

At low rates, a simple approximation is:

```
Nominal ≈ Real + Inflation
```

In deflation, the “inflation premium” becomes negative.



### Risk Premiums

1. **Default Risk Premium (DRP)** – compensation for default risk.
2. **Liquidity Premium (LP)** – compensation for difficulty selling the asset quickly at fair value.
3. **Maturity Premium (MP)** – compensation for longer-term price volatility risk.



## Part II: Returns

### Basic vs. Compound Returns: HPR and Compounding

#### Holding Period Return (HPR)

```
HPR = (End-of-Period Value / Beginning-of-Period Value) - 1
```

Includes all cash flows such as dividends or interest.

#### Compounding

Long-term wealth comes from **compound returns**, not single-period HPRs.

For multi-period returns:

```
(1 + RT) = (1 + R1)(1 + R2)...(1 + Rn)
```



### The Pitfalls of Averages: Arithmetic vs. Geometric vs. Harmonic

#### 1. Arithmetic Mean

Best for **expected single-period future returns**, but **overstates** long-term growth.

#### 2. Geometric Mean

Measures **true multi-period compounded performance**.

Always **less than or equal to** the arithmetic mean due to volatility drag.

#### 3. Harmonic Mean

Useful for **cost averaging** and calculating average purchase price when investing fixed amounts over time.

General relationship:

```
Harmonic < Geometric < Arithmetic
```

Outliers can be managed with:

* **Trimmed Mean**
* **Winsorized Mean**



### Performance Attribution: Time-Weighted vs. Money-Weighted

#### Money-Weighted Return (MWR) = IRR

Reflects the investor’s **actual experience**, sensitive to cash flow timing and size.

#### Time-Weighted Return (TWR)

Measures **portfolio manager skill**, neutralizing external cash flows.

```
TWR = [ Product(1 + HPR) ]^(1/n) - 1
```

#### When MWR and TWR differ

* **MWR < TWR:** poor timing (investing more before downturns).
* **MWR > TWR:** good timing (investing more before upturns).



## Part III: Advanced Investing — Real Purchasing Power and Leverage

After understanding how nominal returns are composed and calculated, more mature investors also need to pay attention to two key factors: **preserving purchasing power** and **the capital amplification effect**.

### Real Return: How Much “Purchasing Power” Did You Actually Gain?

The HPR and geometric mean we calculated earlier are **nominal returns**, which do not account for changes in price levels. The true purpose of investing is to increase your **purchasing power**, and the metric that measures this is the **real return**.

**Relationship Between Nominal and Real Returns**

Real return is calculated by subtracting the inflation rate from the nominal return. It answers the question: after accounting for rising prices, how much more can your money actually buy?

**Precise relationship (extended Fisher equation):**

```
(1 + Real Return) = (1 + Nominal Return) / (1 + Actual Inflation Rate)
```

When both returns and inflation are low, a simple approximation is often used:

```
Real Return ≈ Nominal Return - Actual Inflation Rate
```

> Earlier, we mentioned that the 8% Alex charged Beth included an inflation premium based on **expected inflation**. Now assume that Alex indeed earned an 8% nominal return, but the **actual inflation rate** for the year turned out to be 5%.
>
> Alex’s **real return** would be:
>
> ```
> Real Return ≈ 8% − 5% = 3%
> ```
>
> Although Alex earned an 8% nominal return, his **true increase in purchasing power** was only 3%.

**Inflation’s Role in Pricing vs. Returns**

* **Interest rates (pricing benchmark):** **Nominal interest rates** include compensation for **expected** future inflation (inflation premium).
* **Investment returns (actual outcome):** **Real return** adjusts nominal returns using **actual** inflation, reflecting the real change in purchasing power.

### Leveraged Return: The Double-Edged Sword of Amplification

In a basic investment, your return equals the asset’s return. But by using **leverage**, you can borrow funds to invest more, thereby amplifying your final rate of return.

**Leveraged Return** refers to investment returns achieved after using borrowed funds. The formula captures the relationship between asset return, borrowing cost, and leverage ratio.

**Simplified formula:**

```
Leveraged Return = Asset Return + (Asset Return − Borrowing Cost) × (Borrowed Funds / Equity)
```

> Suppose Alex has 100,000 yuan of his own capital but decides to borrow 50,000 yuan from a bank (borrowing cost 4%) and invest the full 150,000 yuan in stocks.
>
> * Assume the stock portfolio earns a **10% asset return**.
> * Alex’s **leveraged return** (approx.) would be:
>
> ```
> 10% + (10% − 4%) × (50,000 / 100,000)
> = 10% + 6% × 0.5
> = 13%
> ```
>
> Alex ends up with a 13% return, higher than the asset’s basic 10%.

However, leverage is a double-edged sword:

* **Amplifies gains:** When asset returns are **higher than borrowing costs**, leverage magnifies profits.
* **Amplifies losses:** When asset returns are **lower than borrowing costs**, especially when returns turn negative, leverage accelerates losses and can quickly erode principal.

