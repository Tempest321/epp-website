// Custom Revenue Calculator
(function() {
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        var input = document.getElementById('custom-revenue');
        var calculateBtn = document.getElementById('calculate-custom');
        var results = document.getElementById('custom-results');
        var savingsBtn = document.getElementById('custom-savings-btn');
        var savingsSummary = document.getElementById('custom-savings-summary');
        var lossTotal = results ? results.querySelector('.loss-total') : null;

        if (!input || !calculateBtn) return;

        var savedCalc = {
            losses: {},
            savings: {},
            totalLoss: { low: 0, high: 0 },
            totalSavings: { low: 0, high: 0 },
            pctLow: 0,
            pctHigh: 0
        };

        // Format input with commas
        input.addEventListener('input', function() {
            var val = this.value.replace(/\D/g, '');
            if (val) this.value = Number(val).toLocaleString();
        });

        // Calculate button
        calculateBtn.addEventListener('click', function() {
            var revenue = Number(input.value.replace(/\D/g, ''));
            if (!revenue || revenue < 1000000) {
                input.parentElement.style.borderColor = '#ef4444';
                setTimeout(function() { input.parentElement.style.borderColor = ''; }, 1500);
                return;
            }

            // Percentages of revenue
            var pct = {
                overtime: [0.03, 0.06],
                idle: [0.012, 0.024],
                ld: [0.005, 0.015],
                rework: [0.01, 0.02],
                procurement: [0.008, 0.016]
            };

            // Recovery rates
            var rec = { overtime: 0.6, idle: 0.7, ld: 0.8, rework: 0.6, procurement: 0.7 };

            // Calculate and store
            var totalLow = 0, totalHigh = 0, savLow = 0, savHigh = 0;
            for (var k in pct) {
                var lo = revenue * pct[k][0];
                var hi = revenue * pct[k][1];
                var savLoK = lo * rec[k];
                var savHiK = hi * rec[k];

                totalLow += lo;
                totalHigh += hi;
                savLow += savLoK;
                savHigh += savHiK;

                // Store for animation
                savedCalc.losses[k] = { low: lo, high: hi };
                savedCalc.savings[k] = { low: lo - savLoK, high: hi - savHiK }; // After = loss - savings recovered

                // Update display with loss values (red)
                var el = document.getElementById('custom-' + k);
                if (el) {
                    el.textContent = fmt(lo) + ' - ' + fmt(hi);
                    el.classList.remove('savings-mode', 'transitioning');
                }
            }

            savedCalc.totalLoss = { low: totalLow, high: totalHigh };
            savedCalc.totalSavings = { low: savLow, high: savHigh };
            savedCalc.pctLow = (savLow / revenue * 100).toFixed(1);
            savedCalc.pctHigh = (savHigh / revenue * 100).toFixed(1);

            document.getElementById('custom-revenue-display').textContent = fmtShort(revenue);

            var totalEl = document.getElementById('custom-total');
            totalEl.textContent = fmt(totalLow) + ' - ' + fmt(totalHigh);
            totalEl.classList.remove('savings-mode', 'transitioning');

            // Reset loss items styling
            var lossItems = results.querySelectorAll('.loss-item');
            lossItems.forEach(function(item) {
                item.classList.remove('savings-mode', 'transitioning');
            });

            // Show results, show loss-total
            results.className = 'custom-results';
            if (lossTotal) {
                lossTotal.style.display = '';
                lossTotal.classList.remove('savings-mode');
            }

            // Reset savings button
            if (savingsBtn) {
                savingsBtn.className = 'estimate-savings-btn';
                savingsBtn.querySelector('.btn-text').textContent = 'Estimate Savings';
                savingsBtn.querySelector('.btn-icon').textContent = '→';
            }
            if (savingsSummary) savingsSummary.className = 'custom-savings-summary';
        });

        // Savings button - animate red to green
        if (savingsBtn) {
            savingsBtn.addEventListener('click', function() {
                if (this.classList.contains('completed')) return;

                this.classList.add('calculating');
                this.querySelector('.btn-text').textContent = 'Calculating';
                this.querySelector('.btn-icon').textContent = '⟳';

                var btn = this;
                var lossItems = results.querySelectorAll('.loss-item');
                var keys = ['overtime', 'idle', 'ld', 'rework', 'procurement'];
                var delay = 200;
                var itemDelay = 500;

                // Phase 1: Animate each loss item
                lossItems.forEach(function(item, index) {
                    var k = keys[index];
                    var amountEl = item.querySelector('.loss-amount');

                    setTimeout(function() {
                        // Start transition
                        item.classList.add('transitioning');
                        amountEl.classList.add('transitioning');

                        // After 1s, update to savings value
                        setTimeout(function() {
                            var afterLo = savedCalc.savings[k].low;
                            var afterHi = savedCalc.savings[k].high;
                            amountEl.textContent = fmt(afterLo) + ' - ' + fmt(afterHi);

                            item.classList.remove('transitioning');
                            amountEl.classList.remove('transitioning');
                            item.classList.add('savings-mode');
                            amountEl.classList.add('savings-mode');
                        }, 1000);
                    }, delay + (index * itemDelay));
                });

                // Phase 2: Hide total and show summary
                var totalDelay = delay + (lossItems.length * itemDelay) + 1200;
                setTimeout(function() {
                    // Hide the loss total
                    if (lossTotal) {
                        lossTotal.style.display = 'none';
                    }

                    // Update and show savings summary
                    document.getElementById('custom-savings').textContent = fmt(savedCalc.totalSavings.low) + ' - ' + fmt(savedCalc.totalSavings.high);
                    document.getElementById('custom-percent').textContent = '+' + savedCalc.pctLow + '% - +' + savedCalc.pctHigh + '%';
                    savingsSummary.classList.add('visible');

                    btn.classList.remove('calculating');
                    btn.classList.add('completed');
                    btn.querySelector('.btn-text').textContent = 'Savings Calculated';
                    btn.querySelector('.btn-icon').textContent = '✓';
                }, totalDelay);
            });
        }
    }

    function fmt(n) {
        if (n >= 1e9) return '$' + (n/1e9).toFixed(2) + 'B';
        if (n >= 1e6) return '$' + (n/1e6).toFixed(2) + 'M';
        if (n >= 1e3) return '$' + Math.round(n/1e3) + 'K';
        return '$' + Math.round(n);
    }

    function fmtShort(n) {
        if (n >= 1e9) return '$' + (n/1e9).toFixed(1) + 'B';
        if (n >= 1e6) return '$' + Math.round(n/1e6) + 'M';
        if (n >= 1e3) return '$' + Math.round(n/1e3) + 'K';
        return '$' + n;
    }
})();
