// Tab functionality for tier selection
document.addEventListener('DOMContentLoaded', function() {
    // Handle all tab groups
    const tabGroups = document.querySelectorAll('.tier-tabs');

    tabGroups.forEach(function(tabGroup) {
        const tabs = tabGroup.querySelectorAll('.tier-tab');

        tabs.forEach(function(tab) {
            tab.addEventListener('click', function() {
                const tierId = this.getAttribute('data-tier');

                // Remove active class from all tabs in this group
                tabs.forEach(function(t) {
                    t.classList.remove('active');
                });

                // Add active class to clicked tab
                this.classList.add('active');

                // Find the parent section
                const section = tabGroup.closest('.loss-breakdown') || tabGroup.closest('section');

                // Hide all tier content in this section
                const contents = section.querySelectorAll('.tier-content');
                contents.forEach(function(content) {
                    content.classList.remove('active');
                });

                // Show the selected tier content
                const targetContent = document.getElementById('tier-' + tierId);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
    });
});
