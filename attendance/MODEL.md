# Attendance Estimation Model

## Overview

This document describes the probabilistic model used to estimate expected attendance at events based on RSVP responses. The model accounts for different response types (Yes, Maybe, No, and No Response) and assigns probability weights to each category based on behavioral patterns.

---

## 1. Definitions

Let:

- **T**: Total number of people in the group (poll list)
- **Y**: Number of "Yes" responses
- **M**: Number of "Maybe" responses  
- **N**: Number of "No" responses
- **U**: Number of people who didn't respond (Unknown)

Where: `Y + M + N + U = T`

---

## 2. Probabilistic Model

Each response category corresponds to a conditional probability that a person will actually attend:

- **p<sub>Y</sub>** = P(attends | Yes): Probability that someone who responded "Yes" actually attends
- **p<sub>M</sub>** = P(attends | Maybe): Probability that someone who responded "Maybe" attends
- **p<sub>N</sub>** = P(attends | No): Probability that someone who responded "No" attends
- **p<sub>U</sub>** = P(attends | Unknown): Probability that someone who didn't respond attends

### Expected Value Formula

The expected number of attendees (E) is calculated as:

```math
E = (p_Y × Y) + (p_M × M) + (p_N × N) + (p_U × U)
```

### Expected Attendance Rate

The expected attendance rate as a fraction of the total is:

```math
Expected Rate = E / T = (p_Y × Y + p_M × M + p_N × N + p_U × U) / T
```

---

## 3. Default Probability Values

Based on behavioral data from event RSVP patterns, marketing studies, and platforms like Meetup, reasonable default probabilities are:

| Response Type | Probability | Description |
|---------------|-------------|-------------|
| **Yes (Y)**   | 0.80 (80%)  | Most committed, but some drop out |
| **Maybe (M)** | 0.40 (40%)  | Uncertain, about half don't show |
| **No (N)**    | 0.05 (5%)   | Rarely attend, but occasional changes |
| **Unknown (U)** | 0.15 (15%) | Lower than "Maybe" but not zero |

### Rationale for p<sub>U</sub>

People who don't respond typically:

- Have lower engagement than those who actively respond
- Are more likely to skip than "Maybe" respondents
- Still attend occasionally (hence not 0%)

A typical value of **0.15** is conservative. This can be adjusted based on:

- Historical data from your community
- Event type (casual vs. formal)
- Group characteristics

**Alternative approaches for p<sub>U</sub>:**

- Set equal to p<sub>M</sub> if non-responders behave similarly to "Maybe"
- Use a range of 0.10 - 0.25 if no historical data exists
- Calculate empirically from past events

---

## 4. Calculation Example

### Scenario

- **T** = 100 (total people)
- **Y** = 50 (responded "Yes")
- **M** = 20 (responded "Maybe")
- **N** = 10 (responded "No")
- **U** = 100 - (50 + 20 + 10) = **20** (no response)

### Step-by-Step Calculation

Using default probabilities:

1. **Yes contribution**: 0.80 × 50 = 40.0
2. **Maybe contribution**: 0.40 × 20 = 8.0
3. **No contribution**: 0.05 × 10 = 0.5
4. **Unknown contribution**: 0.15 × 20 = 3.0

**Total**: E = 40.0 + 8.0 + 0.5 + 3.0 = **51.5 people**

**Expected Rate**: 51.5 / 100 = **51.5%**

---

## 5. Uncertainty Estimation (Optional)

### Variance Calculation

If we model each person's attendance as an independent Bernoulli trial, the variance of the expected attendance is:

```math
Var(E) = Y × p_Y × (1 - p_Y) + 
         M × p_M × (1 - p_M) + 
         N × p_N × (1 - p_N) + 
         U × p_U × (1 - p_U)
```

The **standard deviation** is:

```math
σ = √Var(E)
```

### Using the Example Above

```math
Var(E) = 50 × 0.80 × 0.20 + 
         20 × 0.40 × 0.60 + 
         10 × 0.05 × 0.95 + 
         20 × 0.15 × 0.85

Var(E) = 8.0 + 4.8 + 0.475 + 2.55 = 15.825

σ = √15.825 ≈ 3.98
```

### Confidence Interval

Using the normal approximation (valid for large numbers):

**68% confidence interval**: E ± σ ≈ 51.5 ± 4.0 = **[47.5, 55.5]**

**95% confidence interval**: E ± 2σ ≈ 51.5 ± 8.0 = **[43.5, 59.5]**

This gives event organizers a range to plan for (e.g., "expect between 48-56 people with high confidence").

---

## 6. Calibrating the Model with Historical Data

### Empirical Probability Estimation

For more accurate predictions, calculate probabilities from past events:

```math
p_Y = (# of "Yes" who actually attended) / (# total "Yes" responses)
p_M = (# of "Maybe" who actually attended) / (# total "Maybe" responses)
p_N = (# of "No" who actually attended) / (# total "No" responses)
p_U = (# of non-responders who attended) / (# total non-responders)
```

### Bayesian Updating

As you collect more data:

1. Start with default probabilities
2. After each event, update probabilities with actual attendance
3. Use weighted averages (more recent events weighted higher)
4. The model becomes more accurate over time

### Advanced: Individual-Level Prediction

For sophisticated analysis, use logistic regression with features:

- **Demographics**: age, location, membership duration
- **Engagement history**: past attendance rate, response patterns
- **Event characteristics**: day of week, time, venue, type
- **Social factors**: number of friends attending, group affinity

This provides individual attendance probabilities rather than category averages.

---

## 7. Practical Guidelines

### When to Adjust Default Probabilities

| Scenario | Adjustment |
|----------|------------|
| **Highly committed community** | Increase p<sub>Y</sub> to 0.85-0.90 |
| **Casual/free events** | Decrease p<sub>Y</sub> to 0.60-0.70 |
| **Paid events** | Increase p<sub>Y</sub> to 0.90-0.95 |
| **Last-minute events** | Decrease all probabilities by 0.10-0.15 |
| **Regular attendees** | Increase p<sub>U</sub> to 0.20-0.25 |
| **New group/first event** | Use conservative defaults |

### Best Practices

1. **Track actual attendance**: Record who actually showed up vs. their RSVP
2. **Segment by event type**: Different event types may have different patterns
3. **Consider seasonality**: Summer vacations, holidays affect attendance
4. **Update regularly**: Recalibrate probabilities quarterly or after every 5-10 events
5. **Plan for the range**: Use E - σ for minimum planning, E + σ for maximum

---

## 8. Implementation Notes

### Current Implementation

The web application uses these default values:

- p<sub>Y</sub> = 0.80
- p<sub>M</sub> = 0.40
- p<sub>N</sub> = 0.05
- p<sub>U</sub> = 0.15

### Output Provided

- **Expected attendance** (E)
- **Attendance rate** (percentage)
- **Standard deviation** (σ)
- **Number of non-responders** (U)

### Future Enhancements

1. **Custom probability input**: Allow users to override default probabilities
2. **Historical tracking**: Store past events and actual attendance
3. **Auto-calibration**: Automatically update probabilities based on history
4. **Confidence intervals**: Display probability ranges
5. **Event comparison**: Compare estimates across different events
6. **Export functionality**: Download reports and historical data

---

## 9. Mathematical Foundation

### Why This Model Works

1. **Linearity of Expectation**: E[X + Y] = E[X] + E[Y] allows us to sum contributions
2. **Independent trials**: Assuming independence, variance adds linearly
3. **Law of Large Numbers**: For large T, the estimate converges to the true mean
4. **Central Limit Theorem**: For large samples, attendance distribution is approximately normal

### Assumptions

- Each person's attendance decision is independent
- Probabilities are constant within each category
- Past behavior predicts future behavior
- No systematic changes in the population

### Limitations

- Doesn't account for:
  - Social influence (friends attending together)
  - Weather or external events
  - Competing events on the same date
  - Changes in group dynamics
  - Individual motivation fluctuations

---

## 10. References and Further Reading

- **Behavioral Economics**: Kahneman & Tversky on commitment bias
- **Meetup Platform Studies**: RSVP vs. attendance correlation data
- **Marketing Research**: No-show rates in different industries
- **Statistical Modeling**: Bernoulli trials and binomial distributions
- **Machine Learning**: Logistic regression for attendance prediction

---

## Summary

This model provides a data-driven, statistically sound method for estimating event attendance. By combining:

- Probabilistic reasoning
- Historical behavioral patterns
- Uncertainty quantification
- Easy calibration with real data

Event organizers can make better-informed decisions about venue size, catering, staffing, and resource allocation.

**Key takeaway**: Start with defaults, track your data, and refine over time for increasingly accurate predictions.
