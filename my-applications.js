// Check authentication
function checkAuth() {
    try {
        const sessionData = sessionStorage.getItem('verihire_session') || localStorage.getItem('verihire_session');
        
        if (!sessionData) {
            alert('Please login to view your applications');
            window.location.href = 'login.html';
            return null;
        }
        
        const session = JSON.parse(sessionData);
        
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

// Display user info
function displayUserInfo(session) {
    const userNameEl = document.getElementById('userName');
    if (userNameEl) {
        const firstName = session.fullName.split(' ')[0];
        userNameEl.textContent = firstName;
    }
}

// User menu dropdown
const userMenuBtn = document.getElementById('userMenuBtn');
const userDropdown = document.getElementById('userDropdown');

if (userMenuBtn && userDropdown) {
    userMenuBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        userDropdown.classList.toggle('show');
    });
    
    document.addEventListener('click', function() {
        userDropdown.classList.remove('show');
    });
}

// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        sessionStorage.removeItem('verihire_session');
        localStorage.removeItem('verihire_session');
        alert('Logged out successfully');
        window.location.href = 'index.html';
    });
}

// Get worker's applications
function getWorkerApplications(workerEmail) {
    const applications = JSON.parse(localStorage.getItem('verihire_applications') || '[]');
    return applications.filter(app => app.workerEmail === workerEmail);
}

// Get job details
function getJobDetails(jobId) {
    const jobs = JSON.parse(localStorage.getItem('verihire_jobs') || '[]');
    return jobs.find(job => job.id === jobId);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
}

// Get status badge HTML
function getStatusBadge(status) {
    const badges = {
        'pending': '<span class="status-badge status-pending">⏳ Pending</span>',
        'reviewing': '<span class="status-badge status-reviewing">👀 Reviewing</span>',
        'shortlisted': '<span class="status-badge status-shortlisted">⭐ Shortlisted</span>',
        'rejected': '<span class="status-badge status-rejected">❌ Rejected</span>',
        'accepted': '<span class="status-badge status-accepted">✅ Accepted</span>'
    };
    return badges[status] || badges['pending'];
}

// Create application card
function createApplicationCard(application) {
    const job = getJobDetails(application.jobId);
    
    if (!job) {
        return `
            <div class="application-card">
                <div class="application-content">
                    <h3 style="color: #ef4444;">Job Not Found</h3>
                    <p>This job may have been deleted by the employer.</p>
                    <button class="btn-secondary btn-small" onclick="deleteApplication('${application.id}')">Remove</button>
                </div>
            </div>
        `;
    }
    
    return `
        <div class="application-card" data-status="${application.status}">
            <div class="application-header">
                <div class="company-logo">🏢</div>
                <div class="application-info">
                    <h3>${job.jobTitle}</h3>
                    <p class="company-name">${job.companyName}</p>
                    <div class="job-meta">
                        <span>💰 $${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}/${job.salaryPeriod}</span>
                        <span>📍 ${job.location}</span>
                        <span>⏰ ${job.jobType}</span>
                    </div>
                </div>
                ${getStatusBadge(application.status)}
            </div>
            <div class="application-details">
                <p class="applied-date">Applied ${formatDate(application.appliedAt)}</p>
                <div class="application-actions">
                    <button class="btn-secondary btn-small" onclick="viewJobDetails('${job.id}')">View Job</button>
                    <button class="btn-secondary btn-small" onclick="withdrawApplication('${application.id}')">Withdraw</button>
                </div>
            </div>
        </div>
    `;
}

// Display applications
let allApplications = [];
let currentFilter = 'all';

function displayApplications(filter = 'all') {
    const session = checkAuth();
    if (!session) return;
    
    const applicationsList = document.getElementById('applicationsList');
    const emptyState = document.getElementById('emptyState');
    
    allApplications = getWorkerApplications(session.email);
    
    // Update stats
    updateStats(allApplications);
    
    // Filter applications
    let filteredApps = allApplications;
    if (filter !== 'all') {
        filteredApps = allApplications.filter(app => app.status === filter);
    }
    
    // Sort by date (newest first)
    filteredApps.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
    
    // Display
    if (filteredApps.length === 0 && allApplications.length === 0) {
        applicationsList.innerHTML = '';
        emptyState.classList.remove('hidden');
    } else if (filteredApps.length === 0) {
        applicationsList.innerHTML = '<div style="text-align: center; padding: 40px; color: #94a3b8;">No applications with this status</div>';
        emptyState.classList.add('hidden');
    } else {
        emptyState.classList.add('hidden');
        applicationsList.innerHTML = filteredApps.map(app => createApplicationCard(app)).join('');
    }
}

// Update statistics
function updateStats(applications) {
    const total = applications.length;
    const pending = applications.filter(a => a.status === 'pending').length;
    const reviewing = applications.filter(a => a.status === 'reviewing').length;
    const rejected = applications.filter(a => a.status === 'rejected').length;
    const shortlisted = applications.filter(a => a.status === 'shortlisted').length;
    
    document.getElementById('totalCount').textContent = total;
    document.getElementById('pendingCount').textContent = pending;
    document.getElementById('reviewingCount').textContent = reviewing;
    document.getElementById('rejectedCount').textContent = rejected;
    
    document.getElementById('countAll').textContent = total;
    document.getElementById('countPending').textContent = pending;
    document.getElementById('countReviewing').textContent = reviewing;
    document.getElementById('countRejected').textContent = rejected;
    document.getElementById('countShortlisted').textContent = shortlisted;
}

// Filter tabs
const filterTabs = document.querySelectorAll('.filter-tab');

filterTabs.forEach(tab => {
    tab.addEventListener('click', function() {
        filterTabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        currentFilter = this.dataset.filter;
        displayApplications(currentFilter);
    });
});

// Search functionality
const appSearch = document.getElementById('appSearch');
const searchBtn = document.getElementById('searchBtn');

function searchApplications() {
    const searchTerm = appSearch.value.toLowerCase().trim();
    
    if (!searchTerm) {
        displayApplications(currentFilter);
        return;
    }
    
    const session = checkAuth();
    if (!session) return;
    
    const applications = getWorkerApplications(session.email);
    const filtered = applications.filter(app => {
        const job = getJobDetails(app.jobId);
        if (!job) return false;
        
        return job.jobTitle.toLowerCase().includes(searchTerm) ||
               job.companyName.toLowerCase().includes(searchTerm) ||
               job.location.toLowerCase().includes(searchTerm);
    });
    
    if (currentFilter !== 'all') {
        const statusFiltered = filtered.filter(app => app.status === currentFilter);
        displayFilteredApplications(statusFiltered);
    } else {
        displayFilteredApplications(filtered);
    }
}

function displayFilteredApplications(applications) {
    const applicationsList = document.getElementById('applicationsList');
    const emptyState = document.getElementById('emptyState');
    
    if (applications.length === 0) {
        applicationsList.innerHTML = '<div style="text-align: center; padding: 40px; color: #94a3b8;">No matching applications found</div>';
        emptyState.classList.add('hidden');
    } else {
        emptyState.classList.add('hidden');
        applications.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
        applicationsList.innerHTML = applications.map(app => createApplicationCard(app)).join('');
    }
}

appSearch.addEventListener('input', searchApplications);
searchBtn.addEventListener('click', searchApplications);

// View job details
window.viewJobDetails = function(jobId) {
    // For now, redirect to browse jobs
    // In a full implementation, this would open a job detail modal/page
    alert('Viewing job details...\n\nThis would open the full job posting in a modal or new page.');
    window.location.href = 'browse-jobs.html';
};

// Withdraw application
window.withdrawApplication = function(applicationId) {
    if (!confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
        return;
    }
    
    const applications = JSON.parse(localStorage.getItem('verihire_applications') || '[]');
    const updatedApplications = applications.filter(app => app.id !== applicationId);
    localStorage.setItem('verihire_applications', JSON.stringify(updatedApplications));
    
    alert('Application withdrawn successfully');
    displayApplications(currentFilter);
};

// Delete application (for deleted jobs)
window.deleteApplication = function(applicationId) {
    withdrawApplication(applicationId);
};

// Initialize
const session = checkAuth();
if (session) {
    displayUserInfo(session);
    displayApplications('all');
}

console.log('My Applications page loaded successfully!');