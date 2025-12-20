# EPP Market Research

**Last Updated:** 2025-12-17

---

## Industry Estimation Accuracy

### Human Estimator Accuracy (AACE International Standards)

| Estimate Class | Project Definition | Accuracy Range |
|----------------|-------------------|----------------|
| Class 5 (Conceptual) | 0-2% defined | -50% to +100% |
| Class 4 (Feasibility) | 1-15% defined | -30% to +50% |
| Class 3 (Budget) | 10-40% defined | -20% to +30% |
| Class 2 (Control) | 30-70% defined | -15% to +20% |
| Class 1 (Definitive) | 50-100% defined | **-10% to +15%** |

**Source:** [AACE 18R-97 Cost Estimate Classification System](https://web.aacei.org/docs/default-source/toc/toc_18r-97.pdf)

**Key insight:** Even the best human estimates (Class 1, with near-complete project definition) have ±10-15% error range.

### Schedule Estimation Accuracy by Method

| Method | MAPE (Error %) | Source |
|--------|----------------|--------|
| Human/EVM methods | 12-13% | [ASCE](https://ascelibrary.org/doi/abs/10.1061/JCEMD4.COENG-13101) |
| Linear regression | 15%+ | [MDPI](https://www.mdpi.com/2076-3417/13/14/8078) |
| ANN models | 6-12% | [MDPI](https://www.mdpi.com/2076-3417/13/14/8078) |
| DNN-SVR models | 7-9% | [ASCE](https://ascelibrary.org/doi/abs/10.1061/JCEMD4.COENG-13101) |
| NN-LSTM (best) | <5% | [ASCE](https://ascelibrary.org/doi/10.1061/%28ASCE%29CO.1943-7862.0001697) |

---

## Project Overrun Statistics

### Cost Overruns
- **85%** of construction projects experience cost overruns ([Propeller Aero](https://www.propelleraero.com/blog/10-construction-project-cost-overrun-statistics-you-need-to-hear/))
- Average overrun: **16-28%** of project budget ([Contimod](https://www.contimod.com/construction-cost-overrun-statistics/))
- **98%** of megaprojects face cost overruns or delays ([Contimod](https://www.contimod.com/construction-cost-overrun-statistics/))

### Schedule Overruns
- **77%** of projects finish late ([Procore/IDC Survey](https://www.renewcanada.net/5000088747-2/))
- Only **34%** of organizations complete projects on time and budget ([Ravetree](https://www.ravetree.com/blog/top-50-project-management-statistics-for-2025))
- Average slippage: **20 months** from original schedule ([Contimod](https://www.contimod.com/construction-cost-overrun-statistics/))

### Profit Margins
- Construction industry net profit margin: **5-7%** ([CFMA](https://cfma.org/articles/construction-s-lifeline-key-metrics-for-measuring-financial-health))
- Gross profit margin: **20-24%** ([Autodesk](https://www.autodesk.com/blogs/construction/profit-margin-construction/))

### Delay Costs
- Liquidated damages: **$300-$1,000 per day** typical range ([Long International](https://www.long-intl.com/articles/delay-damages/))
- Delays can increase project costs by **20-30%** ([Opteam](https://opteam.ai/delay-damages-in-construction-contract/))

---

## Competitive Landscape

### Major AI Construction Prediction Companies

| Company | Focus | Funding | Key Differentiator |
|---------|-------|---------|-------------------|
| **nPlan** | Schedule prediction, risk | ~$50M+ | "Largest dataset of construction schedules in the world" |
| **ALICE Technologies** | Schedule optimization | $68-76M | Claims $30M savings on $500M projects (6%) |
| **Buildots** | Progress tracking | - | AI + 360° imagery |
| **Mastt** | Cost control, risk | - | Built for project owners |
| **Zepth** | Risk, cost, safety | - | 20+ AI assistants |
| **Drawer AI** | Automated estimating | $5M seed | ML automates estimating |
| **Outbuild** | Scheduling & planning | $11M Series A | - |
| **Oracle Construction Intelligence** | Full suite | Enterprise | Predictive intelligence |

**Sources:**
- [Crunchbase - nPlan](https://www.crunchbase.com/organization/nplan)
- [Crunchbase - ALICE](https://www.crunchbase.com/organization/alice-technologies)
- [TechCrunch - ALICE $30M raise](https://techcrunch.com/2022/06/13/construction-design-platform-alice-technologies-bags-fresh-capital-to-expand/)
- [Construction Dive - Contech funding](https://www.constructiondive.com/news/contech-funding-round-gropyus-document-crunch/733672/)
- [Mastt - AI Companies](https://www.mastt.com/blogs/construction-ai-companies)

### Market Claims from Competitors
- World Economic Forum: AI can reduce costs by **20%** and durations by **15%** ([Keymakr](https://keymakr.com/blog/predictive-power-using-ai-for-construction-cost-estimation-and-risk-management/))
- AI estimations claim **97% accuracy** ([123worx](https://123worx.com/blog/ai-is-revolutionizing-construction-cost-estimation/))
- ALICE claims **6% cost reduction** on large projects ([TechCrunch](https://techcrunch.com/2022/06/13/construction-design-platform-alice-technologies-bags-fresh-capital-to-expand/))

### Funding Context
- AI startups median Series A: **$16M** (vs $7M for non-AI) ([Second Talent](https://www.secondtalent.com/resources/ai-startup-funding-investment/))
- Contech investments grew **32%** in Q3 2024 to $734M globally ([Construction Dive](https://www.constructiondive.com/news/contech-funding-round-gropyus-document-crunch/733672/))

### Market Gap Identified
- **Enterprise focus** - Most competitors target $100M+ megaprojects
- **No pricing transparency** - All use custom/enterprise pricing
- **Mid-market underserved** - Contractors with $10-50M revenue lack affordable options
- **Generic models** - Competitors use one-size-fits-all; no company-specific training

---

## EPP Competitive Position

### Differentiation
1. **Company-specific training** - LoRA adapters learn each client's patterns, terminology, biases
2. **Mid-market focus** - Affordable for $10-50M revenue contractors
3. **Scope Tracker** - Proactive PM report monitoring (not just estimation)
4. **Data ownership** - Clients retain their data; we provide the intelligence layer

### Accuracy Advantage
- Human estimators (Class 1): ±10-15% accuracy
- ML models (literature): 5-9% MAPE
- **Company-specific ML: Estimated 2-5x more accurate than human methods**

The accuracy improvement comes from:
- Learning from company's actual historical outcomes (not industry averages)
- Eliminating cognitive biases (anchoring, optimism bias)
- Consistent application of learned patterns across all estimates
- Continuous improvement as more project data accumulates

---

## Key Statistics for Sales/Pitches

| Stat | Value | Source |
|------|-------|--------|
| Projects with overruns | 85% | Propeller Aero |
| Projects finishing late | 77% | Procore/IDC |
| Average cost overrun | 16-28% | Contimod |
| Human estimate accuracy (best) | ±10-15% | AACE |
| ML estimate accuracy | 5-9% | ASCE/MDPI |
| Industry net margin | 5-7% | CFMA |
| AI cost reduction potential | 20% | World Economic Forum |
| AI duration reduction potential | 15% | World Economic Forum |
