// Check authentication
function checkAuth() {
    try {
        const sessionData = sessionStorage.getItem('verihire_session') || localStorage.getItem('verihire_session');
        
        if (!sessionData) {
            alert('Please login to browse jobs');
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

// Get all active jobs
function getAllJobs() {
    const allJobs = JSON.parse(localStorage.getItem('verihire_jobs') || '[]');
    return allJobs.filter(job => job.status === 'active');
}

// Get worker's applications
function getWorkerApplications(workerEmail) {
    const applications = JSON.parse(localStorage.getItem('verihire_applications') || '[]');
    return applications.filter(app => app.workerEmail === workerEmail);
}

// Check if worker has applied to a job
function hasApplied(jobId, workerEmail) {
    const applications = getWorkerApplications(workerEmail);
    return applications.some(app => app.jobId === jobId);
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

// Create job card
function createJobCard(job, workerEmail) {
    const applied = hasApplied(job.id, workerEmail);
    
    return `
        <div class="job-card">
            <div class="job-header">
                <div class="company-logo">🏢</div>
                <div class="job-title-group">
                    <h3>${job.jobTitle}</h3>
                    <p class="company-name">${job.companyName}</p>
                </div>
                ${applied ? '<span class="applied-badge">Applied</span>' : ''}
            </div>
            <div class="job-details">
                <span class="job-detail-item">💰 ${formatSalary(job.salaryMin, job.salaryMax, job.salaryPeriod)}</span>
                <span class="job-detail-item">📍 ${job.location}</span>
                <span class="job-detail-item">⏰ ${job.jobType.charAt(0).toUpperCase() + job.jobType.slice(1)}</span>
                <span class="job-detail-item">📊 ${job.experienceLevel.charAt(0).toUpperCase() + job.experienceLevel.slice(1)} Level</span>
            </div>
            <div class="job-description-preview">
                <p>${job.jobDescription.substring(0, 150)}${job.jobDescription.length > 150 ? '...' : ''}</p>
            </div>
            <div class="job-skills">
                ${job.requiredSkills.slice(0, 5).map(skill => 
                    `<span class="skill-tag">${skill}</span>`
                ).join('')}
                ${job.requiredSkills.length > 5 ? `<span class="skill-tag">+${job.requiredSkills.length - 5} more</span>` : ''}
            </div>
            <div class="job-footer">
                <span class="job-posted">Posted ${formatDate(job.createdAt)}</span>
                ${applied ? 
                    '<button class="btn-secondary btn-small" disabled>Already Applied</button>' :
                    `<button class="btn-apply btn-small" data-job-id="${job.id}">Apply Now</button>`
                }
            </div>
        </div>
    `;
}

// Display jobs
let currentJobs = [];
let filteredJobs = [];

function displayJobs(jobs, workerEmail) {
    const jobsList = document.getElementById('jobsList');
    const emptyState = document.getElementById('emptyState');
    const resultsCount = document.getElementById('resultsCount');
    
    if (jobs.length === 0) {
        jobsList.innerHTML = '';
        emptyState.classList.remove('hidden');
        resultsCount.textContent = 'No jobs found';
    } else {
        emptyState.classList.add('hidden');
        resultsCount.textContent = `${jobs.length} job${jobs.length !== 1 ? 's' : ''} found`;
        jobsList.innerHTML = jobs.map(job => createJobCard(job, workerEmail)).join('');
        
        // Attach event listeners to apply buttons
        attachApplyListeners();
    }
}

// Attach apply button listeners
function attachApplyListeners() {
    document.querySelectorAll('.btn-apply').forEach(btn => {
        btn.addEventListener('click', function() {
            const jobId = this.dataset.jobId;
            applyToJob(jobId);
        });
    });
}

// Apply to job
function applyToJob(jobId) {
    const session = checkAuth();
    if (!session) return;
    
    const job = currentJobs.find(j => j.id === jobId);
    if (!job) {
        alert('Job not found');
        return;
    }
    
    if (confirm(`Apply to ${job.jobTitle} at ${job.companyName}?`)) {
        // Create application
        const application = {
            id: 'app_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            jobId: job.id,
            jobTitle: job.jobTitle,
            companyName: job.companyName,
            employerEmail: job.employerEmail,
            workerEmail: session.email,
            workerName: session.fullName,
            status: 'pending',
            appliedAt: new Date().toISOString()
        };
        
        // Save application
        const applications = JSON.parse(localStorage.getItem('verihire_applications') || '[]');
        applications.push(application);
        localStorage.setItem('verihire_applications', JSON.stringify(applications));
        
        alert('Application submitted successfully! 🎉');
        
        // Refresh display
        applyFilters();
    }
}

// Filter and sort jobs
function applyFilters() {
    const session = checkAuth();
    if (!session) return;
    
    const searchTerm = document.getElementById('jobSearch').value.toLowerCase();
    const jobType = document.getElementById('jobTypeFilter').value;
    const location = document.getElementById('locationFilter').value;
    const experience = document.getElementById('experienceFilter').value;
    const sort = document.getElementById('sortFilter').value;
    
    // Filter jobs
    filteredJobs = currentJobs.filter(job => {
        const matchesSearch = !searchTerm || 
            job.jobTitle.toLowerCase().includes(searchTerm) ||
            job.companyName.toLowerCase().includes(searchTerm) ||
            job.jobDescription.toLowerCase().includes(searchTerm) ||
            job.requiredSkills.some(skill => skill.toLowerCase().includes(searchTerm));
        
        const matchesJobType = !jobType || job.jobType === jobType;
        const matchesLocation = !location || job.workLocation === location;
        const matchesExperience = !experience || job.experienceLevel === experience;
        
        return matchesSearch && matchesJobType && matchesLocation && matchesExperience;
    });
    
    // Sort jobs
    if (sort === 'newest') {
        filteredJobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sort === 'oldest') {
        filteredJobs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sort === 'salary-high') {
        filteredJobs.sort((a, b) => b.salaryMax - a.salaryMax);
    } else if (sort === 'salary-low') {
        filteredJobs.sort((a, b) => a.salaryMin - b.salaryMin);
    }
    
    displayJobs(filteredJobs, session.email);
}

// Event listeners for filters
document.getElementById('jobSearch').addEventListener('input', applyFilters);
document.getElementById('searchBtn').addEventListener('click', applyFilters);
document.getElementById('jobTypeFilter').addEventListener('change', applyFilters);
document.getElementById('locationFilter').addEventListener('change', applyFilters);
document.getElementById('experienceFilter').addEventListener('change', applyFilters);
document.getElementById('sortFilter').addEventListener('change', applyFilters);

// Clear filters
function clearFilters() {
    document.getElementById('jobSearch').value = '';
    document.getElementById('jobTypeFilter').value = '';
    document.getElementById('locationFilter').value = '';
    document.getElementById('experienceFilter').value = '';
    document.getElementById('sortFilter').value = 'newest';
    applyFilters();
}

document.getElementById('clearFiltersBtn').addEventListener('click', clearFilters);
document.getElementById('clearFiltersBtn2').addEventListener('click', clearFilters);

// Initialize
const session = checkAuth();
if (session) {
    displayUserInfo(session);
    currentJobs = getAllJobs();
    applyFilters();
}

console.log('Browse jobs page loaded successfully!');