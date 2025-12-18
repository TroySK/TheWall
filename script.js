// Utility functions
function formatCurrency(amount) {
    return `₹${amount.toLocaleString('en-IN')}`;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Theme Management
    const themeToggle = document.getElementById('themeToggle');
    const htmlElement = document.documentElement;

    // Function to set theme
    function setTheme(theme, save = true) {
        htmlElement.setAttribute('data-theme', theme);
        if (save) {
            localStorage.setItem('theme', theme);
        }
    }

    // Initialize theme
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)');

    if (savedTheme) {
        setTheme(savedTheme, false);
    } else if (systemPrefersDark.matches) {
        setTheme('dark', false);
    }

    // Theme toggle click handler
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            setTheme(newTheme);
        });
    }

    // Listen for system theme changes
    systemPrefersDark.addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            setTheme(e.matches ? 'dark' : 'light', false);
        }
    });

    // Mobile Navigation Toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileNav = document.getElementById('mobileNav');

    mobileMenuToggle.addEventListener('click', () => {
        mobileNav.classList.toggle('active');
        mobileMenuToggle.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.mobile-nav a').forEach(link => {
        link.addEventListener('click', () => {
            mobileNav.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
        });
    });

    // Quote Calculator
    const quoteForm = document.getElementById('quoteForm');
    const quoteResult = document.getElementById('quoteResult');
    const quoteDetails = document.getElementById('quoteDetails');

    // Price configuration
    const prices = {
        boundary: { base: 1200, multiplier: 1.0 },
        retaining: { base: 1500, multiplier: 1.2 },
        partition: { base: 1000, multiplier: 0.9 },
        sound: { base: 1800, multiplier: 1.5 }
    };

    const thicknessMultipliers = {
        100: 1.0,
        150: 1.2,
        200: 1.4,
        250: 1.6
    };

    const finishMultipliers = {
        smooth: 1.0,
        textured: 1.1,
        exposed: 1.2,
        bush: 1.15
    };

    const locationMultipliers = {
        north: 1.0,
        south: 1.05,
        east: 1.02,
        west: 1.03
    };

    function calculateQuote() {
        const wallType = document.getElementById('wallType').value;
        const length = parseFloat(document.getElementById('length').value);
        const height = parseFloat(document.getElementById('height').value);
        const thickness = document.getElementById('thickness').value;
        const finish = document.getElementById('finish').value;
        const location = document.getElementById('location').value;

        if (!wallType || !length || !height || !thickness || !finish || !location) {
            quoteResult.querySelector('.cost-value').textContent = '₹0';
            quoteDetails.innerHTML = '';
            return;
        }

        // Calculate area
        const area = length * height;

        // Get base price
        const basePrice = prices[wallType].base;
        const typeMultiplier = prices[wallType].multiplier;

        // Calculate total price
        const pricePerSqm = basePrice * typeMultiplier * thicknessMultipliers[thickness] * finishMultipliers[finish] * locationMultipliers[location];
        const totalPrice = area * pricePerSqm;

        // Display result
        quoteResult.querySelector('.cost-value').textContent = `₹${totalPrice.toLocaleString('en-IN')}`;
        
        // Display details
        quoteDetails.innerHTML = `
            <div class="quote-breakdown">
                <h4>Cost Breakdown:</h4>
                <ul>
                    <li>Wall Type: ${wallType.charAt(0).toUpperCase() + wallType.slice(1)} (${typeMultiplier.toFixed(2)}x)</li>
                    <li>Dimensions: ${length}m × ${height}m = ${area.toFixed(2)} sqm</li>
                    <li>Thickness: ${thickness}mm (${thicknessMultipliers[thickness].toFixed(2)}x)</li>
                    <li>Finish: ${finish.charAt(0).toUpperCase() + finish.slice(1)} (${finishMultipliers[finish].toFixed(2)}x)</li>
                    <li>Location: ${location.charAt(0).toUpperCase() + location.slice(1)} (${locationMultipliers[location].toFixed(2)}x)</li>
                    <li>Base Rate: ₹${basePrice.toLocaleString('en-IN')}/sqm</li>
                </ul>
                <p class="disclaimer">Note: This is an estimated price. Contact us for exact pricing including taxes and installation.</p>
            </div>
        `;
    }

    if (quoteForm) {
        quoteForm.addEventListener('submit', (e) => {
            e.preventDefault();
            calculateQuote();
        });
    }

    // Contact Form
    const contactForm = document.getElementById('contactForm');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData);
            
            // Basic validation
            if (!data.name || !data.email || !data.phone || !data.message) {
                alert('Please fill in all required fields.');
                return;
            }

            // Simulate form submission
            alert('Thank you for your message! We will get back to you soon.');
            contactForm.reset();
        });
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Apply animation to cards
    document.querySelectorAll('.feature-card, .product-card, .process-step, .customer-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });

    // Sticky header effect
    window.addEventListener('scroll', () => {
        const header = document.querySelector('.header');
        const isDark = htmlElement.getAttribute('data-theme') === 'dark';
        if (window.scrollY > 100) {
            header.style.background = isDark ? 'rgba(15, 23, 42, 0.98)' : 'rgba(255, 255, 255, 0.98)';
        } else {
            header.style.background = isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)';
        }
    });

    // Lazy loading for images (if we add any in the future)
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver(function(entries, observer) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        lazyImages.forEach(function(img) {
            imageObserver.observe(img);
        });
    }

    // Debounced calculation for real-time updates
    const debouncedCalculate = debounce(calculateQuote, 300);

    // Add real-time calculation on input changes
    document.querySelectorAll('#quoteForm input, #quoteForm select').forEach(input => {
        input.addEventListener('input', debouncedCalculate);
    });

    // Accessibility: Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        const isClickInsideNav = mobileNav.contains(e.target);
        const isClickOnToggle = mobileMenuToggle.contains(e.target);
        
        if (!isClickInsideNav && !isClickOnToggle && mobileNav.classList.contains('active')) {
            mobileNav.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
        }
    });

    // Add ARIA labels for better accessibility
    document.querySelectorAll('.btn-primary, .btn-secondary').forEach(btn => {
        if (!btn.getAttribute('aria-label')) {
            btn.setAttribute('aria-label', btn.textContent);
        }
    });

    // Keyboard navigation for mobile menu
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileNav.classList.contains('active')) {
            mobileNav.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
        }
    });
});