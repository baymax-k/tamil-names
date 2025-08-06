// Tamil Names Website - Enhanced with Backend Integration

// Global variables
let namesDatabase = [];
let userVotes = [];
let userFavorites = [];
let contributors = [];
let sessionId = null;

// Helper function to get the correct API base URL
function getApiBaseURL() {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000/api'
        : '/api';
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    try {
        // Initialize session
        sessionId = localStorage.getItem('tamilNamesSessionId');
        if (!sessionId) {
            const response = await fetch(`${getApiBaseURL()}/session`, { method: 'POST' });
            const data = await response.json();
            sessionId = data.sessionId;
            localStorage.setItem('tamilNamesSessionId', sessionId);
        }

        // Load data from API
        await loadDataFromAPI();
        
        // Update UI
        updateStats();
        loadFeaturedNames();
        setupEventListeners();
        
        // Initialize page-specific content
        const currentPage = getCurrentPage();
        switch(currentPage) {
            case 'names.html':
                loadAllNames();
                setupFilters();
                break;
            case 'submit.html':
                setupSubmitForm();
                break;
            case 'favorites.html':
                loadFavoriteNames();
                break;
            case 'admin.html':
                loadAdminPanel();
                break;
        }
    } catch (error) {
        console.error('Failed to initialize app:', error);
        // Fallback to local mode if API is not available
        initializeFallbackMode();
    }
}

async function loadDataFromAPI() {
    try {
        // Load names from API
        const namesResponse = await fetch(`${getApiBaseURL()}/names?status=all`);
        if (namesResponse.ok) {
            namesDatabase = await namesResponse.json();
        }
        
        // Load user votes
        const votesResponse = await fetch(`${getApiBaseURL()}/users/${sessionId}/votes`);
        if (votesResponse.ok) {
            userVotes = await votesResponse.json();
        }
        
        // Load user favorites
        const favoritesResponse = await fetch(`${getApiBaseURL()}/users/${sessionId}/favorites`);
        if (favoritesResponse.ok) {
            const favoritesList = await favoritesResponse.json();
            userFavorites = favoritesList.map(fav => fav.id);
        }
        
        // Extract contributors
        contributors = [...new Set(namesDatabase
            .filter(name => name.contributor)
            .map(name => name.contributor))];
            
        console.log('Data loaded successfully from API');
    } catch (error) {
        console.error('Failed to load data from API:', error);
        throw error;
    }
}

function initializeFallbackMode() {
    // Fallback data for when API is not available
    namesDatabase = [
        {
            id: 1,
            name: "அருண்",
            meaning: "சூரியன், செம்மையான",
            reference: "சூரிய வழிபாட்டில் பயன்படும் புனித பெயர்",
            gender: "ஆண்கள்",
            category: "தூய தமிழ்",
            votes: 28,
            contributor: "ராமேஷ்",
            status: "approved"
        },
        {
            id: 2,
            name: "கவிதா",
            meaning: "கவிதை, இலக்கியம்",
            reference: "இலக்கிய உலகின் அழகை குறிக்கும் பெயர்",
            gender: "பெண்கள்",
            category: "நவீன",
            votes: 15,
            contributor: "பிரியா",
            status: "pending"
        }
    ];
    
    userVotes = JSON.parse(localStorage.getItem('tamilNamesVotes')) || [];
    userFavorites = JSON.parse(localStorage.getItem('tamilNamesFavorites')) || [];
    contributors = ["ராமேஷ்", "பிரியா", "முருகன்"];
    
    updateStats();
    loadFeaturedNames();
    setupEventListeners();
}

function getCurrentPage() {
    return window.location.pathname.split('/').pop() || 'index.html';
}

function setupEventListeners() {
    // Mobile menu toggle
    const mobileMenu = document.getElementById('mobile-menu');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenu) {
        mobileMenu.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // Close modal events
    const modal = document.getElementById('randomNameModal');
    const closeBtn = document.querySelector('.close');
    
    if (modal && closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
}

function updateStats() {
    const totalNamesEl = document.getElementById('totalNames');
    const approvedNamesEl = document.getElementById('approvedNames');
    const contributorsEl = document.getElementById('contributors');
    
    if (totalNamesEl) {
        totalNamesEl.textContent = namesDatabase.length;
    }
    
    if (approvedNamesEl) {
        const approvedCount = namesDatabase.filter(name => 
            name.status === 'approved' || name.status === 'admin').length;
        approvedNamesEl.textContent = approvedCount;
    }
    
    if (contributorsEl) {
        contributorsEl.textContent = contributors.length;
    }
}

function loadFeaturedNames() {
    const featuredContainer = document.getElementById('featuredNames');
    if (!featuredContainer) return;
    
    // Get top 3 most voted approved names
    const featuredNames = namesDatabase
        .filter(name => name.status === 'approved' || name.status === 'admin')
        .sort((a, b) => b.votes - a.votes)
        .slice(0, 3);
    
    featuredContainer.innerHTML = featuredNames.map(name => createNameCard(name)).join('');
}

function createNameCard(name) {
    const isFavorited = userFavorites.includes(name.id);
    const hasVoted = userVotes.includes(name.id);
    
    let statusBadge = '';
    switch(name.status) {
        case 'admin':
            statusBadge = '<span class="badge badge-admin">நிர்வாக ஒப்புதல்</span>';
            break;
        case 'approved':
            statusBadge = '<span class="badge badge-approved">சமுதாய ஒப்புதல்</span>';
            break;
        default:
            statusBadge = '<span class="badge badge-pending">பரிசீலனையில்</span>';
    }
    
    const genderBadge = name.gender === 'ஆண்கள்' 
        ? '<span class="badge badge-male">ஆண்கள்</span>'
        : '<span class="badge badge-female">பெண்கள்</span>';
    
    return `
        <div class="name-card" data-id="${name.id}">
            <div class="name-header">
                <div>
                    <h3 class="name-title">${name.name}</h3>
                    <p class="name-meaning">${name.meaning}</p>
                </div>
                <button class="favorite-btn ${isFavorited ? 'favorited' : ''}" 
                        onclick="toggleFavorite(${name.id})"
                        title="${isFavorited ? 'விருப்பப்பட்டியலிலிருந்து அகற்று' : 'விருப்பப்பட்டியலில் சேர்'}">
                    ${isFavorited ? '♥' : '♡'}
                </button>
            </div>
            
            ${name.reference ? `<p class="name-reference">"${name.reference}"</p>` : ''}
            
            <div class="name-footer">
                <div class="name-badges">
                    ${statusBadge}
                    ${genderBadge}
                </div>
                
                <div class="name-actions">
                    <button class="vote-btn ${hasVoted ? 'voted' : ''}" 
                            onclick="voteForName(${name.id})"
                            title="${hasVoted ? 'வாக்கை திரும்பப் பெற' : 'வாக்களிக்க'}">
                        ${hasVoted ? 'வாக்களித்தீர்கள்' : 'வாக்களிக்க'} (${name.votes})
                    </button>
                </div>
            </div>
            
            ${name.contributor ? `
                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #eee; font-size: 0.9rem; color: #666;">
                    இந்த பெயர் ${name.contributor} அவர்களால் பகிரப்பட்டது
                </div>
            ` : ''}
        </div>
    `;
}

async function toggleFavorite(nameId) {
    try {
        const response = await fetch(`${getApiBaseURL()}/names/${nameId}/favorite`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sessionId })
        });
        
        if (response.ok) {
            const result = await response.json();
            
            if (result.isFavorite) {
                if (!userFavorites.includes(nameId)) {
                    userFavorites.push(nameId);
                }
            } else {
                const index = userFavorites.indexOf(nameId);
                if (index > -1) {
                    userFavorites.splice(index, 1);
                }
            }
            
            // Update UI
            const favoriteBtn = document.querySelector(`[data-id="${nameId}"] .favorite-btn`);
            if (favoriteBtn) {
                favoriteBtn.classList.toggle('favorited', result.isFavorite);
                favoriteBtn.innerHTML = result.isFavorite ? '♥' : '♡';
            }
            
            // If we're on favorites page, reload
            if (getCurrentPage() === 'favorites.html') {
                loadFavoriteNames();
            }
        }
    } catch (error) {
        console.error('Failed to toggle favorite:', error);
        // Fallback to localStorage
        const index = userFavorites.indexOf(nameId);
        if (index > -1) {
            userFavorites.splice(index, 1);
        } else {
            userFavorites.push(nameId);
        }
        localStorage.setItem('tamilNamesFavorites', JSON.stringify(userFavorites));
    }
}

async function voteForName(nameId) {
    try {
        const response = await fetch(`${getApiBaseURL()}/names/${nameId}/vote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sessionId })
        });
        
        if (response.ok) {
            const result = await response.json();
            
            // Update local state
            if (result.hasVoted) {
                if (!userVotes.includes(nameId)) {
                    userVotes.push(nameId);
                }
            } else {
                const index = userVotes.indexOf(nameId);
                if (index > -1) {
                    userVotes.splice(index, 1);
                }
            }
            
            // Update the name's vote count in local database
            const name = namesDatabase.find(n => n.id === nameId);
            if (name) {
                name.votes = result.votes;
            }
            
            // Update UI
            const voteBtn = document.querySelector(`[data-id="${nameId}"] .vote-btn`);
            if (voteBtn) {
                voteBtn.classList.toggle('voted', result.hasVoted);
                voteBtn.innerHTML = result.hasVoted 
                    ? `வாக்களித்தீர்கள் (${result.votes})`
                    : `வாக்களிக்க (${result.votes})`;
                voteBtn.title = result.hasVoted ? 'வாக்கை திரும்பப் பெற' : 'வாக்களிக்க';
            }
            
            updateStats();
            showMessage(result.message, 'success');
        }
    } catch (error) {
        console.error('Failed to vote:', error);
        showMessage('வாக்களிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.', 'error');
    }
}

function showRandomName() {
    const approvedNames = namesDatabase.filter(name => 
        name.status === 'approved' || name.status === 'admin');
    
    if (approvedNames.length === 0) return;
    
    const randomName = approvedNames[Math.floor(Math.random() * approvedNames.length)];
    const modal = document.getElementById('randomNameModal');
    const content = document.getElementById('randomNameContent');
    
    if (modal && content) {
        content.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <h2 style="color: #8b4513; font-size: 2.5rem; margin-bottom: 1rem;">${randomName.name}</h2>
                <p style="font-size: 1.3rem; color: #666; margin-bottom: 1rem;">${randomName.meaning}</p>
                ${randomName.reference ? `<p style="font-style: italic; color: #888; margin-bottom: 2rem;">"${randomName.reference}"</p>` : ''}
                <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
                    <span class="badge badge-${randomName.gender === 'ஆண்கள்' ? 'male' : 'female'}">
                        ${randomName.gender}
                    </span>
                    <span class="badge badge-approved">${randomName.category}</span>
                </div>
                <div style="margin-top: 2rem;">
                    <button class="btn btn-primary" onclick="goToName(${randomName.id})">
                        இந்த பெயரை விரிவாக பார்க்க
                    </button>
                </div>
            </div>
        `;
        modal.style.display = 'block';
    }
}

function goToName(nameId) {
    window.location.href = `names.html?highlight=${nameId}`;
}

function filterByCategory(category) {
    window.location.href = `names.html?category=${encodeURIComponent(category)}`;
}

// Names page specific functions
function loadAllNames() {
    const namesContainer = document.getElementById('namesContainer');
    if (!namesContainer) return;
    
    // Filter to only show approved names for public view
    let filteredNames = namesDatabase.filter(name => 
        name.status === 'approved' || name.status === 'admin');
    
    // Apply URL filters
    const urlParams = new URLSearchParams(window.location.search);
    const categoryFilter = urlParams.get('category');
    const highlightId = urlParams.get('highlight');
    
    if (categoryFilter) {
        filteredNames = filteredNames.filter(name => 
            name.category === categoryFilter || name.gender === categoryFilter
        );
        
        // Update filter UI
        const categorySelect = document.getElementById('categoryFilter');
        if (categorySelect) {
            categorySelect.value = categoryFilter;
        }
    }
    
    displayNames(filteredNames);
    
    // Highlight specific name if requested
    if (highlightId) {
        setTimeout(() => {
            const nameCard = document.querySelector(`[data-id="${highlightId}"]`);
            if (nameCard) {
                nameCard.scrollIntoView({ behavior: 'smooth' });
                nameCard.style.animation = 'highlight 2s ease-in-out';
            }
        }, 500);
    }
}

function displayNames(names) {
    const container = document.getElementById('namesContainer');
    if (!container) return;
    
    if (names.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <h3>பெயர்கள் கிடைக்கவில்லை</h3>
                <p>உங்கள் தேடல் அல்லது வடிகட்டலுக்கு பொருந்தும் பெயர்கள் எதுவும் இல்லை.</p>
                <button class="btn btn-primary" onclick="clearFilters()">அனைத்து பெயர்களையும் பார்க்க</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="names-grid">
            ${names.map(name => createNameCard(name)).join('')}
        </div>
    `;
}

function setupFilters() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const genderFilter = document.getElementById('genderFilter');
    const letterButtons = document.querySelectorAll('.letter-btn');
    
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', applyFilters);
    }
    
    if (genderFilter) {
        genderFilter.addEventListener('change', applyFilters);
    }
    
    letterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Toggle active state
            letterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyFilters();
        });
    });
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';
    const genderFilter = document.getElementById('genderFilter')?.value || '';
    const activeLetterBtn = document.querySelector('.letter-btn.active');
    const letterFilter = activeLetterBtn?.textContent || '';
    
    let filteredNames = namesDatabase.filter(name => {
        // Only show approved names
        const isApproved = name.status === 'approved' || name.status === 'admin';
        
        const matchesSearch = name.name.toLowerCase().includes(searchTerm) || 
                            name.meaning.toLowerCase().includes(searchTerm);
        
        const matchesCategory = !categoryFilter || name.category === categoryFilter;
        const matchesGender = !genderFilter || name.gender === genderFilter;
        const matchesLetter = !letterFilter || name.name.startsWith(letterFilter);
        
        return isApproved && matchesSearch && matchesCategory && matchesGender && matchesLetter;
    });
    
    displayNames(filteredNames);
}

function clearFilters() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const genderFilter = document.getElementById('genderFilter');
    
    if (searchInput) searchInput.value = '';
    if (categoryFilter) categoryFilter.value = '';
    if (genderFilter) genderFilter.value = '';
    
    document.querySelectorAll('.letter-btn').forEach(btn => btn.classList.remove('active'));
    
    // Show only approved names
    const approvedNames = namesDatabase.filter(name => 
        name.status === 'approved' || name.status === 'admin');
    displayNames(approvedNames);
}

// Submit page functions
function setupSubmitForm() {
    const form = document.getElementById('submitForm');
    if (!form) return;
    
    form.addEventListener('submit', handleSubmit);
}

async function handleSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const newName = {
        name: formData.get('name'),
        meaning: formData.get('meaning'),
        reference: formData.get('reference') || '',
        gender: formData.get('gender'),
        category: formData.get('category'),
        contributor: formData.get('contributor') || 'அநாமதேய'
    };
    
    // Validate required fields
    if (!newName.name || !newName.meaning || !newName.gender || !newName.category) {
        showMessage('தேவையான அனைத்து புலங்களையும் பூர்த்தி செய்யவும்', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${getApiBaseURL()}/names`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newName)
        });
        
        if (response.ok) {
            const result = await response.json();
            showMessage('உங்கள் பெயர் வெற்றிகரமாக சேர்க்கப்பட்டது! சமூகம் இப்போது இதை மதிப்பீடு செய்யலாம்.', 'success');
            event.target.reset();
            
            // Reload data to include the new name
            await loadDataFromAPI();
            updateStats();
        } else {
            const error = await response.json();
            showMessage(error.error || 'பெயர் சேர்க்க முடியவில்லை', 'error');
        }
    } catch (error) {
        console.error('Failed to submit name:', error);
        showMessage('சேவை கிடைக்கவில்லை. பின்னர் முயற்சிக்கவும்.', 'error');
    }
}

function showMessage(text, type) {
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const message = document.createElement('div');
    message.className = `message message-${type}`;
    message.textContent = text;
    
    const form = document.getElementById('submitForm');
    if (form) {
        form.insertBefore(message, form.firstChild);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            message.remove();
        }, 5000);
    }
}

// Favorites page functions
async function loadFavoriteNames() {
    const favoritesContainer = document.getElementById('favoritesContainer');
    if (!favoritesContainer) return;
    
    try {
        const response = await fetch(`${getApiBaseURL()}/users/${sessionId}/favorites`);
        if (response.ok) {
            const favoriteNames = await response.json();
            
            if (favoriteNames.length === 0) {
                favoritesContainer.innerHTML = `
                    <div style="text-align: center; padding: 3rem;">
                        <h3>விருப்பமான பெயர்கள் இல்லை</h3>
                        <p>நீங்கள் இன்னும் எந்த பெயரையும் விருப்பமானதாக குறிக்கவில்லை.</p>
                        <a href="names.html" class="btn btn-primary">பெயர்கள் பார்வையிட</a>
                    </div>
                `;
                return;
            }
            
            favoritesContainer.innerHTML = `
                <div class="names-grid">
                    ${favoriteNames.map(name => createNameCard(name)).join('')}
                </div>
            `;
        }
    } catch (error) {
        console.error('Failed to load favorites:', error);
        // Fallback to localStorage
        const favoriteNames = namesDatabase.filter(name => userFavorites.includes(name.id));
        
        if (favoriteNames.length === 0) {
            favoritesContainer.innerHTML = `
                <div style="text-align: center; padding: 3rem;">
                    <h3>விருப்பமான பெயர்கள் இல்லை</h3>
                    <p>நீங்கள் இன்னும் எந்த பெயரையும் விருப்பமானதாக குறிக்கவில்லை.</p>
                    <a href="names.html" class="btn btn-primary">பெயர்கள் பார்வையிட</a>
                </div>
            `;
        } else {
            favoritesContainer.innerHTML = `
                <div class="names-grid">
                    ${favoriteNames.map(name => createNameCard(name)).join('')}
                </div>
            `;
        }
    }
}

// Admin panel functions
async function loadAdminPanel() {
    const adminContainer = document.getElementById('adminContainer');
    if (!adminContainer) return;
    
    try {
        // Load admin stats
        const statsResponse = await fetch(`${getApiBaseURL()}/admin/stats`);
        const stats = await statsResponse.json();
        
        // Update admin stats in the existing UI
        document.getElementById('pendingCount').textContent = stats.pending;
        document.getElementById('approvedCount').textContent = stats.approved;
        document.getElementById('contributorsCount').textContent = stats.contributors;
        document.getElementById('totalVotes').textContent = stats.totalVotes;
        
        // Load pending names for admin review
        const pendingNames = namesDatabase.filter(name => name.status === 'pending');
        
        if (pendingNames.length === 0) {
            adminContainer.innerHTML = `
                <div style="text-align: center; padding: 3rem;">
                    <h3>ஒப்புதலுக்காக காத்திருக்கும் பெயர்கள் இல்லை</h3>
                    <p>தற்போது மதிப்பீட்டுக்காக காத்திருக்கும் பெயர்கள் எதுவும் இல்லை.</p>
                </div>
            `;
        } else {
            adminContainer.innerHTML = `
                <div class="admin-names-grid">
                    ${pendingNames.map(name => createAdminNameCard(name)).join('')}
                </div>
            `;
        }
    } catch (error) {
        console.error('Failed to load admin panel:', error);
        adminContainer.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <h3>நிர்வாக தரவு ஏற்ற முடியவில்லை</h3>
                <p>சேவையுடன் தொடர்பு கொள்ள முடியவில்லை.</p>
            </div>
        `;
    }
}

function createAdminNameCard(name) {
    return `
        <div class="admin-name-card" data-id="${name.id}">
            <div class="card-header">
                <input type="checkbox" class="name-checkbox">
                <div class="name-status">
                    <span class="badge badge-pending">பரிசீலனையில்</span>
                </div>
            </div>
            
            <div class="name-info">
                <h3 class="name-title">${name.name}</h3>
                <p class="name-meaning"><strong>அர்த்தம்:</strong> ${name.meaning}</p>
                ${name.reference ? `<p class="name-reference"><strong>குறிப்பு:</strong> ${name.reference}</p>` : ''}
                <div class="name-meta">
                    <span><strong>பாலினம்:</strong> ${name.gender}</span>
                    <span><strong>வகை:</strong> ${name.category}</span>
                    <span><strong>வாக்குகள்:</strong> ${name.votes}</span>
                </div>
                ${name.contributor ? `<p class="contributor"><strong>பங்களிப்பாளர்:</strong> ${name.contributor}</p>` : ''}
            </div>
            
            <div class="admin-actions">
                <button onclick="approveNameAsAdmin(${name.id})" class="btn btn-primary btn-sm">
                    ஒப்புதல்
                </button>
                <button onclick="editName(${name.id})" class="btn btn-secondary btn-sm">
                    திருத்து
                </button>
                <button onclick="rejectName(${name.id})" class="btn btn-outline btn-sm">
                    நீக்கு
                </button>
            </div>
        </div>
    `;
}

async function approveNameAsAdmin(nameId) {
    try {
        const response = await fetch(`${getApiBaseURL()}/admin/names/${nameId}/approve`, {
            method: 'POST'
        });
        
        if (response.ok) {
            // Update local database
            const name = namesDatabase.find(n => n.id === nameId);
            if (name) {
                name.status = 'admin';
            }
            
            // Reload admin panel
            loadAdminPanel();
            updateStats();
            showMessage('பெயர் ஒப்புதல் அளிக்கப்பட்டது', 'success');
        }
    } catch (error) {
        console.error('Failed to approve name:', error);
        showMessage('ஒப்புதல் அளிக்க முடியவில்லை', 'error');
    }
}

async function rejectName(nameId) {
    if (!confirm('இந்த பெயரை நிராகரிக்க விரும்புகிறீர்களா?')) {
        return;
    }
    
    try {
        const response = await fetch(`${getApiBaseURL()}/admin/names/${nameId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            // Remove from local database
            const index = namesDatabase.findIndex(n => n.id === nameId);
            if (index > -1) {
                namesDatabase.splice(index, 1);
            }
            
            // Reload admin panel
            loadAdminPanel();
            updateStats();
            showMessage('பெயர் நிராகரிக்கப்பட்டது', 'success');
        }
    } catch (error) {
        console.error('Failed to reject name:', error);
        showMessage('நிராகரிக்க முடியவில்லை', 'error');
    }
}

function editName(nameId) {
    // This function should open the edit modal (implementation in admin.html)
    console.log('Edit name:', nameId);
}

// Export functions for admin page
window.exportPendingNames = function() {
    const pendingNames = namesDatabase.filter(name => name.status === 'pending');
    
    if (pendingNames.length === 0) {
        alert('ஏற்றுமதி செய்ய பெயர்கள் இல்லை');
        return;
    }
    
    const csvContent = generateCSV(pendingNames);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pending-names.csv';
    a.click();
    URL.revokeObjectURL(url);
};

function generateCSV(names) {
    const headers = ['பெயர்', 'அர்த்தம்', 'குறிப்பு', 'பாலினம்', 'வகை', 'வாக்குகள்', 'பங்களிப்பாளர்'];
    const rows = names.map(name => [
        name.name,
        name.meaning,
        name.reference || '',
        name.gender,
        name.category,
        name.votes,
        name.contributor || ''
    ]);
    
    return [headers, ...rows].map(row => 
        row.map(field => `"${field}"`).join(',')
    ).join('\n');
}

// Add CSS for highlight animation and messages
const style = document.createElement('style');
style.textContent = `
    @keyframes highlight {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); box-shadow: 0 10px 30px rgba(139, 69, 19, 0.3); }
    }
    
    .message {
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 2rem;
        font-weight: 500;
    }
    
    .message-success {
        background: #e8f5e8;
        color: #2c5530;
        border: 1px solid #4caf50;
    }
    
    .message-error {
        background: #ffebee;
        color: #c62828;
        border: 1px solid #f44336;
    }
`;
document.head.appendChild(style);
