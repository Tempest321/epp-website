// EPP Demo - UNICO Engineering (California Survey Projects)
// Specialized for land surveying and small construction projects

// API Key (embedded for demo purposes)
const API_KEY = 'AIzaSyABrDOAuYLReMF0rWOncLUSAkzn9bUhmlE';

// DOM Elements
const demoForm = document.getElementById('demo-form');
const submitBtn = document.getElementById('submit-btn');
const resultsSection = document.getElementById('results-section');
const loadingState = document.getElementById('loading-state');
const resultsContent = document.getElementById('results-content');
const tryAgainBtn = document.getElementById('try-again-btn');

// UNICO-specific system prompt - California Survey & Small Construction
const SYSTEM_PROMPT = `You are an expert California land surveyor and construction project manager specializing in survey projects, site assessments, and small-to-medium construction oversight. Provide realistic, California-specific estimates.

=== COMPANY CONTEXT: UNICO ENGINEERING ===

UNICO is a $30M/year California construction contractor specializing in:
- Land surveying for architects and developers
- Highway construction (large projects $250K-$5M, 2-3 year duration)
- Construction project management and oversight
- Site scanning and assessment services

=== CALIFORNIA LAND SURVEY COSTS (2025 Data) ===

SURVEY TYPE PRICING:
- Simple Boundary Survey (suburban lot): $850-$1,800
- Boundary Survey (complex/hillside): $2,000-$4,500
- Topographic Survey: $1,500-$3,500+
- ALTA/NSPS Survey: $2,000-$5,500+
- Construction/Staking Survey: $1,000-$2,000
- New Construction Survey: $1,800-$6,500
- As-Built Survey: $1,600-$3,800
- Subdivision Survey: $3,000-$7,000+

REGIONAL CALIFORNIA PRICING:
- San Francisco Bay Area: $1,500-$3,500+ (highest)
- Los Angeles Basin: $1,200-$3,000
- San Jose/Silicon Valley: $1,500-$3,500+
- Sacramento/Folsom: $1,000-$2,500
- San Diego: $1,100-$2,800
- Central Valley: $800-$2,000
- Rural/Remote areas: Add $200-$500 travel fee

=== COST FACTORS FOR SURVEYS ===

TERRAIN MULTIPLIERS:
- Flat suburban: 1.0x (baseline)
- Light slope/vegetation: 1.2x
- Hillside/steep terrain: 1.5-2.0x
- Dense vegetation: 1.3-1.5x
- Wetlands/water features: 1.4-1.6x

PROPERTY SIZE FACTORS:
- <0.5 acre: baseline
- 0.5-1 acre: +15-25%
- 1-5 acres: +30-50%
- 5-10 acres: +60-100%
- >10 acres: Custom quote (per-acre pricing)

COMPLEXITY FACTORS:
- Simple rectangular lot: 1.0x
- Irregular boundaries: 1.2-1.4x
- Easements/encroachments: +$300-$800
- Historical records research: +$200-$500
- Rush job (<1 week): +25-50%

=== DURATION ESTIMATES (SURVEYS) ===

- Simple boundary: 1-3 days field + 2-5 days office
- Topographic: 2-5 days field + 3-7 days office
- ALTA survey: 3-7 days field + 5-10 days office
- Construction staking: 1-2 days per phase
- Large subdivision: 1-4 weeks total

=== SMALL CONSTRUCTION PROJECTS (UNICO SCOPE) ===

For construction oversight/management projects:
- Project Management fee: 8-15% of construction cost
- Site inspection: $500-$1,500 per visit
- Progress monitoring: $2,000-$5,000/month

California Regional Multipliers (construction):
- SF Bay Area: 1.35-1.45
- Los Angeles: 1.25-1.35
- San Diego: 1.15-1.25
- Sacramento: 1.10-1.20

=== COST BREAKDOWN (SURVEY PROJECTS) ===

- Labor (surveyor + crew): 55-70%
- Equipment (GPS, total station, drones): 15-25%
- Office/CAD work: 10-20%
- Travel/mobilization: 5-15%
- Contingency: 10-15%

=== RISK FACTORS (CALIFORNIA-SPECIFIC) ===

HIGH RISK:
- Coastal Zone (CCC permits required)
- Historic districts (additional research)
- Properties with unrecorded easements
- Fire-damaged areas (LA 2025 wildfires)
- Properties with boundary disputes

MEDIUM RISK:
- Hillside properties (access difficulty)
- Properties near waterways (CEQA review)
- Dense urban infill (tight access)
- Rush timeline requests

=== RESPONSE FORMAT ===

Respond with ONLY valid JSON (no markdown, no code blocks):

{
  "cost": {
    "p10": <optimistic estimate in dollars>,
    "p50": <most likely estimate in dollars>,
    "p90": <conservative estimate in dollars>
  },
  "duration": {
    "p10": <optimistic in days or weeks>,
    "p50": <most likely in days or weeks>,
    "p90": <conservative in days or weeks>
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
  "analysis": "<2-3 paragraphs: California-specific factors, survey type recommendations, timeline considerations>"
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

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
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

// Build prompt from form data - UNICO Survey version
// Now accepts free-form text input from user
function buildPrompt(formData) {
    return `
SURVEY TYPE: ${formData.projectType || 'Not specified'}
PROPERTY SIZE: ${formData.squareFootage || 'Not specified'}
TERRAIN: ${formData.floors || 'Not specified'}
CALIFORNIA REGION: ${formData.location || 'Not specified'}
COMPLEXITY: ${formData.contractType || 'Not specified'}
SERVICE LEVEL: ${formData.constructionClass || 'Not specified'}
${formData.description ? `SPECIAL REQUIREMENTS: ${formData.description}` : ''}

Please provide a detailed cost and timeline estimate for this California survey project. Include field time, office/CAD time, and any special considerations for the region and terrain. Use the pricing data in your system prompt to calculate realistic estimates.`;
}

// Generate mock prediction (fallback when no API key) - UNICO Survey version
function generateMockPrediction(formData) {
    // Base cost by survey type
    const baseSurveyCost = {
        'boundary-simple': 1200,
        'boundary-complex': 3000,
        'topographic': 2500,
        'alta': 3500,
        'construction-staking': 1500,
        'as-built': 2500,
        'subdivision': 5000,
        'site-scan': 4000,
        'project-management': 8000
    };

    // California regional multipliers
    const regionMultiplier = {
        'sf-bay': 1.4,
        'la-basin': 1.25,
        'san-jose': 1.4,
        'sacramento': 1.1,
        'san-diego': 1.2,
        'central-valley': 0.9,
        'rural': 1.15  // includes travel fee
    };

    // Terrain multipliers (stored as floors field)
    const terrainMultiplier = {
        '1': 1.0,
        '2': 1.2,
        '3': 1.5,
        '4': 1.4,
        '5': 1.5
    };

    // Complexity multipliers
    const complexityMultiplier = {
        'simple': 1.0,
        'moderate': 1.2,
        'complex': 1.4,
        'very-complex': 1.7,
        'rush': 1.4
    };

    // Service level multipliers
    const serviceLevelMultiplier = {
        'economy': 0.8,
        'standard': 1.0,
        'above-average': 1.3,
        'premium': 1.6,
        'luxury': 2.0
    };

    // Acreage adjustment (base prices assume <0.5 acre)
    const acres = formData.squareFootage;
    let acreageMultiplier = 1.0;
    if (acres > 0.5 && acres <= 1) acreageMultiplier = 1.2;
    else if (acres > 1 && acres <= 5) acreageMultiplier = 1.4;
    else if (acres > 5 && acres <= 10) acreageMultiplier = 1.8;
    else if (acres > 10) acreageMultiplier = 2.0 + (acres - 10) * 0.05;

    // Calculate total cost
    const baseCost = baseSurveyCost[formData.projectType] || 2000;
    const totalCost = baseCost
        * regionMultiplier[formData.location]
        * terrainMultiplier[formData.floors]
        * complexityMultiplier[formData.contractType]
        * serviceLevelMultiplier[formData.constructionClass]
        * acreageMultiplier;

    // Duration in days (surveys are shorter than construction)
    const baseDurationDays = {
        'boundary-simple': 5,
        'boundary-complex': 10,
        'topographic': 12,
        'alta': 14,
        'construction-staking': 3,
        'as-built': 8,
        'subdivision': 21,
        'site-scan': 7,
        'project-management': 30
    };
    const durationBase = baseDurationDays[formData.projectType] || 7;
    const adjustedDuration = durationBase * terrainMultiplier[formData.floors] * acreageMultiplier;

    // Generate California-specific risk factors
    const risks = [];
    if (formData.location === 'sf-bay' || formData.location === 'san-jose') {
        risks.push({
            level: 'medium',
            title: 'Bay Area Premium',
            description: 'SF Bay Area has highest surveying costs in California. Expect 30-40% premium over state average.'
        });
    }
    if (formData.floors === '3' || formData.floors === '5') {
        risks.push({
            level: 'high',
            title: 'Difficult Terrain',
            description: 'Steep hillside or wetland terrain increases field time and may require specialized equipment.'
        });
    }
    if (formData.contractType === 'rush') {
        risks.push({
            level: 'high',
            title: 'Rush Timeline',
            description: 'Rush jobs (<1 week) may require overtime crew and limit availability. 25-50% premium applies.'
        });
    }
    if (formData.projectType === 'alta') {
        risks.push({
            level: 'medium',
            title: 'ALTA Requirements',
            description: 'ALTA surveys require title report coordination and may be delayed by title company response times.'
        });
    }
    if (risks.length === 0) {
        risks.push({
            level: 'low',
            title: 'Standard Survey',
            description: 'No significant complications expected. Standard turnaround times apply.'
        });
    }

    return {
        cost: {
            p10: Math.round(totalCost * 0.85),
            p50: Math.round(totalCost),
            p90: Math.round(totalCost * 1.25)
        },
        duration: {
            p10: Math.round(adjustedDuration * 0.75),
            p50: Math.round(adjustedDuration),
            p90: Math.round(adjustedDuration * 1.4)
        },
        costBreakdown: {
            labor: 60,
            materials: 5,
            equipment: 20,
            overhead: 10,
            contingency: 5
        },
        risks: risks,
        analysis: `This ${formData.projectType.replace('-', ' ')} survey for a ${formData.squareFootage} acre property in California's ${formData.location.replace('-', ' ')} region is estimated at approximately $${formatCurrency(totalCost)}.\n\nKey cost factors include the ${formData.location.replace('-', ' ')} regional premium, terrain difficulty, and ${formData.constructionClass} service level requirements. Field work is estimated at ${Math.round(adjustedDuration * 0.4)} days with ${Math.round(adjustedDuration * 0.6)} days for office/CAD processing.\n\nRecommendation: For California surveys, we recommend scheduling 2-3 weeks ahead during peak season (spring/summer). ${formData.contractType === 'rush' ? 'Rush fee of 25-50% has been factored in.' : 'Standard turnaround applies.'}`
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

    // Show data source indicator
    const sourceIndicator = document.getElementById('data-source') || createSourceIndicator();
    if (result._source === 'MOCK') {
        sourceIndicator.textContent = '⚠️ Using Mock Data (API rate limited)';
        sourceIndicator.style.background = '#ff9800';
    } else {
        sourceIndicator.textContent = '✅ Powered by Gemini AI';
        sourceIndicator.style.background = '#4caf50';
    }
    sourceIndicator.style.display = 'block';

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
    document.getElementById('ai-analysis').innerHTML = result.analysis.split('\n\n').map(p => `<p>${p}</p>`).join('');
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

// Create data source indicator element
function createSourceIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'data-source';
    indicator.style.cssText = 'position:fixed;top:10px;right:10px;padding:8px 16px;border-radius:4px;color:white;font-size:14px;font-weight:500;z-index:9999;display:none;';
    document.body.appendChild(indicator);
    return indicator;
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
