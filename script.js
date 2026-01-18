// Utility functions
function formatCurrency(amount) {
    return `Rs.${amount.toLocaleString('en-IN')}`;
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

    // Reference point coordinates (26°41'19.2"N 88°20'57.6"E)
    const REFERENCE_POINT = {
        lat: 26.6886667, // 26°41'19.2"
        lng: 88.3493333  // 88°20'57.6"
    };

    // Map and marker variables
    let map = null;
    let marker = null;
    let distanceValue = null;
    let extraCostValue = null;
    let currentDistance = 0;

    // Initialize map when DOM is ready
    function initMap() {
        // Initialize the map centered at the reference point
        map = L.map('map').setView([REFERENCE_POINT.lat, REFERENCE_POINT.lng], 12);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Add reference point marker
        const referenceMarker = L.marker([REFERENCE_POINT.lat, REFERENCE_POINT.lng], {
            draggable: false,
            icon: L.icon({
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            })
        }).addTo(map);

        referenceMarker.bindPopup("<b>The Wall - Factory</b><br>26°41'19.2\"N 88°20'57.6\"E").openPopup();

        // Add click event listener to place user marker
        map.on('click', async function(e) {
            await placeMarker(e.latlng);
        });

        // Initialize distance and cost display elements
        distanceValue = document.getElementById('distanceValue');
        extraCostValue = document.getElementById('extraCostValue');

        // Add a circle around the reference point to show the area
        L.circle([REFERENCE_POINT.lat, REFERENCE_POINT.lng], {
            color: 'blue',
            fillColor: '#30f',
            fillOpacity: 0.1,
            radius: 5000 // 5km radius
        }).addTo(map);
        
        // Initialize distance and cost to zero since no property marker is placed yet
        if (distanceValue) {
            distanceValue.textContent = '0.00';
        }
        if (extraCostValue) {
            extraCostValue.textContent = 'Rs.0';
        }
        
        // Initialize location search functionality
        initLocationSearch();
    }

    // Location Search Functionality
    function initLocationSearch() {
        const searchInput = document.getElementById('locationSearch');
        const searchResults = document.getElementById('searchResults');
        const clearSearchBtn = document.getElementById('clearSearch');
        let searchTimeout = null;

        // Debounced search function
        const debouncedSearch = debounce(async (query) => {
            if (query.length < 3) {
                hideSearchResults();
                return;
            }
            await searchLocation(query);
        }, 500);

        // Search input event listener
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                
                // Show/hide clear button
                if (clearSearchBtn) {
                    clearSearchBtn.style.display = query.length > 0 ? 'block' : 'none';
                }
                
                // Trigger search
                if (query.length >= 3) {
                    debouncedSearch(query);
                } else {
                    hideSearchResults();
                }
            });

            // Keyboard navigation
            searchInput.addEventListener('keydown', (e) => {
                const results = document.querySelectorAll('.search-result-item');
                const selected = document.querySelector('.search-result-item.selected');
                
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    const next = selected ? selected.nextElementSibling : results[0];
                    if (next) {
                        results.forEach(r => r.classList.remove('selected'));
                        next.classList.add('selected');
                    }
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    const prev = selected ? selected.previousElementSibling : results[results.length - 1];
                    if (prev) {
                        results.forEach(r => r.classList.remove('selected'));
                        prev.classList.add('selected');
                    }
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (selected) {
                        selected.click();
                    }
                } else if (e.key === 'Escape') {
                    hideSearchResults();
                    searchInput.blur();
                }
            });

            // Focus and blur events
            searchInput.addEventListener('focus', () => {
                if (searchInput.value.trim().length >= 3) {
                    debouncedSearch(searchInput.value.trim());
                }
            });

            // Close results when clicking outside
            document.addEventListener('click', (e) => {
                if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                    hideSearchResults();
                }
            });
        }

        // Clear search button
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                if (searchInput) {
                    searchInput.value = '';
                    clearSearchBtn.style.display = 'none';
                    hideSearchResults();
                    searchInput.focus();
                }
            });
        }

        // Search function using Nominatim API
        async function searchLocation(query) {
            if (!searchResults) return;

            // Show loading state
            showLoadingResults();

            try {
                const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=in&bounded=1&viewbox=86.5,27.5,90.5,25.5`;
                
                const response = await fetch(url, {
                    headers: {
                        'Accept': 'application/json',
                    }
                });
                
                if (!response.ok) {
                    throw new Error('Search failed');
                }
                
                const data = await response.json();
                
                if (data.length === 0) {
                    showNoResults();
                } else {
                    displaySearchResults(data);
                }
            } catch (error) {
                console.error('Search error:', error);
                showErrorResults();
            }
        }

        // Display search results
        function displaySearchResults(results) {
            searchResults.innerHTML = '';
            
            results.forEach((result, index) => {
                const resultItem = document.createElement('div');
                resultItem.className = 'search-result-item';
                
                const displayName = result.display_name.split(',').slice(0, 2).join(',');
                const description = result.address ? 
                    `${result.address.city || result.address.town || result.address.village || ''}, ${result.address.state || ''}`.replace(/^,\s*/, '') : 
                    result.display_name;
                
                resultItem.innerHTML = `
                    <div class="search-result-title">${displayName}</div>
                    <div class="search-result-description">${description}</div>
                    <div class="search-result-type">${result.type || 'location'}</div>
                `;
                
                resultItem.addEventListener('click', () => {
                    const lat = parseFloat(result.lat);
                    const lng = parseFloat(result.lon);
                    
                    // Place marker at selected location
                    placeMarker({ lat, lng });
                    
                    // Update search input with selected location
                    if (searchInput) {
                        searchInput.value = displayName;
                    }
                    
                    // Clear results
                    hideSearchResults();
                });
                
                searchResults.appendChild(resultItem);
            });
            
            searchResults.style.display = 'block';
        }

        // Show loading state
        function showLoadingResults() {
            searchResults.innerHTML = '<div class="search-loading">Searching...</div>';
            searchResults.style.display = 'block';
        }

        // Show no results
        function showNoResults() {
            searchResults.innerHTML = '<div class="search-error">No results found. Try a different search term.</div>';
            searchResults.style.display = 'block';
        }

        // Show error state
        function showErrorResults() {
            searchResults.innerHTML = '<div class="search-error">Error searching. Please try again.</div>';
            searchResults.style.display = 'block';
        }

        // Hide search results
        function hideSearchResults() {
            if (searchResults) {
                searchResults.style.display = 'none';
            }
        }
    }

    // Debounced distance calculation to prevent multiple rapid API calls
    const debouncedCalculateDistance = debounce(async (latlng) => {
        await calculateDistance(latlng);
    }, 500);

    // Place marker on map and calculate distance
    async function placeMarker(latlng) {
        if (marker) {
            map.removeLayer(marker);
        }

        marker = L.marker(latlng, {
            draggable: true,
            icon: L.icon({
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            })
        }).addTo(map);

        // Bind popup with coordinates
        const lat = latlng.lat !== undefined ? latlng.lat : latlng[0];
        const lng = latlng.lng !== undefined ? latlng.lng : latlng[1];
        marker.bindPopup(`<b>Property Location</b><br>Lat: ${lat.toFixed(6)}<br>Lng: ${lng.toFixed(6)}`).openPopup();

        // Calculate distance and update display
        await debouncedCalculateDistance(latlng);

        // Add drag event listener to update distance when marker is moved
        marker.on('dragend', async function(e) {
            await debouncedCalculateDistance(e.target.getLatLng());
        });
    }

    // Calculate road distance using OSRM routing API
    async function calculateDistance(latlng) {
        const lat = latlng.lat !== undefined ? latlng.lat : latlng[0];
        const lng = latlng.lng !== undefined ? latlng.lng : latlng[1];
        
        // Show loading indicator
        if (distanceValue) {
            distanceValue.textContent = 'Calculating...';
        }
        
        try {
            // Use OSRM (OpenStreetMap Routing Machine) API for road distance
            const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${REFERENCE_POINT.lng},${REFERENCE_POINT.lat};${lng},${lat}?overview=false&alternatives=false`;
            
            const response = await fetch(osrmUrl);
            const data = await response.json();
            
            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                // Distance is returned in meters, convert to kilometers
                const roadDistance = data.routes[0].distance / 1000;
                currentDistance = roadDistance;
                
                // Update distance display
                if (distanceValue) {
                    distanceValue.textContent = roadDistance.toFixed(2);
                }
                
                // Calculate extra cost (Rs. 2 per sq. ft for every KM extra)
                updateExtraCost();
                
                // Update map view to show both markers
                map.fitBounds([
                    [REFERENCE_POINT.lat, REFERENCE_POINT.lng],
                    [lat, lng]
                ], { padding: [50, 50] });
            } else {
                // Fallback to Haversine formula if OSRM fails
                calculateAerialDistance(latlng);
            }
        } catch (error) {
            console.warn('OSRM API failed, falling back to aerial distance:', error);
            // Fallback to Haversine formula if API fails
            calculateAerialDistance(latlng);
        }
    }

    // Calculate aerial distance using Haversine formula (fallback)
    function calculateAerialDistance(latlng) {
        const R = 6371; // Earth's radius in kilometers
        
        const lat1 = REFERENCE_POINT.lat * Math.PI / 180;
        const lat2 = (latlng.lat !== undefined ? latlng.lat : latlng[0]) * Math.PI / 180;
        const deltaLat = ((latlng.lat !== undefined ? latlng.lat : latlng[0]) - REFERENCE_POINT.lat) * Math.PI / 180;
        const deltaLng = ((latlng.lng !== undefined ? latlng.lng : latlng[1]) - REFERENCE_POINT.lng) * Math.PI / 180;

        const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
                  Math.cos(lat1) * Math.cos(lat2) *
                  Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        currentDistance = distance;
        
        // Update distance display
        if (distanceValue) {
            distanceValue.textContent = distance.toFixed(2);
        }

        // Calculate extra cost (Rs. 2 per sq. ft for every KM extra)
        updateExtraCost();
        
        // Update map view to show both markers
        const lat = latlng.lat !== undefined ? latlng.lat : latlng[0];
        const lng = latlng.lng !== undefined ? latlng.lng : latlng[1];
        map.fitBounds([
            [REFERENCE_POINT.lat, REFERENCE_POINT.lng],
            [lat, lng]
        ], { padding: [50, 50] });
    }

    // Update extra cost based on distance and current area
    function updateExtraCost() {
        const areaInput = document.getElementById('area');
        const area = parseFloat(areaInput.value) || 0;
        
        // Shipping cost: Free for first 10 km, then Rs. 2 per sq.ft per km for additional distance
        const shippingDistance = Math.max(0, currentDistance - 10);
        const extraCost = shippingDistance * area * 2;
        
        if (extraCostValue) {
            extraCostValue.textContent = `Rs.${Math.round(extraCost).toLocaleString('en-IN')}`;
        }
        
        // Trigger quote recalculation to include extra cost
        calculateQuote();
    }

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
            // Also update extra cost based on new area
            updateExtraCost();
        } else {
            areaInput.value = '';
            // Clear extra cost if area is invalid
            if (extraCostValue) {
                extraCostValue.textContent = 'Rs.0';
            }
        }
    }

    function calculateQuote() {
        const wallType = document.getElementById('wallType').value;
        const perimeter = parseFloat(document.getElementById('perimeter').value);
        const height = parseFloat(document.getElementById('height').value);

        if (!wallType || !perimeter || !height) {
            quoteResult.querySelector('.cost-value').textContent = 'Rs.0';
            quoteDetails.innerHTML = '';
            return;
        }

        // Calculate area
        const area = calculateArea(perimeter, height);

        // Get base price per square foot
        const basePrice = prices[wallType];

        // Calculate base total price
        const baseTotalPrice = area * basePrice;

        // Calculate shipping cost: Free for first 10 km, then Rs. 2 per sq.ft per km for additional distance
        const shippingDistance = Math.max(0, currentDistance - 10);
        const extraCost = shippingDistance * area * 2;

        // Calculate final total price
        const totalPrice = baseTotalPrice + extraCost;

        // Display result (rounded to integer)
        quoteResult.querySelector('.cost-value').textContent = `Rs.${Math.round(totalPrice).toLocaleString('en-IN')}`;
        
        // Display details (all prices rounded to integers)
        quoteDetails.innerHTML = `
            <div class="quote-breakdown">
                <h4>Cost Breakdown:</h4>
                <ul>
                    <li>Wall Type: ${wallType.charAt(0).toUpperCase() + wallType.slice(1)}</li>
                    <li>Perimeter: ${perimeter.toFixed(2)} feet</li>
                    <li>Height: ${height} feet</li>
                    <li>Area: ${area.toFixed(2)} sq.ft</li>
                    <li>Base Rate: Rs.${basePrice}/sq.ft</li>
                    <li>Base Cost: Rs.${Math.round(baseTotalPrice).toLocaleString('en-IN')}</li>
                    <li>Distance: ${currentDistance.toFixed(2)} km</li>
                    <li>Shipping Distance: ${Math.max(0, currentDistance - 10).toFixed(2)} km (free up to 10 km)</li>
                    <li>Shipping Cost: Rs.${Math.round(extraCost).toLocaleString('en-IN')}</li>
                </ul>
                <p class="disclaimer">Note: This is an estimated price. Contact us for exact pricing including taxes and installation.</p>
            </div>
        `;
    }

    // PDF Generation Function
    async function generatePDFQuote() {
        // Check if a location has been selected on the map
        if (!marker) {
            alert('Please select your property location on the map to calculate shipping distance.');
            return;
        }

        // Get the current quote data
        const wallType = document.getElementById('wallType').value;
        const perimeter = parseFloat(document.getElementById('perimeter').value);
        const height = parseFloat(document.getElementById('height').value);
        const area = calculateArea(perimeter, height);
        const basePrice = prices[wallType];
        const baseTotalPrice = area * basePrice;
        const shippingDistance = Math.max(0, currentDistance - 10);
        const extraCost = shippingDistance * area * 2;
        const totalPrice = baseTotalPrice + extraCost;

        // Check if all required fields are filled
        if (!wallType || !perimeter || !height || !area) {
            alert('Please fill in all required fields to generate a quote.');
            return;
        }

        // Show customer information form
        showCustomerInfoForm();
    }

    // Show customer information form
    function showCustomerInfoForm() {
        const customerForm = document.getElementById('customerInfoForm');
        const customerNameInput = document.getElementById('customerName');
        const customerPhoneInput = document.getElementById('customerPhone');

        if (customerForm) {
            customerForm.style.display = 'block';
            
            // Focus on name field
            if (customerNameInput) {
                customerNameInput.focus();
            }
        }
    }

    // Hide customer information form
    function hideCustomerInfoForm() {
        const customerForm = document.getElementById('customerInfoForm');
        if (customerForm) {
            customerForm.style.display = 'none';
        }
    }

    // Generate PDF with customer information and send email
    async function generatePDFWithCustomerInfo() {
        const customerNameInput = document.getElementById('customerName');
        const customerPhoneInput = document.getElementById('customerPhone');

        const customerName = customerNameInput ? customerNameInput.value.trim() : '';
        const customerPhone = customerPhoneInput ? customerPhoneInput.value.trim() : '';

        if (!customerName) {
            alert('Please enter your name.');
            customerNameInput.focus();
            return;
        }

        if (!customerPhone) {
            alert('Please enter your phone number.');
            customerPhoneInput.focus();
            return;
        }

        // Get the current quote data
        const wallType = document.getElementById('wallType').value;
        const perimeter = parseFloat(document.getElementById('perimeter').value);
        const height = parseFloat(document.getElementById('height').value);
        const area = calculateArea(perimeter, height);
        const basePrice = prices[wallType];
        const baseTotalPrice = area * basePrice;
        const shippingDistance = Math.max(0, currentDistance - 10);
        const extraCost = shippingDistance * area * 2;
        const totalPrice = baseTotalPrice + extraCost;

        // Import jsPDF
        const { jsPDF } = window.jspdf;

        // Create PDF document
        const doc = new jsPDF();
        
        // Set up colors
        const primaryColor = '#2563eb';
        const textColor = '#0f172a';
        const lightColor = '#f8fafc';

        // Add company header
        doc.setFillColor(primaryColor);
        doc.rect(0, 0, 210, 40, 'F'); // Header background

        // Company name and logo
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text('The Wall Company India', 20, 25);

        // Company details section
        doc.setTextColor(textColor);
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('Address: Lalmom, Gossainpur, West Bengal - 734014', 20, 50);
        doc.text('Phone: +91 747-8055541', 20, 56);
        doc.text('Email: thewallcompanygroup@gmail.com', 20, 62);

        // Add separator
        doc.setDrawColor(primaryColor);
        doc.setLineWidth(1);
        doc.line(20, 70, 190, 70);

        // Title
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('QUOTATION', 20, 85);

        // Date
        const today = new Date();
        const dateStr = today.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text(`Date: ${dateStr}`, 140, 85);

        // Customer Information Section
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Customer Information:', 20, 100);

        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text(`Name: ${customerName}`, 20, 110);
        doc.text(`Phone: ${customerPhone}`, 20, 118);

        // Quote Details Section
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Quote Details:', 20, 150);

        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text(`Wall Type: ${wallType.charAt(0).toUpperCase() + wallType.slice(1)}`, 20, 160);
        doc.text(`Perimeter: ${perimeter.toFixed(2)} feet`, 20, 168);
        doc.text(`Height: ${height} feet`, 20, 176);
        doc.text(`Area: ${area.toFixed(2)} sq.ft`, 20, 184);
        doc.text(`Base Rate: Rs.${basePrice}/sq.ft`, 20, 192);

        // Add separator
        doc.setDrawColor('#e2e8f0');
        doc.line(20, 200, 190, 200);

        // Cost Breakdown
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Cost Breakdown:', 20, 210);

        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text(`Base Cost: Rs.${Math.round(baseTotalPrice).toLocaleString('en-IN')}`, 20, 220);
        doc.text(`Distance: ${currentDistance.toFixed(2)} km`, 20, 228);
        doc.text(`Shipping Distance: ${Math.max(0, currentDistance - 10).toFixed(2)} km`, 20, 236);
        doc.text(`Shipping Cost: Rs.${Math.round(extraCost).toLocaleString('en-IN')}`, 20, 244);

        // Add separator
        doc.setDrawColor('#e2e8f0');
        doc.line(20, 252, 190, 252);

        // Total
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text(`Total Amount: Rs.${Math.round(totalPrice).toLocaleString('en-IN')}`, 20, 265);

        // Terms and conditions
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('Terms & Conditions:', 20, 280);
        doc.text('- This is an estimated price excluding taxes', 20, 288);
        doc.text('- Valid for 30 days from the date of issue', 20, 296);
        doc.text('- Installation charges may apply', 20, 304);
        doc.text('- Payment terms: 50% advance, 50% on delivery', 20, 312);

        // Footer
        doc.setFillColor(primaryColor);
        doc.rect(0, 320, 210, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.text('Thank you for choosing The Wall Company India', 20, 334);
        doc.text('For inquiries, contact us at +91 747-8055541', 110, 334);

        // Generate filename with date
        const filename = `Quote_${wallType}_${dateStr.replace(/\//g, '-')}.pdf`;

        // Save the PDF
        doc.save(filename);

        // Send email with quote details
        await sendQuoteEmail(customerName, customerPhone, wallType, perimeter, height, area, basePrice, baseTotalPrice, currentDistance, shippingDistance, extraCost, totalPrice, dateStr);
    }

    // Send email with quote details using web3forms
    async function sendQuoteEmail(customerName, customerPhone, wallType, perimeter, height, area, basePrice, baseTotalPrice, distance, shippingDistance, extraCost, totalPrice, dateStr) {
        // Create a temporary form element for email submission
        const tempForm = document.createElement('form');
        tempForm.method = 'POST';
        tempForm.action = 'https://api.web3forms.com/submit';
        
        // Create form data
        const formData = new FormData();
        formData.append('access_key', 'b277f5ac-4d07-42a0-b504-6281d8b47a6c');
        formData.append('subject', `New Quote Request - ${customerName}`);
        
        // Create email body with all quote details
        const emailBody = `
NEW QUOTE REQUEST

Customer Information:
- Name: ${customerName}
- Phone: ${customerPhone}

Quote Details:
- Wall Type: ${wallType.charAt(0).toUpperCase() + wallType.slice(1)}
- Perimeter: ${perimeter.toFixed(2)} feet
- Height: ${height} feet
- Area: ${area.toFixed(2)} sq.ft
- Base Rate: Rs.${basePrice}/sq.ft

Cost Breakdown:
- Base Cost: Rs.${Math.round(baseTotalPrice).toLocaleString('en-IN')}
- Distance: ${distance.toFixed(2)} km
- Shipping Distance: ${Math.max(0, distance - 10).toFixed(2)} km (free up to 10 km)
- Shipping Cost: Rs.${Math.round(extraCost).toLocaleString('en-IN')}
- Total Amount: Rs.${Math.round(totalPrice).toLocaleString('en-IN')}

Date: ${dateStr}

Note: This quote was generated automatically. Please contact the customer for further details.
        `.trim();
        
        formData.append('message', emailBody);
        formData.append('from_name', 'The Wall Company India');
        formData.append('reply_to', 'thewallcompanygroup@gmail.com');
        
        try {
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Success - show a subtle success message
                const successMsg = document.createElement('div');
                successMsg.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #10b981;
                    color: white;
                    padding: 15px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    z-index: 9999;
                    font-family: Inter, sans-serif;
                    font-size: 14px;
                    max-width: 300px;
                `;
                successMsg.textContent = 'Quote sent successfully! We will contact you soon.';
                document.body.appendChild(successMsg);
                
                // Remove message after 5 seconds
                setTimeout(() => {
                    if (successMsg.parentNode) {
                        successMsg.parentNode.removeChild(successMsg);
                    }
                }, 5000);
            } else {
                console.error('Email sending failed:', data.message);
                // Don't show error to user since PDF was already downloaded successfully
            }
        } catch (error) {
            console.error('Error sending email:', error);
            // Don't show error to user since PDF was already downloaded successfully
        }
        
        // Hide customer info form after processing
        hideCustomerInfoForm();
    }

    if (quoteForm) {
        quoteForm.addEventListener('submit', (e) => {
            e.preventDefault();
            calculateQuote();
        });
    }

    // Add event listener for download button
    const downloadQuoteBtn = document.getElementById('downloadQuoteBtn');
    if (downloadQuoteBtn) {
        downloadQuoteBtn.addEventListener('click', generatePDFQuote);
    }

    // Add event listeners for customer info form buttons
    const generatePDFBtn = document.getElementById('generatePDFBtn');
    const cancelPDFBtn = document.getElementById('cancelPDFBtn');

    if (generatePDFBtn) {
        generatePDFBtn.addEventListener('click', generatePDFWithCustomerInfo);
    }

    if (cancelPDFBtn) {
        cancelPDFBtn.addEventListener('click', hideCustomerInfoForm);
    }

    // Initialize map
    if (document.getElementById('map')) {
        initMap();
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

    // Quote result scroll behavior for desktop
    function handleQuoteResultScroll() {
        // Only apply on desktop (screen width > 1024px)
        if (window.innerWidth <= 1024) {
            return;
        }

        const quoteResult = document.getElementById('quoteResult');
        const quoteSection = document.getElementById('quote');
        const quoteContent = quoteSection ? quoteSection.querySelector('.quote-content') : null;

        if (!quoteResult || !quoteSection || !quoteContent) {
            return;
        }

        // Get positions
        const quoteSectionRect = quoteSection.getBoundingClientRect();
        const quoteContentRect = quoteContent.getBoundingClientRect();
        const quoteResultRect = quoteResult.getBoundingClientRect();
        
        // Calculate boundaries
        const viewportHeight = window.innerHeight;
        const sectionTop = quoteSectionRect.top + window.scrollY;
        const sectionBottom = quoteSectionRect.bottom + window.scrollY;
        const contentTop = quoteContentRect.top + window.scrollY;
        const contentBottom = quoteContentRect.bottom + window.scrollY;
        
        // Calculate scroll position
        const scrollTop = window.scrollY;
        const scrollBottom = scrollTop + viewportHeight;

        // Check if we're within the quote section
        if (scrollTop >= sectionTop && scrollTop < sectionBottom) {
            // We're in the quote section, allow sticky behavior
            quoteResult.style.position = 'sticky';
            quoteResult.style.top = '100px';
            quoteResult.style.maxHeight = `calc(100vh - 200px)`;
            quoteResult.style.overflowY = 'auto';
        } else {
            // We're outside the quote section, reset positioning
            quoteResult.style.position = 'relative';
            quoteResult.style.top = 'auto';
            quoteResult.style.maxHeight = 'none';
            quoteResult.style.overflowY = 'visible';
        }
    }

    // Debounced scroll handler
    const debouncedQuoteScroll = debounce(handleQuoteResultScroll, 10);

    // Initialize and add scroll listener
    handleQuoteResultScroll();
    window.addEventListener('scroll', debouncedQuoteScroll);
    window.addEventListener('resize', debouncedQuoteScroll);
    
    // Additional mobile-specific handling to ensure quote result doesn't interfere
    function handleMobileQuoteResult() {
        if (window.innerWidth <= 1024) {
            const quoteResult = document.getElementById('quoteResult');
            if (quoteResult) {
                quoteResult.style.position = 'relative';
                quoteResult.style.top = 'auto';
                quoteResult.style.maxHeight = 'none';
                quoteResult.style.overflowY = 'visible';
            }
        }
    }
    
    // Ensure mobile behavior is correct on load and resize
    handleMobileQuoteResult();
    window.addEventListener('resize', handleMobileQuoteResult);

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

    // Wall Showcase Slideshow
    const wallShowcase = document.getElementById('wallShowcase');
    if (wallShowcase) {
        // Media arrays
        const media = {
            images: [
                'images/showcase/TheWall005.jpg',
                'images/showcase/TheWall006.jpg',
                'images/showcase/TheWall009.jpg',
                'images/showcase/TheWall010.jpg',
                'images/showcase/TheWall011.jpg',
                'images/showcase/TheWall012.jpg',
                'images/showcase/TheWall016.jpg',
                'images/showcase/TheWall017.jpg',
                'images/showcase/TheWall035.jpg',
                'images/showcase/TheWall036.jpg',
                'images/showcase/TheWall037.jpg',
                'images/showcase/TheWall038.jpg',
                'images/showcase/TheWall039.jpg',
                'images/showcase/TheWall040.jpg',
                'images/showcase/TheWall041.jpg',
                'images/showcase/TheWall042.jpg',
                'images/showcase/TheWall043.jpg',
                'images/showcase/TheWall044.jpg',
                'images/showcase/TheWall045.jpg',
                'images/showcase/TheWall046.jpg',
                'images/showcase/TheWall047.jpg',
                'images/showcase/TheWall048.jpg',
                'images/showcase/TheWall049.jpg',
                'images/showcase/TheWall050.jpg',
                'images/showcase/TheWall051.jpg',
                'images/showcase/TheWall052.jpg',
                'images/showcase/TheWall053.jpg',
                'images/showcase/TheWall054.jpg',
                'images/showcase/TheWall055.jpg',
                'images/showcase/TheWall056.jpg',
                'images/showcase/TheWall057.jpg',
                'images/showcase/TheWall058.jpg',
                'images/showcase/TheWall059.jpg',
                'images/showcase/TheWall060.jpg',
                'images/showcase/TheWall061.jpg',
                'images/showcase/TheWall062.jpg',
                'images/showcase/TheWall063.jpg'
            ],
            videos: [
                'images/showcase/TheWall001.mp4',
                'images/showcase/TheWall002.mp4',
                'images/showcase/TheWall003.mp4',
                'images/showcase/TheWall004.mp4',
                'images/showcase/TheWall007.mp4',
                'images/showcase/TheWall008.mp4',
                'images/showcase/TheWall013.mp4',
                'images/showcase/TheWall014.mp4',
                'images/showcase/TheWall015.mp4',
                'images/showcase/TheWall018.mp4',
                'images/showcase/TheWall019.mp4',
                'images/showcase/TheWall020.mp4',
                'images/showcase/TheWall021.mp4',
                'images/showcase/TheWall022.mp4',
                'images/showcase/TheWall023.mp4',
                'images/showcase/TheWall024.mp4',
                'images/showcase/TheWall025.mp4',
                'images/showcase/TheWall026.mp4',
                'images/showcase/TheWall027.mp4',
                'images/showcase/TheWall028.mp4',
                'images/showcase/TheWall029.mp4',
                'images/showcase/TheWall030.mp4',
                'images/showcase/TheWall031.mp4',
                'images/showcase/TheWall032.mp4',
                'images/showcase/TheWall033.mp4',
                'images/showcase/TheWall034.mp4',
                'images/showcase/TheWall064.mp4',
                'images/showcase/TheWall065.mp4',
                'images/showcase/TheWall066.mp4',
                'images/showcase/TheWall067.mp4',
                'images/showcase/TheWall068.mp4',
                'images/showcase/TheWall069.mp4',
                'images/showcase/TheWall070.mp4',
                'images/showcase/TheWall071.mp4',
                'images/showcase/TheWall072.mp4',
                'images/showcase/TheWall073.mp4',
                'images/showcase/TheWall074.mp4',
                'images/showcase/TheWall075.mp4',
                'images/showcase/TheWall076.mp4',
                'images/showcase/TheWall077.mp4'
            ]
        };

        // Create interleaved playlist
        const playlist = [];
        const maxPairs = Math.min(media.images.length, media.videos.length);

        for (let i = 0; i < maxPairs; i++) {
            playlist.push({ type: 'image', src: media.images[i] });
            playlist.push({ type: 'video', src: media.videos[i] });
        }

        for (let i = maxPairs; i < media.videos.length; i++) {
            playlist.push({ type: 'video', src: media.videos[i] });
        }

        const showcaseContainer = document.getElementById('showcaseContainer');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        const showcaseProgress = document.getElementById('showcaseProgress');
        let currentIndex = 0;
        let autoplayInterval;
        let isPaused = false;
        let progressInterval;
        const IMAGE_DURATION = 5000;
        let progressStartTime;
        let progressDuration;

        // Create slides
        playlist.forEach((item, index) => {
            const slide = document.createElement('div');
            slide.className = 'wall-showcase-slide';
            slide.dataset.index = index;

            if (item.type === 'image') {
                const img = document.createElement('img');
                img.src = item.src;
                img.alt = `The Wall showcase ${index + 1}`;
                img.loading = 'lazy';
                img.onload = () => {
                    if (img.naturalWidth > img.naturalHeight) {
                        slide.classList.add('landscape');
                    }
                };
                slide.appendChild(img);
            } else {
                const video = document.createElement('video');
                video.src = item.src;
                video.muted = true;
                video.loop = false;
                video.playsInline = true;
                video.onloadedmetadata = () => {
                    if (video.videoWidth > video.videoHeight) {
                        slide.classList.add('landscape');
                    }
                };
                slide.appendChild(video);
            }

            showcaseContainer.appendChild(slide);
        });

        const slides = document.querySelectorAll('.wall-showcase-slide');

        function showSlide(index) {
            slides.forEach((slide, i) => {
                slide.classList.remove('active');
                const video = slide.querySelector('video');
                if (video) {
                    video.pause();
                    video.currentTime = 0;
                }
            });

            const currentSlide = slides[index];
            currentSlide.classList.add('active');
            currentIndex = index;

            const video = currentSlide.querySelector('video');
            if (video) {
                progressDuration = video.duration * 1000;
                video.play();
            } else {
                progressDuration = IMAGE_DURATION;
            }

            startProgress();
        }

        function nextSlide() {
            const nextIndex = (currentIndex + 1) % playlist.length;
            showSlide(nextIndex);
        }

        function prevSlide() {
            const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
            showSlide(prevIndex);
        }

        function startProgress() {
            if (progressInterval) clearInterval(progressInterval);
            progressStartTime = Date.now();
            showcaseProgress.style.width = '0%';
            showcaseProgress.style.transition = 'none';

            requestAnimationFrame(() => {
                showcaseProgress.style.transition = `width ${progressDuration}ms linear`;
                showcaseProgress.style.width = '100%';
            });

            progressInterval = setInterval(() => {
                const elapsed = Date.now() - progressStartTime;
                const remaining = progressDuration - elapsed;

                if (remaining <= 0) {
                    clearInterval(progressInterval);
                    if (!isPaused) {
                        nextSlide();
                    }
                }
            }, 100);
        }

        function pauseSlideshow() {
            isPaused = true;
            const currentSlide = slides[currentIndex];
            const video = currentSlide.querySelector('video');
            if (video) {
                video.pause();
            }
        }

        function resumeSlideshow() {
            isPaused = false;
            const currentSlide = slides[currentIndex];
            const video = currentSlide.querySelector('video');
            if (video) {
                video.play();
            }
            startProgress();
        }

        function toggleFullscreen() {
            if (!document.fullscreenElement) {
                wallShowcase.classList.add('fullscreen');
                wallShowcase.requestFullscreen().catch(err => {
                    wallShowcase.classList.remove('fullscreen');
                });
            } else {
                document.exitFullscreen();
            }
        }

        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement) {
                wallShowcase.classList.remove('fullscreen');
            }
        });

        // Event listeners
        prevBtn.addEventListener('click', prevSlide);
        nextBtn.addEventListener('click', nextSlide);
        fullscreenBtn.addEventListener('click', toggleFullscreen);

        wallShowcase.addEventListener('mouseenter', pauseSlideshow);
        wallShowcase.addEventListener('mouseleave', () => {
            const currentSlide = slides[currentIndex];
            const video = currentSlide.querySelector('video');
            if (video && !video.paused) return;
            resumeSlideshow();
        });

        // Video end event
        slides.forEach((slide, index) => {
            const video = slide.querySelector('video');
            if (video) {
                video.addEventListener('ended', () => {
                    if (!isPaused) {
                        nextSlide();
                    }
                });
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                prevSlide();
            } else if (e.key === 'ArrowRight') {
                nextSlide();
            } else if (e.key === 'f' || e.key === 'F') {
                toggleFullscreen();
            } else if (e.key === 'Escape' && document.fullscreenElement) {
                document.exitFullscreen();
            }
        });

        // Initialize slideshow
        showSlide(0);
    }

    // Keyboard navigation for mobile menu
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileNav.classList.contains('active')) {
            mobileNav.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
        }
    });
});