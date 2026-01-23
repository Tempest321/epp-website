// FSE Demo - Gemini API Integration
// Construction Cost & Schedule Prediction Demo

// API calls go through secure Cloudflare Worker (no API key in client code)
const API_PROXY_URL = 'https://fse-api-proxy.andrewpayne005.workers.dev/api/gemini/generate';

// DOM Elements
const demoForm = document.getElementById('demo-form');
const submitBtn = document.getElementById('submit-btn');
const resultsSection = document.getElementById('results-section');
const loadingState = document.getElementById('loading-state');
const resultsContent = document.getElementById('results-content');
const tryAgainBtn = document.getElementById('try-again-btn');

// Construction estimation system prompt - General (all companies)
const SYSTEM_PROMPT = `You are an expert construction cost estimator with 30+ years of experience using RSMeans data and ENR cost indices. Provide realistic, data-driven estimates.

=== 2025 RSMEANS COST DATA (use these as baseline) ===

COST PER SQUARE FOOT BY BUILDING TYPE (National Average):
- Commercial Office (Class A): $400-$1,000/sqft
- Commercial Office (Class B): $300-$500/sqft
- Commercial Office (Standard): $202-$574/sqft
- Retail/Shopping: $180-$350/sqft
- Industrial/Warehouse: $120-$210/sqft
- Residential Multi-Family (Mid-rise 4-7 stories): $220-$450/sqft
- Residential Multi-Family (High-rise 8+ stories): $350-$700/sqft
- Healthcare/Medical: $450-$1,020/sqft (highest due to specialized systems)
- Education/Schools: $280-$450/sqft
- Hospitality/Hotels: $300-$550/sqft
- Data Centers: $800-$1,500/sqft

=== REGIONAL COST MULTIPLIERS (apply to national average) ===

- San Francisco Bay Area: 1.35-1.45 (highest in US)
- Los Angeles: 1.25-1.35
- New York City: 1.40-1.50 (highest in US with SF)
- Northeast (Boston, DC): 1.20-1.40
- West Coast (Seattle, Portland): 1.15-1.25
- Southwest (Phoenix, Denver): 1.00-1.10
- Southeast (Atlanta, Miami): 0.95-1.05
- Midwest (Chicago, Detroit): 1.05-1.15
- Mountain West: 1.00-1.10

=== LABOR COST CALCULATION ===

Formula: Labor Cost = (Hourly Rate × Hours × Workers) × (1 + Burden%)
- Typical labor burden: 25-50% of base wage (payroll taxes, workers comp, benefits)
- Labor typically = 30-50% of total project cost
- Productivity factors: Apply 0.85-0.95 multiplier for real-world conditions

=== DURATION ESTIMATION ===

Base rates (months per 10,000 sqft):
- Office: 1.2-1.8 months
- Retail: 1.0-1.4 months
- Warehouse: 0.6-1.0 months
- Multi-family: 1.5-2.2 months
- Healthcare: 2.0-3.0 months
- Education: 1.5-2.2 months

Adjust for: Number of floors (+8-12% per floor above 3), complexity, site conditions

=== COST BREAKDOWN (as % of total) ===

Standard Commercial:
- Labor: 35-45%
- Materials: 35-45%
- Equipment: 5-10%
- Overhead/General Conditions: 8-12%
- Contingency: 10-20%

Healthcare (specialized):
- Labor: 30-40%
- Materials: 30-40%
- Equipment: 8-15%
- Overhead: 10-15% (regulatory compliance)
- Contingency: 15-25%

=== RISK ASSESSMENT FACTORS ===

HIGH RISK indicators:
- California coastal locations (permits, seismic, environmental)
- Healthcare/institutional projects (regulatory complexity)
- Projects >100,000 sqft (coordination complexity)
- Luxury/Class A finishes (material lead times)
- Design-build contracts with incomplete scope

MEDIUM RISK indicators:
- Urban infill sites (access, logistics)
- Multi-story construction (>4 floors)
- Renovation of occupied buildings
- Tight schedules (<12 months for >50k sqft)

COST OVERRUN STATISTICS (factor into P90):
- 85% of projects experience overruns
- Average overrun: 16-28%
- Main causes: Scope creep (35%), change orders (25%), inaccurate estimates (20%), design errors (15%)

=== ESTIMATOR BEST PRACTICES (apply these) ===

1. NEVER estimate below RSMeans minimums for building type
2. Apply regional multiplier BEFORE other adjustments
3. Add 10-20% contingency minimum (20% for early-stage/complex)
4. P10/P50/P90 spread should be 15-30% (wider for complex projects)
5. Healthcare projects require 25-35% soft cost addition
6. San Francisco/LA: Add 4-6% annual escalation for projects >12 months

=== RESPONSE FORMAT ===

Respond with ONLY valid JSON (no markdown, no code blocks):

{
  "cost": {
    "p10": <optimistic estimate in dollars>,
    "p50": <most likely estimate in dollars>,
    "p90": <conservative estimate in dollars>
  },
  "duration": {
    "p10": <optimistic months>,
    "p50": <most likely months>,
    "p90": <conservative months>
  },
  "costBreakdown": {
    "labor": <percentage 0-100>,
    "materials": <percentage 0-100>,
    "equipment": <percentage 0-100>,
    "overhead": <percentage 0-100>,
    "contingency": <percentage 0-100>
  },
  "risks": [
    {"level": "high|medium|low", "title": "<title>", "description": "<description>"}
  ],
  "analysis": "<2-3 paragraphs: key cost drivers, regional factors, recommendations>"
}`;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Form submission
    demoForm.addEventListener('submit', handleSubmit);

    // Try again button
    tryAgainBtn.addEventListener('click', resetDemo);
});

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();

    // Gather form data
    const formData = {
        projectType: document.getElementById('project-type').value,
        squareFootage: parseInt(document.getElementById('square-footage').value),
        floors: parseInt(document.getElementById('floors').value),
        location: document.getElementById('location').value,
        contractType: document.getElementById('contract-type').value,
        constructionClass: document.getElementById('construction-class').value,
        description: document.getElementById('description').value || ''
    };

    // Show loading state
    showLoading();

    try {
        const result = await callGeminiAPI(formData);
        displayResults(result);
    } catch (error) {
        console.error('Prediction error:', error);
        alert('Error generating prediction: ' + error.message);
        hideResults();
    }
}

// Call Gemini API
async function callGeminiAPI(formData) {
    const prompt = buildPrompt(formData);

    const response = await fetch(API_PROXY_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: SYSTEM_PROMPT + '\n\nProject to estimate:\n' + prompt
                }]
            }],
            generationConfig: {
                temperature: 0.2,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048
            }
        })
    });

    if (!response.ok) {
        const error = await response.json();
        // Handle rate limiting gracefully
        if (response.status === 429) {
            console.log('⚠️ API rate limited, falling back to MOCK DATA');
            const mockResult = generateMockPrediction(formData);
            mockResult._source = 'MOCK';
            return mockResult;
        }
        throw new Error(error.error?.message || 'API request failed');
    }

    console.log('✅ Using REAL Gemini API response');
    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;

    // Parse JSON from response (handle potential markdown code blocks)
    let jsonText = text;
    if (text.includes('```json')) {
        jsonText = text.split('```json')[1].split('```')[0];
    } else if (text.includes('```')) {
        jsonText = text.split('```')[1].split('```')[0];
    }

    try {
        return JSON.parse(jsonText.trim());
    } catch (e) {
        console.error('Failed to parse response:', text);
        throw new Error('Failed to parse AI response');
    }
}

// Build prompt from form data
// Now accepts free-form text input from user
function buildPrompt(formData) {
    return `
PROJECT TYPE: ${formData.projectType || 'Not specified'}
SQUARE FOOTAGE: ${formData.squareFootage || 'Not specified'}
NUMBER OF FLOORS: ${formData.floors || 'Not specified'}
LOCATION: ${formData.location || 'Not specified'}
CONTRACT TYPE: ${formData.contractType || 'Not specified'}
CONSTRUCTION QUALITY: ${formData.constructionClass || 'Not specified'}
${formData.description ? `ADDITIONAL DETAILS: ${formData.description}` : ''}

Please provide a detailed cost and schedule estimate for this project. Use the RSMeans data and regional multipliers in your system prompt to calculate realistic estimates.`;
}

// Generate mock prediction (fallback when no API key)
function generateMockPrediction(formData) {
    // Base cost per sq ft by project type
    const baseCostPerSqFt = {
        'commercial-office': 250,
        'commercial-retail': 180,
        'industrial-warehouse': 120,
        'residential-multifamily': 200,
        'residential-single': 175,
        'healthcare': 450,
        'education': 280,
        'hospitality': 300,
        'infrastructure-road': 150,
        'infrastructure-bridge': 400,
        'infrastructure-utility': 200,
        'renovation': 150
    };

    // Regional multipliers
    const regionMultiplier = {
        'northeast': 1.35,
        'southeast': 1.0,
        'midwest': 1.05,
        'southwest': 1.0,
        'west': 1.25,
        'mountain': 1.1
    };

    // Quality multipliers
    const qualityMultiplier = {
        'economy': 0.75,
        'standard': 1.0,
        'above-average': 1.25,
        'premium': 1.5,
        'luxury': 2.0
    };

    // Base duration per 10k sq ft (months)
    const baseDuration = {
        'commercial-office': 1.5,
        'commercial-retail': 1.2,
        'industrial-warehouse': 0.8,
        'residential-multifamily': 1.8,
        'residential-single': 0.6,
        'healthcare': 2.5,
        'education': 2.0,
        'hospitality': 2.0,
        'infrastructure-road': 1.0,
        'infrastructure-bridge': 3.0,
        'infrastructure-utility': 1.5,
        'renovation': 1.0
    };

    // Calculate estimates
    const basePerSqFt = baseCostPerSqFt[formData.projectType] || 200;
    const adjusted = basePerSqFt * regionMultiplier[formData.location] * qualityMultiplier[formData.constructionClass];
    const baseCost = adjusted * formData.squareFootage;

    // Add floor complexity factor
    const floorFactor = 1 + (formData.floors - 1) * 0.03;
    const totalCost = baseCost * floorFactor;

    // Duration calculation
    const durationBase = baseDuration[formData.projectType] || 1.5;
    const baseDurationMonths = (formData.squareFootage / 10000) * durationBase;
    const adjustedDuration = Math.max(3, baseDurationMonths * (1 + (formData.floors - 1) * 0.1));

    // Generate risk factors
    const risks = [];
    if (formData.location === 'northeast' || formData.location === 'west') {
        risks.push({
            level: 'medium',
            title: 'High Labor Costs',
            description: 'Regional labor rates are 20-40% above national average, impacting overall project cost.'
        });
    }
    if (formData.constructionClass === 'luxury' || formData.constructionClass === 'premium') {
        risks.push({
            level: 'high',
            title: 'Material Lead Times',
            description: 'Premium finishes and specialty materials may have extended lead times affecting schedule.'
        });
    }
    if (formData.squareFootage > 100000) {
        risks.push({
            level: 'medium',
            title: 'Project Scale',
            description: 'Large project size increases coordination complexity and potential for delays.'
        });
    }
    if (risks.length === 0) {
        risks.push({
            level: 'low',
            title: 'Standard Project Profile',
            description: 'No significant risk factors identified. Standard construction practices apply.'
        });
    }

    return {
        cost: {
            p10: Math.round(totalCost * 0.85),
            p50: Math.round(totalCost),
            p90: Math.round(totalCost * 1.25)
        },
        duration: {
            p10: Math.round(adjustedDuration * 0.85),
            p50: Math.round(adjustedDuration),
            p90: Math.round(adjustedDuration * 1.3)
        },
        costBreakdown: {
            labor: 45,
            materials: 35,
            equipment: 8,
            overhead: 7,
            contingency: 5
        },
        risks: risks,
        analysis: `Based on the project parameters provided, this ${formData.squareFootage.toLocaleString()} sq ft ${formData.projectType.replace('-', ' ')} project in the ${formData.location} region is estimated at approximately $${formatCurrency(totalCost)}.\n\nKey cost drivers include regional labor rates, the ${formData.constructionClass} quality specification, and the ${formData.floors}-story configuration. The ${formData.contractType.replace('-', ' ')} contract structure has been factored into the risk assessment.\n\nRecommendation: Given the project profile, we suggest a 10% contingency reserve and early procurement of long-lead items to maintain schedule adherence.`
    };
}

// Display results
function displayResults(result) {
    // Hide loading, show results
    loadingState.classList.add('hidden');
    resultsContent.classList.remove('hidden');

    // Reset button state
    submitBtn.disabled = false;
    submitBtn.classList.remove('loading');


    // Cost estimates
    document.getElementById('cost-estimate').textContent = '$' + formatCurrency(result.cost.p50);
    document.getElementById('cost-p10').textContent = '$' + formatCurrency(result.cost.p10);
    document.getElementById('cost-p50').textContent = '$' + formatCurrency(result.cost.p50);
    document.getElementById('cost-p90').textContent = '$' + formatCurrency(result.cost.p90);

    // Duration estimates
    document.getElementById('duration-estimate').textContent = result.duration.p50 + ' months';
    document.getElementById('duration-p10').textContent = result.duration.p10 + ' months';
    document.getElementById('duration-p50').textContent = result.duration.p50 + ' months';
    document.getElementById('duration-p90').textContent = result.duration.p90 + ' months';

    // Cost breakdown chart
    renderCostBreakdown(result.costBreakdown, result.cost.p50);

    // Risks
    renderRisks(result.risks);

    // Analysis
    document.getElementById('analysis-content').innerHTML = result.analysis.split('\n\n').map(p => `<p>${p}</p>`).join('');
}

// Render cost breakdown chart
function renderCostBreakdown(breakdown, totalCost) {
    const container = document.getElementById('cost-breakdown');
    container.innerHTML = '';

    const categories = [
        { key: 'labor', label: 'Labor', class: 'labor' },
        { key: 'materials', label: 'Materials', class: 'materials' },
        { key: 'equipment', label: 'Equipment', class: 'equipment' },
        { key: 'overhead', label: 'Overhead', class: 'overhead' },
        { key: 'contingency', label: 'Contingency', class: 'contingency' }
    ];

    const maxPercent = Math.max(...Object.values(breakdown));

    categories.forEach(cat => {
        const percent = breakdown[cat.key] || 0;
        const amount = Math.round(totalCost * (percent / 100));
        const barWidth = (percent / maxPercent) * 100;

        const item = document.createElement('div');
        item.className = 'breakdown-item';
        item.innerHTML = `
            <span class="breakdown-label">${cat.label}</span>
            <div class="breakdown-bar-container">
                <div class="breakdown-bar ${cat.class}" style="width: 0%"></div>
            </div>
            <span class="breakdown-value">$${formatCurrency(amount)}</span>
        `;
        container.appendChild(item);

        // Animate bar after append
        setTimeout(() => {
            item.querySelector('.breakdown-bar').style.width = barWidth + '%';
        }, 100);
    });
}

// Render risk factors
function renderRisks(risks) {
    const container = document.getElementById('risks-list');
    container.innerHTML = '';

    const riskIcons = {
        high: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        medium: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
        low: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>'
    };

    risks.forEach(risk => {
        const item = document.createElement('div');
        item.className = 'risk-item';
        item.innerHTML = `
            <div class="risk-icon ${risk.level}">${riskIcons[risk.level]}</div>
            <div class="risk-content">
                <div class="risk-title">${risk.title}</div>
                <div class="risk-description">${risk.description}</div>
            </div>
        `;
        container.appendChild(item);
    });
}

// Show loading state
function showLoading() {
    resultsSection.classList.remove('hidden');
    loadingState.classList.remove('hidden');
    resultsContent.classList.add('hidden');
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
}

// Hide results
function hideResults() {
    resultsSection.classList.add('hidden');
    submitBtn.disabled = false;
    submitBtn.classList.remove('loading');
}

// Reset demo
function resetDemo() {
    resultsSection.classList.add('hidden');
    resultsContent.classList.add('hidden');
    submitBtn.disabled = false;
    submitBtn.classList.remove('loading');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}


// Format currency
function formatCurrency(amount) {
    if (amount >= 1000000) {
        return (amount / 1000000).toFixed(1) + 'M';
    } else if (amount >= 1000) {
        return (amount / 1000).toFixed(0) + 'K';
    }
    return amount.toLocaleString();
}
