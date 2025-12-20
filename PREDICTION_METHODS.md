# Prediction Methods for Construction Cost/Schedule Estimation

**Last Updated:** 2025-12-19

This document summarizes research on machine learning methods for achieving maximum prediction accuracy in construction cost and schedule estimation.

---

## The Accuracy Hierarchy

| Method | Typical MAPE | Best Case | Data Required | Compute |
|--------|-------------|-----------|---------------|---------|
| Human Expert | 10-25% | 10% | Experience | None |
| Linear Regression | 15-30% | 12% | 50+ projects | Minimal |
| Random Forest | 8-15% | 6% | 200+ projects | Low |
| XGBoost/Gradient Boosting | 6-12% | 5% | 200+ projects | Low |
| Neural Network (MLP) | 8-15% | 6% | 500+ projects | Medium |
| LSTM (time-series) | 5-10% | <5% | 500+ with temporal | Medium |
| Hybrid CNN-LSTM | 5-8% | 3% | 1000+ | Medium-High |
| Transformer | 5-10% | 4% | 1000+ | High |
| Ensemble (Stacking) | 4-8% | 3% | 500+ | Medium |
| Fine-tuned LLM | 5-15% | 5% | 1000+ | Very High |

---

## Level 1: Traditional ML (Easiest, Often Best ROI)

### 1A. XGBoost / Gradient Boosting

**What it is:** Builds many small decision trees sequentially, where each tree corrects the errors of the previous ones.

**Why it works for construction:**
- Handles missing data naturally (common in construction records)
- Captures non-linear relationships (a 10,000 sqft building doesn't cost 10x a 1,000 sqft building)
- Built-in feature importance (tells you WHAT matters)

**Typical architecture:**
```
Input Features (20-50 variables)
    |
100-500 Decision Trees (each ~6 levels deep)
    |
Weighted combination -> Cost/Duration prediction
```

**Performance:** Research shows XGBoost achieves R² of 0.988 and outperforms other ML methods for bridge construction costs.

**Compute:** Trains in seconds to minutes on a laptop. No GPU needed.

**Key insight:** Per ASCE research, XGBoost was the most accurate method across 20 tested algorithms.

---

### 1B. Random Forest

**What it is:** Builds many decision trees in parallel (not sequentially like XGBoost), each on a random subset of data/features, then averages predictions.

**Why it works:**
- Very robust to outliers
- Hard to overfit
- Naturally provides uncertainty estimates (variance across trees)

**Performance:** Highway cost study found Random Forest was 18.8% more accurate than neural networks and 23.4% better than SVM.

**When to use:** When you have messy real-world data and need something robust that "just works."

---

## Level 2: Deep Learning (More Power, More Data Needed)

### 2A. Standard Neural Network (MLP)

**What it is:** Layers of interconnected "neurons" that learn patterns through backpropagation.

```
Input (50 features)
    |
Hidden Layer 1 (256 neurons) -> ReLU
    |
Hidden Layer 2 (128 neurons) -> ReLU
    |
Hidden Layer 3 (64 neurons) -> ReLU
    |
Output (cost, duration)
```

**Why it can beat tree methods:**
- Can learn extremely complex non-linear patterns
- Scales better with more data
- Can jointly predict cost AND duration (multi-task learning)

**Why it might NOT beat tree methods:**
- Needs more data (500+ samples minimum)
- Easier to overfit
- Less interpretable
- Requires careful tuning

**Performance:** Studies show ANNs achieve 85-99% accuracy across industries, but results vary widely based on data quality.

---

### 2B. LSTM (Long Short-Term Memory)

**What it is:** A type of neural network designed for sequential data that can "remember" important information from earlier in a sequence.

**The key insight:** Construction projects unfold over time. Cost indices change monthly. Material prices fluctuate. LSTM captures these temporal patterns.

```
Month 1 data -> [LSTM Cell] -> hidden state ->
Month 2 data -> [LSTM Cell] -> hidden state ->
Month 3 data -> [LSTM Cell] -> hidden state ->
...
Final hidden state -> Dense layers -> Prediction
```

**Why it achieves <5% MAPE:**
- Learns seasonal patterns (concrete more expensive in winter)
- Captures market trends (labor costs rising over months)
- Accounts for project phase dependencies (foundation affects framing timing)

**Requirements:**
- Time-series data (monthly/quarterly cost indices, schedule updates)
- 500+ sequences minimum
- Each sequence = one project's progression over time

**Compute:** A 256-unit LSTM trains in minutes, not hours.

---

### 2C. Hybrid CNN-LSTM

**What it is:** CNN extracts features from structured data, LSTM processes temporal sequences.

```
Static Features (size, type, location)
    |
CNN Feature Extractor -> Feature Vector
    |
    |  +  Time-Series Data (cost indices over time)
    |         |
    |    LSTM Temporal Processor
    |         |
Concatenate both ->
    |
Dense Layers -> Cost/Duration Prediction
```

**Why this combination:**
- CNN captures spatial/categorical patterns (building type, region)
- LSTM captures temporal patterns (market trends, project phases)
- Combination gets the best of both worlds

**Performance:** Hybrid models consistently outperform single-architecture models in comparative studies.

---

### 2D. Transformer / Attention Models

**What it is:** The architecture behind GPT/BERT. Uses "attention" to weigh which parts of the input are most relevant.

**How attention helps construction prediction:**

Instead of treating all input features equally, attention learns:
- "For hospitals, labor cost matters 3x more than materials"
- "For highway projects, soil conditions dominate duration"
- "When inflation is high, ignore historical averages"

```
All Input Features
    |
Self-Attention: "What's most important here?"
    |
Weighted combination of features
    |
Feed-Forward Network
    |
Prediction
```

**Advantages:**
- Provides interpretability through attention weights
- Captures complex feature interactions
- Scales to very large datasets

**Disadvantages:**
- High computational cost for long sequences
- Needs lots of data to train from scratch
- Overkill for small datasets

---

## Level 3: Advanced Techniques (Maximum Accuracy)

### 3A. Ensemble Methods (Stacking)

**What it is:** Train multiple different models, then train a "meta-model" to combine their predictions optimally.

```
Training Data
    |
+------------------------------------------+
| XGBoost -> Prediction 1                  |
| Random Forest -> Prediction 2            |
| Neural Network -> Prediction 3           |
| LSTM -> Prediction 4                     |
+------------------------------------------+
    |
All predictions become NEW features
    |
Meta-Model (Ridge Regression) -> Final Prediction
```

**Why it works:**
- Different models make different errors
- Meta-model learns which model to trust in which situations
- Stacking reduces both bias AND variance

**Performance:** Stacking "typically yields performance better than any single trained model."

**Practical tip:** Research on construction cost stacking shows heterogeneous ensembles (mixing different model types) outperform homogeneous ones.

---

### 3B. Quantile Regression (Prediction Intervals)

**What it is:** Instead of predicting a single number, predict the 10th, 50th, and 90th percentiles.

**Why this matters for construction:**

A point estimate of "$5M" is less useful than:
- "10% chance it's below $4M"
- "50% chance it's around $5M"
- "10% chance it exceeds $7M"

```
Input Features
    |
Model predicts THREE values:
    - Q10 (lower bound): $4.0M
    - Q50 (median): $5.0M
    - Q90 (upper bound): $7.0M
    |
90% prediction interval: [$4.0M - $7.0M]
```

**Implementation:** Use pinball loss instead of MSE:
```python
def quantile_loss(y_true, y_pred, quantile):
    error = y_true - y_pred
    return max(quantile * error, (quantile - 1) * error)
```

**Why it improves decisions:** Quantile regression provides "valid prediction intervals" that capture uncertainty, essential for construction risk management.

---

### 3C. Multi-Task Learning (Joint Cost + Duration)

**What it is:** Train one model to predict BOTH cost and duration simultaneously.

**Why this improves accuracy:**

Cost and duration are correlated. A model learning both tasks shares knowledge:
- "Delays usually increase costs"
- "Larger projects take longer AND cost more"
- "This contractor is slow but cheap"

```
Shared Layers (learn common patterns)
    |
+------------------------------------+
|   Cost Head    |   Duration Head   |
|   (predicts $) |   (predicts months)|
+------------------------------------+
```

**Performance:** Green building study achieved MAPE of 0.06 for cost and 0.07 for duration using joint DNN-SVR models.

**Key insight:** MTL research shows that "solving tasks jointly rather than independently can improve prediction accuracy" - but only when tasks are related (cost and duration definitely are).

---

### 3D. Transfer Learning / Domain Adaptation

**What it is:** Pre-train on large general dataset, fine-tune on your specific data.

**Why it matters for EPP:**

You have limited company-specific data (~390 projects). But:
- General construction patterns exist across all companies
- Pre-train on public datasets (NYC permits, etc.)
- Fine-tune on company-specific data

```
Step 1: Pre-train on 50,000 public construction records
    |
Model learns: "Larger = more expensive, concrete = slower"
    |
Step 2: Fine-tune on 390 company-specific records
    |
Model adapts: "THIS company's projects in Texas cost 15% less"
```

**Research support:** Construction-specific BERT pre-trained on construction management corpora outperformed general models.

---

### 3E. Feature Engineering + SHAP Interpretability

**What it is:** Carefully construct input features + use SHAP to understand what matters.

**Most important features identified in research:**

| Category | Key Features |
|----------|-------------|
| Size | Total floor area, number of floors, building height |
| Design | Compactness ratio, percentage of openings |
| Project | Contract type, tendering type, provisional sum |
| Market | Inflation rate, material price indices |
| Location | Region, soil conditions, labor market |

**SHAP (SHapley Additive exPlanations):**

Shows exactly how much each feature contributes to each prediction:
```
Base prediction: $5.0M
+ Floor area (large): +$1.2M
+ Location (NYC): +$0.8M
+ Contract type (fixed): -$0.3M
+ Market conditions: +$0.5M
= Final prediction: $7.2M
```

**Why this matters:** SHAP "helps explain how each feature influences predictions" and enables feature selection for simpler, more accurate models.

---

## Why Frozen LLM Approach Plateaus at ~45% MAPE

Our current approach (frozen TinyLlama + regression head) has fundamental limitations:

| Issue | Impact |
|-------|--------|
| **Frozen weights** | LLM can't learn task-specific features |
| **Single-token representation** | Throws away 99% of sequence information |
| **MSE loss** | Pushes predictions toward mean, ignores outliers |
| **Simple regression head** | 3 linear layers can't compensate for frozen backbone |
| **Text-only input** | Missing structured features that dominate predictions |

**Research confirms:** "Frozen models lead to poor performance... severely limits exploitation of large encoders."

---

## Recommended Architecture for EPP

Given seed client with ~390 projects:

```
+------------------------------------------------------------+
|                    INPUT PROCESSING                         |
+------------------------------------------------------------+
|  Text Description -> Fine-tuned BERT/LLM -> Feature Vector |
|  Structured Data (size, type, location) -> Normalized      |
|  Time Series (if available) -> LSTM Encoder                |
+------------------------------------------------------------+
                           |
+------------------------------------------------------------+
|                    ENSEMBLE LAYER                           |
+------------------------------------------------------------+
|  XGBoost (handles structured features)                     |
|  Neural Network (captures complex interactions)            |
|  LSTM (if temporal data available)                         |
+------------------------------------------------------------+
                           |
+------------------------------------------------------------+
|                    META LEARNER                             |
+------------------------------------------------------------+
|  Stacking: Ridge Regression combines all predictions       |
|  Multi-task: Joint cost + duration prediction              |
|  Quantile: Outputs 10th, 50th, 90th percentile            |
+------------------------------------------------------------+
                           |
                    Final Prediction
              Cost: $5.2M [+/-$0.8M at 80% CI]
              Duration: 14 months [+/-2 months]
```

### Expected Accuracy by Approach

| Approach | Expected MAPE | Effort |
|----------|--------------|--------|
| Current (frozen LLM + head) | 45-50% | Done |
| XGBoost on structured features | 8-15% | Low |
| + Feature engineering | 6-12% | Medium |
| + Ensemble stacking | 5-10% | Medium |
| + Fine-tuned LLM for text | 5-8% | High |
| + LSTM for temporal | <5% | High |

**Key insight:** A simple XGBoost on structured features would likely beat the frozen LLM approach immediately - IF structured data is available.

---

## Implementation Priority

1. **Immediate (when seed client data arrives):**
   - Extract structured features from project records
   - Train XGBoost baseline
   - Implement SHAP for interpretability

2. **Short-term:**
   - Add ensemble layer (stack XGBoost + Random Forest + MLP)
   - Implement quantile regression for prediction intervals
   - Multi-task learning for joint cost/duration

3. **Long-term:**
   - Fine-tune domain-specific BERT on construction text
   - Add LSTM if temporal data available
   - Transfer learning from public construction datasets

---

## References

- XGBoost Performance: https://jeeemi.org/index.php/jeeemi/article/view/799
- Random Forest vs NN: https://www.researchgate.net/publication/344426621
- Stacking for Construction: https://www.mdpi.com/2076-3417/12/19/9729
- Multi-task Learning: https://ascelibrary.org/doi/abs/10.1061/JCEMD4.COENG-13101
- Domain-specific BERT: https://www.sciencedirect.com/science/article/pii/S0926580524000529
- SHAP Interpretability: https://www.mdpi.com/2673-4109/6/2/21
- Quantile Regression: https://arxiv.org/abs/2406.03258
- LSTM Cost Prediction: https://www.hindawi.com/journals/ace/2020/6518147/
- Transformer Comparison: https://www.tandfonline.com/doi/full/10.1080/13467581.2025.2455034
- Transfer Learning Construction: https://link.springer.com/chapter/10.1007/978-3-032-03515-8_17
