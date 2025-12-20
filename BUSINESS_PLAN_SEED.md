# EPP Business Plan - Seed Client

**Version:** Draft 1.0
**Date:** 2025-12-17

---

## Executive Summary

EPP provides AI-powered project estimation and risk monitoring to reduce construction project overruns. In exchange for seed funding and historical project data, the seed client receives a 5% share of licensing profits as EPP expands to other construction firms.

---

## The Problem: Industry Losses from Overruns

### Industry Statistics
- **85%** of construction projects experience cost overruns ([Propeller Aero](https://www.propelleraero.com/blog/10-construction-project-cost-overrun-statistics-you-need-to-hear/))
- **77%** of projects finish late ([Procore/IDC Survey](https://www.renewcanada.net/5000088747-2/))
- Average cost overrun: **16-28%** of project budget ([Contimod](https://www.contimod.com/construction-cost-overrun-statistics/))
- Only **34%** of organizations complete projects on time and budget ([Ravetree](https://www.ravetree.com/blog/top-50-project-management-statistics-for-2025))
- Construction net profit margins: **5-7%** ([CFMA](https://cfma.org/articles/construction-s-lifeline-key-metrics-for-measuring-financial-health))

### Seed Client Estimated Annual Losses

| Metric | Value |
|--------|-------|
| Annual Revenue | $30M |
| Typical Net Margin (5-6%) | $1.5-1.8M |
| Large Projects Active | ~30 |
| Projects with Overruns (industry 77%) | ~23 |

**Conservative Overrun Estimate:**
- Assume 50% of projects (better than industry average) experience 12% average overrun
- $30M × 50% × 12% = **$1.8M annually lost to overruns**

**Labor Inefficiency from Schedule Slippage:**
- Labor = 60% of costs = $18M annually
- Industry data: delays add 20-30% to project costs
- If 5% of labor budget lost to idle time, rework, overtime: **$900k**

**Total Estimated Annual Loss: $1.8M - $2.7M**

This represents 100-150% of typical net profit margin. The company may be breaking even when they could be highly profitable.

---

## Our Solution

### The Accuracy Gap

| Method | Accuracy | Source |
|--------|----------|--------|
| Human estimators (best case, Class 1) | ±10-15% error | [AACE International](https://web.aacei.org/docs/default-source/toc/toc_18r-97.pdf) |
| Traditional EVM methods | 12-13% MAPE | [ASCE Journal](https://ascelibrary.org/doi/abs/10.1061/JCEMD4.COENG-13101) |
| Generic ML models | 7-9% MAPE | [ASCE Journal](https://ascelibrary.org/doi/abs/10.1061/JCEMD4.COENG-13101) |
| Best-in-class ML (NN-LSTM) | <5% MAPE | [ASCE Journal](https://ascelibrary.org/doi/10.1061/%28ASCE%29CO.1943-7862.0001697) |

**Machine learning trained on company-specific historical data is estimated to be 2-5x more accurate than traditional human estimation methods.**

This improvement comes from:
- Learning from your actual project outcomes, not industry averages
- Your data teaches the model your cost patterns, your delays, your terminology — while additional industry data can fill in holes or gaps
- Eliminating cognitive biases (optimism bias, anchoring to past estimates)
- Consistent pattern recognition across all estimates
- Continuous improvement as more project data accumulates

### Product
AI system with two components:

1. **Estimation Engine** - LLM-based cost/schedule prediction trained on your historical data
2. **Scope Tracker** - Monitors PM reports for early warning signs of projects going off-track

### Value Proposition
- **2-5x more accurate estimates** than human methods alone
- Predict problems before they become losses
- Enable proactive resource reallocation
- Improve schedule accuracy for team planning
- Build institutional knowledge from historical patterns

---

## Business Model

### Seed Client Terms
| Item | Terms |
|------|-------|
| Investment | Seed funding + historical project data |
| Returns | **5% of net licensing profits** in perpetuity |
| Scope | Licenses sold to other construction firms |

### Future Revenue Model
- Per-company licensing fee (annual subscription)
- Custom LoRA adapter training per client
- Optional: API access for integration with existing PM tools

---

## Margin Recapture Estimates

### Area 1: Schedule Accuracy → Labor Optimization
**Potential Savings: 2-3% of labor costs**

| Metric | Value |
|--------|-------|
| Annual Labor Spend | $18M |
| Savings Rate | 2-3% |
| **Annual Savings** | **$360k - $540k** |

How: Accurate duration predictions enable precise crew scheduling. Reduces overtime, idle time, and emergency subcontracting.

---

### Area 2: Early Risk Detection → Avoided Penalties & Rework
**Potential Savings: 1-2% of project revenue**

| Metric | Value |
|--------|-------|
| Annual Project Revenue | $30M |
| Savings Rate | 1-2% |
| **Annual Savings** | **$300k - $600k** |

How: Scope Tracker identifies at-risk projects 2-4 weeks earlier than current methods. Earlier intervention = smaller fixes. Avoid liquidated damages ($300-$1000/day industry standard).

---

### Area 3: Resource Planning → Overhead Reduction
**Potential Savings: 1-2% of overhead costs**

| Metric | Value |
|--------|-------|
| Annual Overhead (40%) | $12M |
| Savings Rate | 1-2% |
| **Annual Savings** | **$120k - $240k** |

How: Better forecasting reduces emergency equipment rentals, rush material orders, and administrative firefighting.

---

## Summary: ROI Projection

| Category | Low Estimate | High Estimate |
|----------|--------------|---------------|
| Labor Optimization | $360k | $540k |
| Risk Detection | $300k | $600k |
| Overhead Reduction | $120k | $240k |
| **Total Annual Savings** | **$780k** | **$1.38M** |
| **As % of Revenue** | **2.6%** | **4.6%** |

### Impact on Profitability

| Scenario | Net Profit |
|----------|------------|
| Current (5-6% margin) | $1.5-1.8M |
| With EPP (add 2.6-4.6%) | $2.3-3.2M |
| **Improvement** | **+50% to +80%** |

---

## Next Steps

1. Receive and analyze historical project data
2. Identify data quality and format requirements
3. Train initial model on seed client data
4. Pilot on 3-5 active projects
5. Measure prediction accuracy vs. actuals
6. Iterate and expand

---

*This document is a working draft. Figures are estimates based on industry averages and will be refined with actual company data.*
