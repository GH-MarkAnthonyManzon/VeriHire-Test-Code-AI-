// Check if user is logged in
function checkAuth() {
    try {
        const sessionData = sessionStorage.getItem('verihire_session') || localStorage.getItem('verihire_session');
        
        if (!sessionData) {
            alert('Please login to access the dashboard');
            window.location.href = 'login.html';
            return null;
        }
        
        const session = JSON.parse(sessionData);
        
        // Check if user is a worker
        if (session.accountType !== 'worker') {
            alert('Access denied. This page is for workers only.');
            window.location.href = 'employer-dashboard.html';
            return null;
        }
        
        return session;
    } catch (error) {
        console.error('Auth error:', error);
        alert('Session error. Please login again.');
        window.location.href = 'login.html';
        return null;
    }
}

// Display user information
function displayUserInfo(session) {
    // Update user name in nav
    const userNameEl = document.getElementById('userName');
    if (userNameEl) {
        const firstName = session.fullName.split(' ')[0];
        userNameEl.textContent = firstName;
    }
    
    // Update welcome message
    const welcomeNameEl = document.getElementById('welcomeName');
    if (welcomeNameEl) {
        const firstName = session.fullName.split(' ')[0];
        welcomeNameEl.textContent = firstName;
    }
}

// User menu dropdown toggle
const userMenuBtn = document.getElementById('userMenuBtn');
const userDropdown = document.getElementById('userDropdown');

if (userMenuBtn && userDropdown) {
    userMenuBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        userDropdown.classList.toggle('show');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function() {
        userDropdown.classList.remove('show');
    });
}

// Logout functionality
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Clear session data
        sessionStorage.removeItem('verihire_session');
        localStorage.removeItem('verihire_session');
        
        alert('Logged out successfully');
        window.location.href = 'index.html';
    });
}

// Search functionality
const jobSearch = document.getElementById('jobSearch');
if (jobSearch) {
    jobSearch.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const searchTerm = this.value.trim();
            if (searchTerm) {
                // Redirect to browse jobs page with search query
                window.location.href = `browse-jobs.html?search=${encodeURIComponent(searchTerm)}`;
            }
        }
    });
}

const searchBtn = document.querySelector('.search-btn');
if (searchBtn) {
    searchBtn.addEventListener('click', function() {
        const searchTerm = jobSearch.value.trim();
        if (searchTerm) {
            window.location.href = `browse-jobs.html?search=${encodeURIComponent(searchTerm)}`;
        }
    });
}

// Initialize dashboard
const session = checkAuth();
if (session) {
    displayUserInfo(session);
}

console.log('Worker dashboard loaded successfully!');