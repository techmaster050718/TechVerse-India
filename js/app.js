/**
 * TechVerse India — Application Logic
 * Handles state, filtering, rendering, themes, and interactions.
 */

// ═══════════════════════════════════════════
// 1. DYNAMIC ICON LOADER (Lucide)
// ═══════════════════════════════════════════
(function loadLucideIcons() {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/lucide@latest/dist/umd/lucide.min.js';
    script.onload = () => {
        if (window.lucide) lucide.createIcons();
        // Dispatch event letting app know icons are ready
        window.dispatchEvent(new Event('icons-ready'));
    };
    document.head.appendChild(script);
})();

// ═══════════════════════════════════════════
// 2. APPLICATION STATE
// ═══════════════════════════════════════════
const state = {
    allCompanies: COMPANIES || [],
    filteredCompanies: [],
    displayedCompanies: [],
    displayCount: 24, // Items to show initially
    favorites: JSON.parse(localStorage.getItem('tv_favorites') || '[]'),
    compareList: [],
    currentView: localStorage.getItem('tv_view') || 'grid',
    theme: localStorage.getItem('tv_theme') || 'dark',
    activeQuickFilter: 'all'
};

// ═══════════════════════════════════════════
// 3. DOM CACHING
// ═══════════════════════════════════════════
const DOM = {
    loadingScreen: document.getElementById('loadingScreen'),
    scrollProgress: document.getElementById('scrollProgress'),
    navbar: document.getElementById('navbar'),
    mobileMenuToggle: document.getElementById('mobileMenuToggle'),
    navLinks: document.getElementById('navLinks'),
    themeToggle: document.getElementById('themeToggle'),
    favoritesCount: document.getElementById('favoritesCount'),
    heroSearch: document.getElementById('heroSearch'),
    searchSuggestions: document.getElementById('searchSuggestions'),
    quickFilters: document.querySelectorAll('.quick-filters .filter-chip'),
    tierCheckboxes: document.querySelectorAll('.tier-checkbox'),
    locationChips: document.querySelectorAll('.location-chip'),
    techChips: document.querySelectorAll('.tech-chip'),
    salaryMin: document.getElementById('salaryMin'),
    salaryMax: document.getElementById('salaryMax'),
    salaryMinLabel: document.getElementById('salaryMinLabel'),
    salaryMaxLabel: document.getElementById('salaryMaxLabel'),
    fresherToggle: document.getElementById('fresherToggle'),
    clearFilters: document.getElementById('clearFilters'),
    sortSelect: document.getElementById('sortSelect'),
    viewBtns: document.querySelectorAll('.view-btn'),
    companyGrid: document.getElementById('companyGrid'),
    resultsCount: document.getElementById('resultsCount'),
    loadMoreContainer: document.getElementById('loadMoreContainer'),
    loadMoreBtn: document.getElementById('loadMoreBtn'),
    emptyState: document.getElementById('emptyState'),
    modal: document.getElementById('companyModal'),
    modalBody: document.getElementById('modalBody'),
    modalTitle: document.getElementById('modalTitle'),
    modalCategory: document.getElementById('modalCategory'),
    modalLogo: document.getElementById('modalLogo'),
    modalFavorite: document.getElementById('modalFavorite'),
    modalClose: document.getElementById('modalClose'),
    modalCompare: document.getElementById('modalCompare'),
    modalShare: document.getElementById('modalShare'),
    compareDrawer: document.getElementById('compareDrawer'),
    compareContent: document.getElementById('compareContent'),
    compareClose: document.getElementById('compareClose'),
    mobileFilterToggle: null, // Will be set in init
    mobileFilterOverlay: document.getElementById('mobileFilterOverlay'),
    mobileFilterDrawer: document.getElementById('mobileFilterDrawer'),
    mobileFilterClose: document.getElementById('mobileFilterClose'),
    clearFiltersMobile: document.getElementById('clearFiltersMobile'),
    applyFiltersMobile: document.getElementById('applyFiltersMobile'),
    clearFiltersEmpty: document.getElementById('clearFiltersEmpty'),
    filterSidebar: document.getElementById('filterSidebar')
};

// ═══════════════════════════════════════════
// 4. INITIALIZATION
// ═══════════════════════════════════════════
function init() {
    applyTheme(state.theme);
    setupEventListeners();
    applyFilters();
    
    // Hide loading screen after a short delay to allow CSS animations
    setTimeout(() => {
        DOM.loadingScreen.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }, 800);
}

function setupEventListeners() {
    // Scroll Events
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Theme Toggle
    DOM.themeToggle.addEventListener('click', toggleTheme);
    
    // Mobile Menu
    DOM.mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    
    // Search Input
    let searchTimeout;
    DOM.heroSearch.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            renderSearchSuggestions(e.target.value);
            applyFilters();
        }, 150);
    });
    
    DOM.heroSearch.addEventListener('focus', (e) => renderSearchSuggestions(e.target.value));
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.hero-search')) {
            DOM.searchSuggestions.classList.remove('active');
        }
    });
    
    // Quick Filters
    DOM.quickFilters.forEach(chip => {
        chip.addEventListener('click', () => {
            const selectedFilter = chip.dataset.filter;
            DOM.quickFilters.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            clearAllFiltersUI();  // This resets activeQuickFilter to 'all'
            state.activeQuickFilter = selectedFilter; // Set AFTER clear so it isn't overwritten
            applyFilters();
            // Scroll to companies section so user sees the filtered results
            document.getElementById('companies').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
    
    // Sidebar Filters
    DOM.tierCheckboxes.forEach(cb => cb.addEventListener('change', applyFilters));
    DOM.locationChips.forEach(chip => chip.addEventListener('click', () => {
        chip.classList.toggle('active');
        applyFilters();
    }));
    DOM.techChips.forEach(chip => chip.addEventListener('click', () => {
        chip.classList.toggle('active');
        applyFilters();
    }));
    
    DOM.salaryMin.addEventListener('input', () => {
        updateSalaryLabels();
        applyFilters();
    });
    DOM.salaryMax.addEventListener('input', () => {
        updateSalaryLabels();
        applyFilters();
    });
    
    DOM.fresherToggle.addEventListener('change', applyFilters);
    DOM.sortSelect.addEventListener('change', applyFilters);
    
    // Clear Filters
    DOM.clearFilters.addEventListener('click', () => { clearAllFiltersUI(); applyFilters(); });
    DOM.clearFiltersEmpty.addEventListener('click', () => { clearAllFiltersUI(); applyFilters(); });
    DOM.clearFiltersMobile.addEventListener('click', () => { clearAllFiltersUI(); applyFilters(); });
    
    // View Toggle
    DOM.viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            DOM.viewBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.currentView = btn.dataset.view;
            localStorage.setItem('tv_view', state.currentView);
            renderCards();
        });
    });
    
    // Load More
    DOM.loadMoreBtn.addEventListener('click', loadMore);
    
    // Modal Events
    DOM.modalClose.addEventListener('click', closeModal);
    DOM.modal.addEventListener('click', (e) => { if (e.target === DOM.modal) closeModal(); });
    DOM.modalFavorite.addEventListener('click', handleModalFavorite);
    DOM.modalCompare.addEventListener('click', handleModalCompare);
    DOM.modalShare.addEventListener('click', handleModalShare);
    
    // Compare Drawer
    DOM.compareClose.addEventListener('click', toggleCompareDrawer);
    
    // Mobile Filters
    setupMobileFilters();
    
    // Keyboard Shortcuts
    document.addEventListener('keydown', handleKeyboard);
    
    // Window resize (close mobile menus)
    window.addEventListener('resize', () => {
        if (window.innerWidth > 1023) {
            DOM.mobileFilterDrawer.classList.remove('active');
            DOM.mobileFilterOverlay.classList.remove('active');
            DOM.navLinks.style.display = '';
            DOM.mobileMenuToggle.classList.remove('active');
        }
    });
}

// ═══════════════════════════════════════════
// 5. FILTERING & SEARCH LOGIC
// ═══════════════════════════════════════════
function applyFilters() {
    let result = [...state.allCompanies];
    const query = DOM.heroSearch.value.toLowerCase().trim();
    
    // 1. Quick Filter Override
    if (state.activeQuickFilter !== 'all') {
        // Each filter key maps to one or more tags (OR logic — match any of them)
        const tagMap = {
            'python': ['python'],
            'cloud': ['cloud', 'devops'],
            'app': ['android', 'mobile'],
            'fresher': ['fresher']
        };
        const tags = tagMap[state.activeQuickFilter];
        if (tags) {
            result = result.filter(c => tags.some(tag => c.tags.includes(tag)));
        }
    }

    // 2. Text Search (Fuzzy-ish)
    if (query) {
        const terms = query.split(/\s+/);
        result = result.filter(company => {
            const searchString = `
                ${company.name} 
                ${company.category} 
                ${company.roles.join(' ')} 
                ${company.techStack.join(' ')} 
                ${company.indiaLocations.join(' ')} 
                ${company.tags.join(' ')}
            `.toLowerCase();
            return terms.every(term => searchString.includes(term));
        });
    }

    // 3. Tier Checkboxes
    const activeTiers = [...DOM.tierCheckboxes].filter(cb => cb.checked).map(cb => parseInt(cb.value));
    if (activeTiers.length > 0) {
        result = result.filter(c => activeTiers.includes(c.tier));
    }

    // 4. Location Chips
    const activeLocations = [...DOM.locationChips].filter(c => c.classList.contains('active')).map(c => c.dataset.location);
    if (activeLocations.length > 0) {
        result = result.filter(c => c.indiaLocations.some(loc => activeLocations.includes(loc)));
    }

    // 5. Tech Stack Chips
    const activeTechs = [...DOM.techChips].filter(c => c.classList.contains('active')).map(c => c.dataset.tech);
    if (activeTechs.length > 0) {
        result = result.filter(c => activeTechs.some(tech => c.techStack.includes(tech)));
    }

    // 6. Salary Range
    const minSalary = parseInt(DOM.salaryMin.value);
    const maxSalary = parseInt(DOM.salaryMax.value);
    if (minSalary > 0 || maxSalary < 200) {
        result = result.filter(c => {
            const cMin = parseMinSalary(c.fresherPackage);
            return cMin !== null && cMin >= minSalary && cMin <= maxSalary;
        });
    }

    // 7. Fresher Friendly
    if (DOM.fresherToggle.checked) {
        result = result.filter(c => c.fresherFriendly);
    }

    // 8. Sorting
    const sortValue = DOM.sortSelect.value;
    result.sort((a, b) => {
        if (sortValue === 'name-asc') return a.name.localeCompare(b.name);
        if (sortValue === 'name-desc') return b.name.localeCompare(a.name);
        if (sortValue === 'package-high') return comparePackages(a, b, true);
        if (sortValue === 'package-low') return comparePackages(a, b);
        if (sortValue === 'fresher-first') return (b.fresherFriendly ? 1 : 0) - (a.fresherFriendly ? 1 : 0);
        return 0;
    });

    state.filteredCompanies = result;
    state.displayCount = 24; // Reset pagination on filter change
    renderUI();
}

function parseMinSalary(str) {
    if (!str) return null;
    // Extracts the first number found in the string (e.g., "₹3.5–9 LPA" -> 3.5)
    const match = str.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : null;
}

function comparePackages(a, b, descending = false) {
    const first = parseMinSalary(a.fresherPackage);
    const second = parseMinSalary(b.fresherPackage);
    if (first === null) return second === null ? 0 : 1;
    if (second === null) return -1;
    return descending ? second - first : first - second;
}

function clearAllFiltersUI() {
    DOM.heroSearch.value = '';
    DOM.tierCheckboxes.forEach(cb => cb.checked = false);
    DOM.locationChips.forEach(c => c.classList.remove('active'));
    DOM.techChips.forEach(c => c.classList.remove('active'));
    DOM.salaryMin.value = 0;
    DOM.salaryMax.value = 200;
    DOM.fresherToggle.checked = false;
    updateSalaryLabels();
    DOM.quickFilters.forEach(c => c.classList.remove('active'));
    document.querySelector('.quick-filters [data-filter="all"]').classList.add('active');
    state.activeQuickFilter = 'all';
    
    // Sync mobile filters if they exist
    document.querySelectorAll('#mobileFilterBody .tier-checkbox').forEach(cb => cb.checked = false);
    document.querySelectorAll('#mobileFilterBody .location-chip, #mobileFilterBody .tech-chip').forEach(c => c.classList.remove('active'));
}

function updateSalaryLabels() {
    const min = DOM.salaryMin.value;
    const max = DOM.salaryMax.value;
    DOM.salaryMinLabel.textContent = min == 0 ? '₹0L' : `₹${min}L`;
    DOM.salaryMaxLabel.textContent = max >= 200 ? '₹2Cr+' : `₹${max}L`;
}

// ═══════════════════════════════════════════
// 6. RENDERING LOGIC
// ═══════════════════════════════════════════
function renderUI() {
    renderCards();
    updateResultsCount();
    updateFavoritesUI();
}

function renderCards() {
    const companiesToRender = state.filteredCompanies.slice(0, state.displayCount);
    
    if (companiesToRender.length === 0) {
        DOM.companyGrid.innerHTML = '';
        DOM.emptyState.style.display = 'block';
        DOM.loadMoreContainer.style.display = 'none';
        return;
    }

    DOM.emptyState.style.display = 'none';
    
    const isListView = state.currentView === 'list';
    DOM.companyGrid.className = isListView ? 'company-grid list-view' : 'company-grid';

    DOM.companyGrid.innerHTML = companiesToRender.map((company, index) => {
        const isFav = state.favorites.includes(company.id);
        const displayRoles = company.roles.slice(0, 3);
        const extraRoles = company.roles.length - 3;
        
        return `
            <article class="company-card" data-id="${company.id}" style="animation-delay: ${index * 0.05}s" tabindex="0" role="button" aria-label="View details for ${company.name}">
                <div class="card-header">
                    <div class="card-logo" style="background: linear-gradient(135deg, ${company.brandColor}, ${adjustColor(company.brandColor, -30)})">
                        ${company.logoLetter}
                    </div>
                    <button class="card-favorite ${isFav ? 'active' : ''}" data-fav-id="${company.id}" aria-label="${isFav ? 'Remove from' : 'Add to'} favorites">
                        <i data-lucide="heart"></i>
                    </button>
                </div>
                <div class="card-body">
                    <h3 class="card-name">${company.name}</h3>
                    <p class="card-category">${company.category}</p>
                    <div class="card-tier">
                        <span class="tier-badge tier-${company.tier}">Tier ${company.tier}</span>
                    </div>
                    <div class="card-roles">
                        ${displayRoles.map(r => `<span class="role-chip">${r}</span>`).join('')}
                        ${extraRoles > 0 ? `<span class="role-more">+${extraRoles} more</span>` : ''}
                    </div>
                    <div class="card-locations">
                        ${company.indiaLocations.slice(0, 3).map(loc => `<span class="location-dot">${loc}</span>`).join('')}
                    </div>
                    <div class="card-package">
                        <span class="package-label">Fresher Pkg</span>
                        <span class="package-value">${company.fresherPackage}</span>
                    </div>
                    <div class="card-cta">
                        View Details <i data-lucide="arrow-right" style="width:16px;height:16px"></i>
                    </div>
                </div>
            </article>
        `;
    }).join('');

    // Load More Button Logic
    if (state.filteredCompanies.length > state.displayCount) {
        DOM.loadMoreContainer.style.display = 'block';
        DOM.loadMoreBtn.textContent = `Load More (${state.filteredCompanies.length - state.displayCount} remaining)`;
    } else {
        DOM.loadMoreContainer.style.display = 'none';
    }

    // Re-initialize icons for newly added DOM elements
    if (window.lucide) lucide.createIcons();
    bindCardEvents();
}

function bindCardEvents() {
    // Open Modal
    document.querySelectorAll('.company-card').forEach(card => {
        const handler = (e) => {
            if (e.target.closest('.card-favorite')) return; // Don't open modal if clicking favorite
            const id = card.dataset.id;
            openModal(id);
        };
        card.addEventListener('click', handler);
        card.addEventListener('keydown', (e) => { if (e.key === 'Enter') handler(e); });
    });

    // Toggle Favorite
    document.querySelectorAll('.card-favorite').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.favId;
            toggleFavorite(id);
            btn.classList.toggle('active');
        });
    });
}

function updateResultsCount() {
    const total = state.filteredCompanies.length;
    const showing = Math.min(state.displayCount, total);
    DOM.resultsCount.textContent = `Showing ${showing} of ${total} companies`;
}

// ═══════════════════════════════════════════
// 7. MODAL LOGIC
// ═══════════════════════════════════════════
let currentModalCompanyId = null;

function openModal(id) {
    const company = state.allCompanies.find(c => c.id === id);
    if (!company) return;
    
    currentModalCompanyId = id;
    
    // Update Header
    DOM.modalLogo.style.background = `linear-gradient(135deg, ${company.brandColor}, ${adjustColor(company.brandColor, -30)})`;
    DOM.modalLogo.textContent = company.logoLetter;
    DOM.modalTitle.textContent = company.name;
    DOM.modalCategory.textContent = company.category;
    
    // Update Favorite Button State
    DOM.modalFavorite.classList.toggle('active', state.favorites.includes(id));

    // Build Body Content
    DOM.modalBody.innerHTML = `
        <div class="modal-section">
            <h3><i data-lucide="info"></i> About</h3>
            <p class="modal-about">${company.about}</p>
        </div>
        
        <div class="modal-section">
            <h3><i data-lucide="map-pin"></i> India Locations</h3>
            <div class="modal-locations">
                ${company.indiaLocations.map(loc => `<span class="modal-location-chip">${loc}</span>`).join('')}
            </div>
            <p style="margin-top: 0.5rem; font-size: 0.875rem; color: var(--text-muted)">HQ: ${company.hq}</p>
        </div>
        
        <div class="modal-section">
            <h3><i data-lucide="briefcase"></i> Roles Offered</h3>
            <div class="modal-roles-list">
                ${company.roles.map(r => `<span class="modal-role-chip">${r}</span>`).join('')}
            </div>
        </div>
        
        <div class="modal-section">
            <h3><i data-lucide="code-2"></i> Tech Stack</h3>
            <div class="modal-tech-list">
                ${company.techStack.map(t => `<span class="modal-tech-chip">${t}</span>`).join('')}
            </div>
        </div>
        
        <div class="modal-section">
            <h3><i data-lucide="indian-rupee"></i> Compensation</h3>
            <div class="modal-packages">
                <div class="modal-package-card fresher">
                    <div class="modal-package-label">Fresher Package</div>
                    <div class="modal-package-value">${company.fresherPackage}</div>
                </div>
                <div class="modal-package-card experienced">
                    <div class="modal-package-label">Experienced Package</div>
                    <div class="modal-package-value">${company.experiencePackage}</div>
                </div>
            </div>
        </div>
        
        <div class="modal-section">
            <h3><i data-lucide="star"></i> Top Skills Required</h3>
            <div class="modal-skills-list">
                ${company.skillsToHighlight.map(s => `<span class="modal-skill-chip">${s}</span>`).join('')}
            </div>
        </div>
        
        <div class="modal-section">
            <h3><i data-lucide="lightbulb"></i> Why Hire Here?</h3>
            <div class="modal-notes">${company.notes}</div>
        </div>
        
        <div class="modal-section" style="display: flex; gap: 1rem; flex-wrap: wrap;">
            <a href="${company.careerPage}" target="_blank" rel="noopener" class="modal-career-link">
                Visit Career Page <i data-lucide="external-link" style="width:16px;height:16px"></i>
            </a>
        </div>
    `;

    // Show Modal
    DOM.modal.classList.add('active');
    DOM.modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    
    if (window.lucide) lucide.createIcons();
}

function closeModal() {
    DOM.modal.classList.remove('active');
    DOM.modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = 'auto';
    currentModalCompanyId = null;
}

// ═══════════════════════════════════════════
// 8. FAVORITES LOGIC
// ═══════════════════════════════════════════
function toggleFavorite(id) {
    const index = state.favorites.indexOf(id);
    if (index > -1) {
        state.favorites.splice(index, 1);
    } else {
        state.favorites.push(id);
    }
    localStorage.setItem('tv_favorites', JSON.stringify(state.favorites));
    updateFavoritesUI();
}

function updateFavoritesUI() {
    DOM.favoritesCount.textContent = state.favorites.length;
    // Update modal button if open
    if (currentModalCompanyId) {
        DOM.modalFavorite.classList.toggle('active', state.favorites.includes(currentModalCompanyId));
    }
}

function handleModalFavorite() {
    if (currentModalCompanyId) {
        toggleFavorite(currentModalCompanyId);
    }
}

function handleModalShare() {
    if (navigator.share && currentModalCompanyId) {
        const company = state.allCompanies.find(c => c.id === currentModalCompanyId);
        navigator.share({
            title: `${company.name} - TechVerse India`,
            text: `Check out ${company.name} on TechVerse India!`,
            url: window.location.href
        }).catch(() => {});
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
    }
}

// ═══════════════════════════════════════════
// 9. COMPARE LOGIC
// ═══════════════════════════════════════════
function handleModalCompare() {
    if (!currentModalCompanyId) return;
    
    const index = state.compareList.indexOf(currentModalCompanyId);
    if (index > -1) {
        state.compareList.splice(index, 1);
    } else {
        if (state.compareList.length >= 2) {
            state.compareList.shift(); // Remove oldest if max reached
        }
        state.compareList.push(currentModalCompanyId);
    }
    
    renderCompare();
    if (state.compareList.length > 0) {
        DOM.compareDrawer.classList.add('active');
    }
}

function renderCompare() {
    if (state.compareList.length === 0) {
        DOM.compareContent.innerHTML = `
            <div class="compare-empty">
                <i data-lucide="git-compare"></i>
                <p>Select 2 companies to compare</p>
            </div>`;
        DOM.compareDrawer.classList.remove('active');
        if(window.lucide) lucide.createIcons();
        return;
    }

    const companies = state.compareList.map(id => state.allCompanies.find(c => c.id === id)).filter(Boolean);
    
    DOM.compareContent.innerHTML = `
        <table class="compare-table">
            <thead>
                <tr>
                    <th>Feature</th>
                    ${companies.map(c => `
                        <th>
                            <div class="compare-company-header">
                                <div class="compare-company-logo" style="background: ${c.brandColor}">${c.logoLetter}</div>
                                <div>
                                    <strong>${c.name}</strong>
                                    <div style="font-size:0.75rem;color:var(--text-muted);font-weight:normal">${c.category}</div>
                                </div>
                                <button class="compare-remove" data-remove-id="${c.id}" aria-label="Remove ${c.name}">
                                    <i data-lucide="x" style="width:14px;height:14px"></i>
                                </button>
                            </div>
                        </th>
                    `).join('')}
                </tr>
            </thead>
            <tbody>
                <tr><td>Tier</td>${companies.map(c => `<td><span class="tier-badge tier-${c.tier}">Tier ${c.tier}</span></td>`).join('')}</tr>
                <tr><td>Fresher Friendly</td>${companies.map(c => `<td>${c.fresherFriendly ? '✅ Yes' : '❌ No'}</td>`).join('')}</tr>
                <tr><td>Fresher Package</td>${companies.map(c => `<td><strong>${c.fresherPackage}</strong></td>`).join('')}</tr>
                <tr><td>Experienced Pkg</td>${companies.map(c => `<td>${c.experiencePackage}</td>`).join('')}</tr>
                <tr><td>Locations</td>${companies.map(c => `<td>${c.indiaLocations.join(', ')}</td>`).join('')}</tr>
                <tr><td>Key Roles</td>${companies.map(c => `<td>${c.roles.slice(0,4).join(', ')}</td>`).join('')}</tr>
                <tr><td>Tech Stack</td>${companies.map(c => `<td>${c.techStack.slice(0,5).join(', ')}</td>`).join('')}</tr>
                <tr><td>Top Skills</td>${companies.map(c => `<td>${c.skillsToHighlight.join(', ')}</td>`).join('')}</tr>
            </tbody>
        </table>
    `;

    // Bind remove buttons
    DOM.compareContent.querySelectorAll('.compare-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            const idToRemove = btn.dataset.removeId;
            state.compareList = state.compareList.filter(id => id !== idToRemove);
            renderCompare();
        });
    });

    if(window.lucide) lucide.createIcons();
}

function toggleCompareDrawer() {
    DOM.compareDrawer.classList.remove('active');
    state.compareList = []; // Clear on manual close
    renderCompare();
}

// ═══════════════════════════════════════════
// 10. SEARCH SUGGESTIONS
// ═══════════════════════════════════════════
function renderSearchSuggestions(query) {
    if (!query || query.length < 2) {
        DOM.searchSuggestions.classList.remove('active');
        return;
    }
    
    const results = state.allCompanies
        .filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5);

    if (results.length === 0) {
        DOM.searchSuggestions.classList.remove('active');
        return;
    }

    DOM.searchSuggestions.innerHTML = results.map(c => `
        <div class="search-suggestion" data-id="${c.id}">
            <div class="search-suggestion-logo" style="background: ${c.brandColor}">${c.logoLetter}</div>
            <div class="search-suggestion-info">
                <div class="search-suggestion-name">${c.name}</div>
                <div class="search-suggestion-meta">${c.category} · ${c.indiaLocations[0]}</div>
            </div>
        </div>
    `).join('');

    DOM.searchSuggestions.classList.add('active');

    // Bind click events to suggestions
    DOM.searchSuggestions.querySelectorAll('.search-suggestion').forEach(item => {
        item.addEventListener('click', () => {
            openModal(item.dataset.id);
            DOM.searchSuggestions.classList.remove('active');
            DOM.heroSearch.value = '';
            applyFilters();
        });
    });
}

// ═══════════════════════════════════════════
// 11. THEME LOGIC
// ═══════════════════════════════════════════
function toggleTheme() {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
}

function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tv_theme', theme);
}

// ═══════════════════════════════════════════
// 12. UI HELPERS & UTILITIES
// ═══════════════════════════════════════════
function handleScroll() {
    // Scroll Progress Bar
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = (scrollTop / docHeight) * 100;
    DOM.scrollProgress.style.width = `${scrollPercent}%`;

    // Navbar Shadow
    if (scrollTop > 10) {
        DOM.navbar.classList.add('scrolled');
    } else {
        DOM.navbar.classList.remove('scrolled');
    }
}

function loadMore() {
    state.displayCount += 24;
    renderCards();
    updateResultsCount();
    window.scrollTo({ top: DOM.companyGrid.offsetTop + DOM.companyGrid.offsetHeight - 100, behavior: 'smooth' });
}

function toggleMobileMenu() {
    DOM.mobileMenuToggle.classList.toggle('active');
    const isOpen = DOM.mobileMenuToggle.classList.contains('active');
    DOM.navLinks.style.display = isOpen ? 'flex' : 'none';
}

function setupMobileFilters() {
    // Create mobile filter toggle button if it doesn't exist
    if (!DOM.mobileFilterToggle) {
        DOM.mobileFilterToggle = document.createElement('button');
        DOM.mobileFilterToggle.className = 'filter-chip';
        DOM.mobileFilterToggle.style.cssText = 'display:none; margin-right: 0.5rem; border: 1px solid var(--border); padding: 0.375rem 0.875rem; border-radius: 100px; font-size: 0.8125rem;';
        DOM.mobileFilterToggle.innerHTML = `<i data-lucide="sliders-horizontal" style="width:14px;height:14px;margin-right:4px"></i> Filters`;
        DOM.mobileFilterToggle.setAttribute('aria-label', 'Open Filters');
        
        const resultsHeader = document.querySelector('.results-header');
        resultsHeader.insertBefore(DOM.mobileFilterToggle, resultsHeader.firstChild);

        // Show only on mobile/tablet
        const updateFilterBtnVisibility = () => {
            DOM.mobileFilterToggle.style.display = window.innerWidth <= 1023 ? 'inline-flex' : 'none';
        };
        updateFilterBtnVisibility();
        window.addEventListener('resize', updateFilterBtnVisibility);
        
        DOM.mobileFilterToggle.addEventListener('click', openMobileFilters);
    }

    // Clone sidebar content into mobile drawer
    const mobileBody = document.getElementById('mobileFilterBody');
    if (mobileBody && DOM.filterSidebar) {
        mobileBody.innerHTML = DOM.filterSidebar.innerHTML;
        
        // Re-bind events for cloned elements
        mobileBody.querySelectorAll('.tier-checkbox').forEach(cb => cb.addEventListener('change', () => {
            syncMobileToDesktopFilters(); applyFilters();
        }));
        mobileBody.querySelectorAll('.location-chip, .tech-chip').forEach(chip => chip.addEventListener('click', () => {
            chip.classList.toggle('active'); syncMobileToDesktopFilters(); applyFilters();
        }));
    }

    DOM.mobileFilterClose.addEventListener('click', closeMobileFilters);
    DOM.mobileFilterOverlay.addEventListener('click', closeMobileFilters);
    DOM.applyFiltersMobile.addEventListener('click', () => { syncMobileToDesktopFilters(); applyFilters(); closeMobileFilters(); });
}

function syncMobileToDesktopFilters() {
    const mobileBody = document.getElementById('mobileFilterBody');
    if (!mobileBody) return;
    
    // Sync Tiers
    const mobileTiers = mobileBody.querySelectorAll('.tier-checkbox');
    mobileTiers.forEach((mCb, i) => { if(DOM.tierCheckboxes[i]) DOM.tierCheckboxes[i].checked = mCb.checked; });
    
    // Sync Locations & Tech
    ['location-chip', 'tech-chip'].forEach(cls => {
        const mobileChips = mobileBody.querySelectorAll(`.${cls}`);
        const desktopChips = document.querySelectorAll(`#locationFilters .${cls}, #techFilters .${cls}`);
        mobileChips.forEach(mChip => {
            const desktopChip = [...desktopChips].find(d => d.dataset.location === mChip.dataset.location || d.dataset.tech === mChip.dataset.tech);
            if(desktopChip) desktopChip.classList.toggle('active', mChip.classList.contains('active'));
        });
    });
}

function openMobileFilters() {
    DOM.mobileFilterDrawer.classList.add('active');
    DOM.mobileFilterOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeMobileFilters() {
    DOM.mobileFilterDrawer.classList.remove('active');
    DOM.mobileFilterOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function handleKeyboard(e) {
    // Cmd/Ctrl + K to focus search
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        DOM.heroSearch.focus();
        DOM.heroSearch.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    // Esc to close modals/drawers
    if (e.key === 'Escape') {
        if (DOM.modal.classList.contains('active')) closeModal();
        if (DOM.compareDrawer.classList.contains('active')) toggleCompareDrawer();
        if (DOM.mobileFilterDrawer.classList.contains('active')) closeMobileFilters();
        DOM.searchSuggestions.classList.remove('active');
    }
}

/** Adjusts a hex color brightness */
function adjustColor(color, amount) {
    let col = color.replace('#', '');
    if (col.length === 3) col = col.split('').map(c => c + c).join('');
    const num = parseInt(col, 16);
    let r = Math.min(255, Math.max(0, (num >> 16) + amount));
    let g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    let b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`;
}

// ═══════════════════════════════════════════
// 13. SCROLL ANIMATIONS (Counters)
// ═══════════════════════════════════════════
function initScrollAnimations() {
    const counters = document.querySelectorAll('.stat-value[data-target], .stat-number[data-target]');
    const observerOptions = { threshold: 0.5 };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseFloat(entry.target.dataset.target);
                animateCounter(entry.target, target);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    counters.forEach(counter => observer.observe(counter));
}

function animateCounter(element, target) {
    let current = 0;
    const increment = target / 60; // ~60 frames
    const hasDecimal = target % 1 !== 0;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = hasDecimal ? current.toFixed(1) : Math.floor(current);
        }
    }, 20);
}

// ═══════════════════════════════════════════
// 14. BOOTSTRAP APP
// ═══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    // Wait briefly for icons to initialize if they are fast
    setTimeout(() => {
        init();
        initScrollAnimations();
    }, 100);
});