// Check if user is logged in
function checkAuth() {
    const sessionData = sessionStorage.getItem('verihire_session') || localStorage.getItem('verihire_session');
    
    if (!sessionData) {
        alert('Please login to access the dashboard');
        window.location.href = 'login.html';
        return null;
    }
    
    const session = JSON.parse(sessionData);
    
    // Check if user is an employer
    if (session.accountType !== 'employer') {
        alert('Access denied. This page is for employers only.');
        window.location.href = 'worker-dashboard.html';
        return null;
    }
    
    return session;
}

// Get stored users data (for demo purposes)
function getStoredUsers() {
    return JSON.parse(localStorage.getItem('verihire_users') || '[]');
}

// Get current user's full data
function getCurrentUserData(session) {
    const users = getStoredUsers();
    return users.find(u => u.email === session.email) || session;
}

// Display user information
function displayUserInfo(session) {
    const userData = getCurrentUserData(session);
    
    // Update user name in nav
    const userNameEl = document.getElementById('userName');
    if (userNameEl) {
        // Use company name if available, otherwise use full name
        const displayName = userData.companyName || session.fullName.split(' ')[0];
        userNameEl.textContent = displayName;
    }
    
    // Update welcome message
    const welcomeNameEl = document.getElementById('welcomeName');
    if (welcomeNameEl) {
        const displayName = userData.companyName || session.fullName.split(' ')[0];
        welcomeNameEl.textContent = displayName;
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
const candidateSearch = document.getElementById('candidateSearch');
if (candidateSearch) {
    candidateSearch.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const searchTerm = this.value.trim();
            if (searchTerm) {
                // Redirect to applications page with search query
                window.location.href = `applications-received.html?search=${encodeURIComponent(searchTerm)}`;
            }
        }
    });
}

const searchBtn = document.querySelector('.search-btn');
if (searchBtn) {
    searchBtn.addEventListener('click', function() {
        const searchTerm = candidateSearch.value.trim();
        if (searchTerm) {
            window.location.href = `applications-received.html?search=${encodeURIComponent(searchTerm)}`;
        }
    });
}

// Shortlist button functionality
document.querySelectorAll('.application-card .btn-primary').forEach(button => {
    button.addEventListener('click', function(e) {
        e.preventDefault();
        const card = this.closest('.application-card');
        const candidateName = card.querySelector('h4').textContent;
        
        if (confirm(`Shortlist ${candidateName}?`)) {
            alert(`${candidateName} has been shortlisted!`);
            // In a real app, this would update the backend
        }
    });
});

// View profile button functionality
document.querySelectorAll('.application-card .btn-secondary').forEach(button => {
    button.addEventListener('click', function(e) {
        e.preventDefault();
        alert('Candidate profile view will be implemented in the next phase!');
        // Will redirect to candidate profile page
    });
});

// Edit job button functionality
document.querySelectorAll('.employer-job-card .btn-primary').forEach(button => {
    button.addEventListener('click', function(e) {
        e.preventDefault();
        alert('Job editing will be implemented in the next phase!');
        // Will redirect to edit job page
    });
});

// View applications button functionality
document.querySelectorAll('.employer-job-card .btn-secondary').forEach(button => {
    button.addEventListener('click', function(e) {
        e.preventDefault();
        const jobTitle = this.closest('.employer-job-card').querySelector('h3').textContent;
        alert(`Viewing applications for "${jobTitle}"`);
        // Will redirect to applications page filtered by job
    });
});

// Initialize dashboard
const session = checkAuth();
if (session) {
    displayUserInfo(session);
}

console.log('Employer dashboard loaded successfully!');