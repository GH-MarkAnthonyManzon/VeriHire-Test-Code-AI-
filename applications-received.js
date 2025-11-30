// Check authentication
function checkAuth() {
    const sessionData = sessionStorage.getItem('verihire_session') || localStorage.getItem('verihire_session');
    
    if (!sessionData) {
        alert('Please login to access this page');
        window.location.href = 'login.html';
        return null;
    }
    
    const session = JSON.parse(sessionData);
    
    if (session.accountType !== 'employer') {
        alert('Access denied. This page is for employers only.');
        window.location.href = 'worker-dashboard.html';
        return null;
    }
    
    return session;
}

// Display user info
function displayUserInfo(session) {
    const users = JSON.parse(localStorage.getItem('verihire_users') || '[]');
    const userData = users.find(u => u.email === session.email) || session;
    
    const userNameEl = document.getElementById('userName');
    if (userNameEl) {
        const displayName = userData.companyName || session.fullName.split(' ')[0];
        userNameEl.textContent = displayName;
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

// Get employer's jobs
function getEmployerJobs(employerEmail) {
    const jobs = JSON.parse(localStorage.getItem('verihire_jobs') || '[]');
    return jobs.filter(job => job.employerEmail === employerEmail);
}

// Get applications for employer's jobs
function getEmployerApplications(employerEmail) {
    const applications = JSON.parse(localStorage.getItem('verihire_applications') || '[]');
    return applications.filter(app => app.employerEmail === employerEmail);
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

// Get status badge
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
        return '';
    }
    
    return `
        <div class="application-card" data-status="${application.status}">
            <div class="applicant-info">
                <div class="applicant-avatar">👤</div>
                <div class="applicant-details">
                    <h4>${application.workerName}</h4>
                    <p>Applied for: <strong>${job.jobTitle}</strong></p>
                    <div class="applicant-meta">
                        <span>📧 ${application.workerEmail}</span>
                        <span>•</span>
                        <span>📅 ${formatDate(application.appliedAt)}</span>
                    </div>
                </div>
                ${getStatusBadge(application.status)}
            </div>
            <div class="application-actions-row">
                <div class="action-buttons">
                    ${application.status === 'pending' ? `
                        <button class="btn-primary btn-small" onclick="changeStatus('${application.id}', 'reviewing')">📋 Review</button>
                        <button class="btn-primary btn-small" onclick="changeStatus('${application.id}', 'shortlisted')">⭐ Shortlist</button>
                    ` : ''}
                    
                    ${application.status === 'reviewing' ? `
                        <button class="btn-primary btn-small" onclick="changeStatus('${application.id}', 'shortlisted')">⭐ Shortlist</button>
                        <button class="btn-secondary btn-small" onclick="changeStatus('${application.id}', 'rejected')">❌ Reject</button>
                    ` : ''}
                    
                    ${application.status === 'shortlisted' ? `
                        <button class="btn-primary btn-small" onclick="changeStatus('${application.id}', 'accepted')">✅ Accept</button>
                        <button class="btn-secondary btn-small" onclick="changeStatus('${application.id}', 'rejected')">❌ Reject</button>
                    ` : ''}
                    
                    ${application.status === 'rejected' ? `
                        <button class="btn-secondary btn-small" onclick="changeStatus('${application.id}', 'pending')">↩️ Restore</button>
                    ` : ''}
                    
                    ${application.status === 'accepted' ? `
                        <button class="btn-primary btn-small" disabled>✅ Accepted</button>
                    ` : ''}
                    
                    <button class="btn-secondary btn-small" onclick="viewWorkerProfile('${application.workerEmail}')">👁️ View Profile</button>
                </div>
            </div>
        </div>
    `;
}

// Display applications
let allApplications = [];
let currentJobFilter = '';
let currentStatusFilter = '';

function displayApplications() {
    const session = checkAuth();
    if (!session) return;
    
    const applicationsList = document.getElementById('applicationsList');
    const emptyState = document.getElementById('emptyState');
    
    allApplications = getEmployerApplications(session.email);
    
    // Update stats
    updateStats(allApplications);
    
    // Filter applications
    let filteredApps = allApplications;
    
    if (currentJobFilter) {
        filteredApps = filteredApps.filter(app => app.jobId === currentJobFilter);
    }
    
    if (currentStatusFilter) {
        filteredApps = filteredApps.filter(app => app.status === currentStatusFilter);
    }
    
    // Sort by date (newest first)
    filteredApps.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
    
    // Display
    if (allApplications.length === 0) {
        applicationsList.innerHTML = '';
        emptyState.classList.remove('hidden');
    } else if (filteredApps.length === 0) {
        applicationsList.innerHTML = '<div style="text-align: center; padding: 40px; color: #94a3b8;">No applications match your filters</div>';
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
    const shortlisted = applications.filter(a => a.status === 'shortlisted').length;
    
    document.getElementById('totalCount').textContent = total;
    document.getElementById('pendingCount').textContent = pending;
    document.getElementById('reviewingCount').textContent = reviewing;
    document.getElementById('shortlistedCount').textContent = shortlisted;
}

// Populate job filter dropdown
function populateJobFilter(employerEmail) {
    const jobs = getEmployerJobs(employerEmail);
    const jobFilter = document.getElementById('jobFilter');
    
    // Clear existing options except "All Jobs"
    jobFilter.innerHTML = '<option value="">All Jobs</option>';
    
    // Add job options
    jobs.forEach(job => {
        const applications = allApplications.filter(app => app.jobId === job.id);
        const option = document.createElement('option');
        option.value = job.id;
        option.textContent = `${job.jobTitle} (${applications.length})`;
        jobFilter.appendChild(option);
    });
    
    // Check URL parameter for job filter
    const urlParams = new URLSearchParams(window.location.search);
    const jobParam = urlParams.get('job');
    if (jobParam) {
        jobFilter.value = jobParam;
        currentJobFilter = jobParam;
    }
}

// Filter functionality
const jobFilter = document.getElementById('jobFilter');
const statusFilter = document.getElementById('statusFilter');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');

jobFilter.addEventListener('change', function() {
    currentJobFilter = this.value;
    displayApplications();
});

statusFilter.addEventListener('change', function() {
    currentStatusFilter = this.value;
    displayApplications();
});

clearFiltersBtn.addEventListener('click', function() {
    jobFilter.value = '';
    statusFilter.value = '';
    currentJobFilter = '';
    currentStatusFilter = '';
    displayApplications();
});

// Search functionality
const candidateSearch = document.getElementById('candidateSearch');
const searchBtn = document.getElementById('searchBtn');

function searchApplications() {
    const searchTerm = candidateSearch.value.toLowerCase().trim();
    
    if (!searchTerm) {
        displayApplications();
        return;
    }
    
    const session = checkAuth();
    if (!session) return;
    
    const applications = getEmployerApplications(session.email);
    const filtered = applications.filter(app => {
        const job = getJobDetails(app.jobId);
        if (!job) return false;
        
        return app.workerName.toLowerCase().includes(searchTerm) ||
               app.workerEmail.toLowerCase().includes(searchTerm) ||
               job.jobTitle.toLowerCase().includes(searchTerm);
    });
    
    displayFilteredApplications(filtered);
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

candidateSearch.addEventListener('input', searchApplications);
searchBtn.addEventListener('click', searchApplications);

// Change application status
window.changeStatus = function(applicationId, newStatus) {
    const statusNames = {
        'pending': 'Pending',
        'reviewing': 'Under Review',
        'shortlisted': 'Shortlisted',
        'rejected': 'Rejected',
        'accepted': 'Accepted'
    };
    
    if (!confirm(`Change application status to "${statusNames[newStatus]}"?`)) {
        return;
    }
    
    const applications = JSON.parse(localStorage.getItem('verihire_applications') || '[]');
    const application = applications.find(app => app.id === applicationId);
    
    if (application) {
        application.status = newStatus;
        localStorage.setItem('verihire_applications', JSON.stringify(applications));
        
        alert(`Application status changed to "${statusNames[newStatus]}"!`);
        displayApplications();
    }
};

// View worker profile
window.viewWorkerProfile = function(workerEmail) {
    alert('Worker profile view will be implemented in the next phase!\n\nWorker: ' + workerEmail);
    // Will redirect to worker profile page
};

// Initialize
const session = checkAuth();
if (session) {
    displayUserInfo(session);
    displayApplications();
    populateJobFilter(session.email);
}

console.log('Applications Received page loaded successfully!');