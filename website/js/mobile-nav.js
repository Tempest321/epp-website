// Mobile Navigation Handler
document.addEventListener('DOMContentLoaded', function() {
    // Create hamburger button if it doesn't exist
    const nav = document.querySelector('.nav-container');
    const navLinks = document.querySelector('.nav-links');

    if (!nav || !navLinks) return;

    // Check if hamburger already exists
    let hamburger = document.querySelector('.nav-hamburger');
    if (!hamburger) {
        hamburger = document.createElement('button');
        hamburger.className = 'nav-hamburger';
        hamburger.setAttribute('aria-label', 'Toggle navigation menu');
        hamburger.innerHTML = '<span></span><span></span><span></span>';
        nav.appendChild(hamburger);
    }

    // Create overlay if it doesn't exist (only for mobile)
    let overlay = document.querySelector('.nav-mobile-overlay');
    if (!overlay && window.innerWidth <= 768) {
        overlay = document.createElement('div');
        overlay.className = 'nav-mobile-overlay';
        document.body.appendChild(overlay);
    }

    // Toggle menu function
    function toggleMenu() {
        const isOpen = navLinks.classList.contains('open');

        if (isOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    }

    function openMenu() {
        navLinks.classList.add('open');
        hamburger.classList.add('open');
        overlay.classList.add('visible');
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        navLinks.classList.remove('open');
        hamburger.classList.remove('open');
        overlay.classList.remove('visible');
        document.body.style.overflow = '';
    }

    // Event listeners
    hamburger.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleMenu();
    });

    overlay.addEventListener('click', closeMenu);

    // Close menu when clicking a link
    navLinks.querySelectorAll('a').forEach(function(link) {
        link.addEventListener('click', closeMenu);
    });

    // Close menu on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && navLinks.classList.contains('open')) {
            closeMenu();
        }
    });

    // Close menu on resize to desktop
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            if (window.innerWidth > 768 && navLinks.classList.contains('open')) {
                closeMenu();
            }
        }, 100);
    });
});
