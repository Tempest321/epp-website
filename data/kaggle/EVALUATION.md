# Kaggle/HuggingFace Construction Dataset Evaluation

**Date:** 2025-12-20

## Summary

**None of the evaluated datasets are suitable for building cost estimation.**

---

## Datasets Evaluated

### 1. construction_estimates.csv (sasakitetsuya)
- **Rows:** 1,000
- **Columns:** Material_Cost, Labor_Cost, Profit_Rate, Discount_or_Markup, Policy_Reason, Total_Estimate
- **Verdict:** ❌ USELESS
- **Reason:** Synthetic formula data. Total = Material + Labor + Profit - Discount. No project features. Just teaching basic arithmetic.

### 2. ConstructionData.csv (teejgomez)
- **Rows:** ~8,750 projects (as columns)
- **Structure:** DOT highway bid items as rows, project quantities in cells
- **Verdict:** ❌ USELESS FOR BUILDINGS
- **Reason:** Highway/road construction bid data (clearing, grubbing, excavation). Not building construction. No cost totals.

### 3. building_dataset.csv (devitachi)
- **Rows:** 1,000
- **Columns:** Area, Height, Age, Num_Floors, Location, Material, Label
- **Verdict:** ❌ USELESS
- **Reason:** "Label" is a classification (0-4), not a price. No actual cost data.

### 4. Construction_Dataset.csv (programmer3)
- **Rows:** 1,000
- **Columns:** Labor Requirements, Equipment Usage, Material Quantities, Project Duration, Best Cost, etc.
- **Verdict:** ❌ USELESS
- **Reason:** Synthetic/random data. Correlations between features and "Best Cost" are near zero (~0.02-0.05). No predictive relationship.

### 5. construction_spending.csv (CORGIS)
- **Rows:** 170
- **Structure:** Monthly aggregate US construction spending by sector
- **Verdict:** ❌ NOT PROJECT-LEVEL
- **Reason:** Macro-economic data, not individual project costs.

### 6. HuggingFace bridge_construction (XXCCF)
- **Verdict:** ❌ EMPTY
- **Reason:** Dataset contains no data files.

---

## Conclusion

**Open construction cost data doesn't exist in usable form.**

The construction industry guards cost data closely. What's publicly available is either:
1. Synthetic garbage (random numbers, simple formulas)
2. Wrong domain (highways, not buildings)
3. Aggregate statistics (not project-level)
4. Classification labels instead of actual costs

---

## Recommendation

Proceed with **calibrated formula calculator** approach using industry benchmarks (RSMeans, ENR indices). Real ML will require the seed client's actual project data.
