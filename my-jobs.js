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
        alert('Access denied. Only employers can view this page.');
        window.location.href = 'worker-dashboard.html';
        return null;
    }
    
    return session;
}

// Display user information
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
    const allJobs = JSON.parse(localStorage.getItem('verihire_jobs') || '[]');
    return allJobs.filter(job => job.employerEmail === employerEmail);
}

// Get applications for a job
function getJobApplications(jobId) {
    const applications = JSON.parse(localStorage.getItem('verihire_applications') || '[]');
    return applications.filter(app => app.jobId === jobId);
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

// Format salary
function formatSalary(min, max, period) {
    const minFormatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0
    }).format(min);
    
    const maxFormatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0
    }).format(max);
    
    const periodText = {
        'year': '/year',
        'month': '/month',
        'hour': '/hour',
        'project': '/project'
    }[period] || '';
    
    return `${minFormatted} - ${maxFormatted}${periodText}`;
}

// Create job card HTML
function createJobCard(job) {
    const statusBadges = {
        'active': '<span class="job-badge featured">Active</span>',
        'draft': '<span class="job-badge" style="background-color: #64748b;">Draft</span>',
        'closed': '<span class="job-badge" style="background-color: #ef4444;">Closed</span>'
    };
    
    const applications = getJobApplications(job.id);
    const applicationCount = applications.length;
    const viewCount = job.views || 0;
    
    // Create action buttons based on status
    let primaryAction = '';
    if (job.status === 'active') {
        primaryAction = `<button class="btn-secondary btn-small" data-action="close" data-job-id="${job.id}">Close Job</button>`;
    } else if (job.status === 'draft') {
        primaryAction = `<button class="btn-primary btn-small" data-action="publish" data-job-id="${job.id}">Publish</button>`;
    } else {
        primaryAction = `<button class="btn-secondary btn-small" data-action="reopen" data-job-id="${job.id}">Reopen</button>`;
    }
    
    return `
        <div class="job-card employer-job-card" data-job-id="${job.id}" data-status="${job.status}">
            <div class="job-header">
                <div class="job-title-group">
                    <h3>${job.jobTitle}</h3>
                    <p class="company-name">Posted ${formatDate(job.createdAt)}</p>
                </div>
                ${statusBadges[job.status] || ''}
            </div>
            <div class="job-details">
                <span class="job-detail-item">💰 ${formatSalary(job.salaryMin, job.salaryMax, job.salaryPeriod)}</span>
                <span class="job-detail-item">📍 ${job.location}</span>
                <span class="job-detail-item">⏰ ${job.jobType.charAt(0).toUpperCase() + job.jobType.slice(1)}</span>
            </div>
            <div class="job-skills">
                ${job.requiredSkills.slice(0, 5).map(skill => 
                    `<span class="skill-tag">${skill}</span>`
                ).join('')}
                ${job.requiredSkills.length > 5 ? `<span class="skill-tag">+${job.requiredSkills.length - 5} more</span>` : ''}
            </div>
            <div class="job-stats-row">
                <div class="job-stat">
                    <span class="stat-number">${applicationCount}</span>
                    <span class="stat-label">Applications</span>
                </div>
                <div class="job-stat">
                    <span class="stat-number">${viewCount}</span>
                    <span class="stat-label">Views</span>
                </div>
            </div>
            <div class="job-footer">
                <div>
                    ${primaryAction}
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-secondary btn-small" data-action="view-applications" data-job-id="${job.id}">View Applications</button>
                    <button class="btn-primary btn-small" data-action="edit" data-job-id="${job.id}">Edit</button>
                    <button class="btn-secondary btn-small" style="background-color: #ef4444; border-color: #ef4444; color: white;" data-action="delete" data-job-id="${job.id}">Delete</button>
                </div>
            </div>
        </div>
    `;
}

// Display jobs
let currentFilter = 'all';

function displayJobs(filter = 'all') {
    const session = checkAuth();
    if (!session) return;
    
    const jobs = getEmployerJobs(session.email);
    const jobsList = document.getElementById('jobsList');
    const emptyState = document.getElementById('emptyState');
    
    // Filter jobs
    let filteredJobs = jobs;
    if (filter !== 'all') {
        filteredJobs = jobs.filter(job => job.status === filter);
    }
    
    // Update counts
    document.getElementById('countAll').textContent = jobs.length;
    document.getElementById('countActive').textContent = jobs.filter(j => j.status === 'active').length;
    document.getElementById('countDraft').textContent = jobs.filter(j => j.status === 'draft').length;
    document.getElementById('countClosed').textContent = jobs.filter(j => j.status === 'closed').length;
    
    // Display jobs or empty state
    if (filteredJobs.length === 0) {
        jobsList.innerHTML = '';
        if (jobs.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            jobsList.innerHTML = '<div style="text-align: center; padding: 40px; color: #94a3b8;">No jobs with this status</div>';
            emptyState.classList.add('hidden');
        }
    } else {
        emptyState.classList.add('hidden');
        jobsList.innerHTML = filteredJobs.map(job => createJobCard(job)).join('');
        
        // Add event listeners after creating cards
        attachJobCardListeners();
    }
}

// Attach event listeners to job card buttons
function attachJobCardListeners() {
    // Close job buttons
    document.querySelectorAll('[data-action="close"]').forEach(btn => {
        btn.addEventListener('click', function() {
            closeJob(this.dataset.jobId);
        });
    });
    
    // Reopen job buttons
    document.querySelectorAll('[data-action="reopen"]').forEach(btn => {
        btn.addEventListener('click', function() {
            reopenJob(this.dataset.jobId);
        });
    });
    
    // Publish job buttons
    document.querySelectorAll('[data-action="publish"]').forEach(btn => {
        btn.addEventListener('click', function() {
            publishJob(this.dataset.jobId);
        });
    });
    
    // View applications buttons
    document.querySelectorAll('[data-action="view-applications"]').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            viewApplications(this.dataset.jobId);
        });
    });
    
    // Edit job buttons
    document.querySelectorAll('[data-action="edit"]').forEach(btn => {
        btn.addEventListener('click', function() {
            editJob(this.dataset.jobId);
        });
    });
    
    // Delete job buttons
    document.querySelectorAll('[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', function() {
            deleteJob(this.dataset.jobId);
        });
    });
}

// Filter tabs
const filterTabs = document.querySelectorAll('.filter-tab');

filterTabs.forEach(tab => {
    tab.addEventListener('click', function() {
        filterTabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        currentFilter = this.dataset.filter;
        displayJobs(currentFilter);
    });
});

// Job actions
function editJob(jobId) {
    alert('Job editing feature will be implemented in the next phase!');
    // Will redirect to edit page with job data
}

function deleteJob(jobId) {
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
        return;
    }
    
    const jobs = JSON.parse(localStorage.getItem('verihire_jobs') || '[]');
    const updatedJobs = jobs.filter(job => job.id !== jobId);
    localStorage.setItem('verihire_jobs', JSON.stringify(updatedJobs));
    
    alert('Job deleted successfully');
    displayJobs(currentFilter);
}

function closeJob(jobId) {
    if (!confirm('Close this job posting? You can reopen it later.')) {
        return;
    }
    
    const jobs = JSON.parse(localStorage.getItem('verihire_jobs') || '[]');
    const job = jobs.find(j => j.id === jobId);
    if (job) {
        job.status = 'closed';
        localStorage.setItem('verihire_jobs', JSON.stringify(jobs));
        alert('Job closed successfully');
        displayJobs(currentFilter);
    }
}

function reopenJob(jobId) {
    const jobs = JSON.parse(localStorage.getItem('verihire_jobs') || '[]');
    const job = jobs.find(j => j.id === jobId);
    if (job) {
        job.status = 'active';
        localStorage.setItem('verihire_jobs', JSON.stringify(jobs));
        alert('Job reopened successfully');
        displayJobs(currentFilter);
    }
}

function publishJob(jobId) {
    const jobs = JSON.parse(localStorage.getItem('verihire_jobs') || '[]');
    const job = jobs.find(j => j.id === jobId);
    if (job) {
        job.status = 'active';
        localStorage.setItem('verihire_jobs', JSON.stringify(jobs));
        alert('Job published successfully!');
        displayJobs(currentFilter);
    }
}

function viewApplications(jobId) {
    window.location.href = `applications-received.html?job=${jobId}`;
}

// Initialize
const session = checkAuth();
if (session) {
    displayUserInfo(session);
    displayJobs('all');
}

console.log('My Jobs page loaded successfully!');