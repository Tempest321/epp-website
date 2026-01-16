// Savings Animation Handler
document.addEventListener('DOMContentLoaded', function() {
    const savingsButtons = document.querySelectorAll('.estimate-savings-btn');

    savingsButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            const tier = this.getAttribute('data-tier');
            runSavingsAnimation(tier, this);
        });
    });
});

function runSavingsAnimation(tier, button) {
    // Prevent double-click
    if (button.classList.contains('calculating') || button.classList.contains('completed')) {
        return;
    }

    // Set button to calculating state
    button.classList.add('calculating');
    button.querySelector('.btn-text').textContent = 'Calculating';
    button.querySelector('.btn-icon').textContent = '⟳';

    // Get the tier content container
    const tierContent = document.getElementById('tier-' + tier);
    const lossItems = tierContent.querySelectorAll('.loss-item');
    const lossTotal = tierContent.querySelector('.loss-total');
    const chart = document.getElementById('chart-' + tier);
    const summary = document.getElementById('summary-' + tier);

    // Animation sequence - longer delays for 1s color transition
    let delay = 400;
    const itemDelay = 600; // Longer delay between items

    // Phase 1: Animate each loss item (red to green transition)
    lossItems.forEach(function(item, index) {
        setTimeout(function() {
            animateLossItem(item);
        }, delay + (index * itemDelay));
    });

    // Phase 2: Animate the total (after all items + their 1s animation)
    const totalDelay = delay + (lossItems.length * itemDelay) + 400;
    setTimeout(function() {
        animateTotal(lossTotal);
    }, totalDelay);

    // Phase 3: Show the bar chart
    const chartDelay = totalDelay + 1200;
    setTimeout(function() {
        showChart(chart);
    }, chartDelay);

    // Phase 4: Show savings summary
    const summaryDelay = chartDelay + 1500;
    setTimeout(function() {
        showSummary(summary);

        // Update button to completed state
        button.classList.remove('calculating');
        button.classList.add('completed');
        button.querySelector('.btn-text').textContent = 'Savings Calculated';
        button.querySelector('.btn-icon').textContent = '✓';
    }, summaryDelay);
}

function animateLossItem(item) {
    const amount = item.querySelector('.loss-amount');
    const explanation = item.querySelector('.savings-explanation');

    // Add transitioning class for the 1-second color transition
    item.classList.add('transitioning');
    amount.classList.add('transitioning');

    // After the 1-second animation completes, update to final state
    setTimeout(function() {
        // Update the amount to the "after" value
        const afterValue = amount.getAttribute('data-after');
        amount.textContent = afterValue;

        // Remove transitioning, add savings-mode
        item.classList.remove('transitioning');
        amount.classList.remove('transitioning');
        item.classList.add('savings-mode');
        amount.classList.add('savings-mode');

        // Show the explanation
        if (explanation) {
            explanation.classList.remove('hidden');
            // Trigger reflow for animation
            void explanation.offsetWidth;
            explanation.classList.add('visible');
        }
    }, 1000); // Wait for full 1-second color transition
}

function animateTotal(total) {
    const amount = total.querySelector('.total-amount');

    // Add transitioning effect for 1-second color transition
    amount.classList.add('transitioning');

    setTimeout(function() {
        // Update to the after value
        const afterValue = amount.getAttribute('data-after');
        amount.textContent = afterValue;

        // Switch to savings mode
        amount.classList.remove('transitioning');
        total.classList.add('savings-mode');
        amount.classList.add('savings-mode');
    }, 1000); // Wait for full 1-second color transition
}

function showChart(chart) {
    // Add visible class (CSS handles the max-height transition)
    chart.classList.remove('hidden');
    chart.classList.add('visible');

    // Animate the bars after the container expands
    setTimeout(function() {
        const bars = chart.querySelectorAll('.bar');
        bars.forEach(function(bar, index) {
            setTimeout(function() {
                bar.classList.add('animate');
            }, index * 150); // Stagger bar animations
        });
    }, 400);
}

function showSummary(summary) {
    summary.classList.remove('hidden');
    summary.classList.add('visible');
}

// Reset function (for development/testing)
function resetSavingsAnimation(tier) {
    const tierContent = document.getElementById('tier-' + tier);
    const lossItems = tierContent.querySelectorAll('.loss-item');
    const lossTotal = tierContent.querySelector('.loss-total');
    const chart = document.getElementById('chart-' + tier);
    const summary = document.getElementById('summary-' + tier);
    const button = tierContent.querySelector('.estimate-savings-btn');

    // Reset loss items
    lossItems.forEach(function(item) {
        const amount = item.querySelector('.loss-amount');
        const explanation = item.querySelector('.savings-explanation');

        item.classList.remove('transitioning', 'savings-mode');
        amount.classList.remove('transitioning', 'savings-mode');
        amount.textContent = amount.getAttribute('data-before');

        if (explanation) {
            explanation.classList.remove('visible');
            explanation.classList.add('hidden');
        }
    });

    // Reset total
    const totalAmount = lossTotal.querySelector('.total-amount');
    lossTotal.classList.remove('savings-mode');
    totalAmount.classList.remove('transitioning', 'savings-mode');
    totalAmount.textContent = totalAmount.getAttribute('data-before');

    // Reset chart
    chart.classList.remove('visible');
    chart.classList.add('hidden');
    chart.querySelectorAll('.bar').forEach(function(bar) {
        bar.classList.remove('animate');
    });

    // Reset summary
    summary.classList.remove('visible');
    summary.classList.add('hidden');

    // Reset button
    button.classList.remove('calculating', 'completed');
    button.querySelector('.btn-text').textContent = 'Estimate Savings';
    button.querySelector('.btn-icon').textContent = '→';
}
