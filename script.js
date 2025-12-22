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

    // Price configuration for wall types
    const prices = {
        boundary: 100,
        exterior: 140,
        partition: 120
    };

    const locationMultipliers = {
        north: 1.0,
        south: 1.05,
        east: 1.02,
        west: 1.03
    };

    // Calculate perimeter based on length and breadth
    function calculatePerimeter(length, breadth) {
        return 2 * (length + breadth);
    }

    // Calculate area based on perimeter and height
    function calculateArea(perimeter, height) {
        return perimeter * height;
    }

    // Update perimeter field when length or breadth changes
    function updatePerimeter() {
        const length = parseFloat(document.getElementById('length').value);
        const breadth = parseFloat(document.getElementById('breadth').value);
        const perimeterInput = document.getElementById('perimeter');
        
        if (!isNaN(length) && !isNaN(breadth) && length > 0 && breadth > 0) {
            const calculatedPerimeter = calculatePerimeter(length, breadth);
            // Always update the perimeter field in real-time
            perimeterInput.value = calculatedPerimeter.toFixed(2);
            // Trigger the area update as well
            updateArea();
        } else {
            // Clear perimeter if inputs are invalid
            perimeterInput.value = '';
            updateArea(); // Also clear area
        }
    }

    // Update area field when perimeter or height changes
    function updateArea() {
        const perimeter = parseFloat(document.getElementById('perimeter').value);
        const height = parseFloat(document.getElementById('height').value);
        const areaInput = document.getElementById('area');
        
        if (!isNaN(perimeter) && !isNaN(height) && perimeter > 0 && height > 0) {
            const calculatedArea = calculateArea(perimeter, height);
            areaInput.value = calculatedArea.toFixed(2);
            // Trigger cost calculation as well
            calculateQuote();
        } else {
            areaInput.value = '';
        }
    }

    function calculateQuote() {
        const wallType = document.getElementById('wallType').value;
        const perimeter = parseFloat(document.getElementById('perimeter').value);
        const height = parseFloat(document.getElementById('height').value);
        const location = document.getElementById('location').value;

        if (!wallType || !perimeter || !height || !location) {
            quoteResult.querySelector('.cost-value').textContent = '₹0';
            quoteDetails.innerHTML = '';
            return;
        }

        // Calculate area
        const area = calculateArea(perimeter, height);

        // Get base price per square meter
        const basePrice = prices[wallType];

        // Get location multiplier
        const locationMultiplier = locationMultipliers[location];

        // Calculate total price
        const totalPrice = area * basePrice * locationMultiplier;

        // Display result
        quoteResult.querySelector('.cost-value').textContent = `₹${totalPrice.toLocaleString('en-IN')}`;
        
        // Display details
        quoteDetails.innerHTML = `
            <div class="quote-breakdown">
                <h4>Cost Breakdown:</h4>
                <ul>
                    <li>Wall Type: ${wallType.charAt(0).toUpperCase() + wallType.slice(1)}</li>
                    <li>Perimeter: ${perimeter.toFixed(2)} feet</li>
                    <li>Height: ${height} feet</li>
                    <li>Area: ${area.toFixed(2)} sq.ft</li>
                    <li>Location: ${location.charAt(0).toUpperCase() + location.slice(1)} (${locationMultiplier.toFixed(2)}x)</li>
                    <li>Base Rate: ₹${basePrice}/sq.ft</li>
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

    // Add event listeners for real-time calculations
    const lengthInput = document.getElementById('length');
    const breadthInput = document.getElementById('breadth');
    const perimeterInput = document.getElementById('perimeter');
    const heightInput = document.getElementById('height');

    // Update perimeter when length or breadth changes
    if (lengthInput && breadthInput) {
        lengthInput.addEventListener('input', updatePerimeter);
        breadthInput.addEventListener('input', updatePerimeter);
    }

    // Update area when perimeter or height changes
    if (perimeterInput && heightInput) {
        perimeterInput.addEventListener('input', updateArea);
        heightInput.addEventListener('input', updateArea);
    }

    // Debounced calculation for real-time updates
    const debouncedCalculate = debounce(calculateQuote, 300);

    // Add real-time calculation on input changes
    document.querySelectorAll('#quoteForm input, #quoteForm select').forEach(input => {
        input.addEventListener('input', debouncedCalculate);
    });

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