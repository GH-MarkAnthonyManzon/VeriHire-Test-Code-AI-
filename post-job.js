// Check if user is logged in and is an employer
function checkAuth() {
    const sessionData = sessionStorage.getItem('verihire_session') || localStorage.getItem('verihire_session');
    
    if (!sessionData) {
        alert('Please login to access this page');
        window.location.href = 'login.html';
        return null;
    }
    
    const session = JSON.parse(sessionData);
    
    if (session.accountType !== 'employer') {
        alert('Access denied. Only employers can post jobs.');
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

// User menu dropdown toggle
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

// Logout functionality
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

// Show/hide escrow section based on job type
const jobTypeSelect = document.getElementById('jobType');
const escrowSection = document.getElementById('escrowSection');

if (jobTypeSelect && escrowSection) {
    jobTypeSelect.addEventListener('change', function() {
        const jobType = this.value;
        if (jobType === 'freelance' || jobType === 'contract') {
            escrowSection.style.display = 'block';
        } else {
            escrowSection.style.display = 'none';
            document.getElementById('useEscrow').checked = false;
        }
    });
}

// Update location field based on work location type
const workLocationSelect = document.getElementById('workLocation');
const locationInput = document.getElementById('location');

if (workLocationSelect && locationInput) {
    workLocationSelect.addEventListener('change', function() {
        if (this.value === 'remote') {
            locationInput.placeholder = 'Worldwide or specify region';
        } else {
            locationInput.placeholder = 'e.g., San Francisco, CA';
        }
    });
}

// Set minimum date for deadline to today
const deadlineInput = document.getElementById('deadline');
if (deadlineInput) {
    const today = new Date().toISOString().split('T')[0];
    deadlineInput.min = today;
}

// Generate unique job ID
function generateJobId() {
    return 'job_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Save job to localStorage
function saveJob(jobData, isDraft = false) {
    const jobs = JSON.parse(localStorage.getItem('verihire_jobs') || '[]');
    jobs.push(jobData);
    localStorage.setItem('verihire_jobs', JSON.stringify(jobs));
}

// Form validation
function validateForm() {
    const jobTitle = document.getElementById('jobTitle').value.trim();
    const jobDescription = document.getElementById('jobDescription').value.trim();
    const salaryMin = parseFloat(document.getElementById('salaryMin').value);
    const salaryMax = parseFloat(document.getElementById('salaryMax').value);
    
    // Check job title
    if (jobTitle.length < 5) {
        alert('Job title must be at least 5 characters long');
        return false;
    }
    
    // Check job description
    if (jobDescription.length < 100) {
        alert('Job description must be at least 100 characters long');
        return false;
    }
    
    // Check salary range
    if (salaryMin >= salaryMax) {
        alert('Maximum salary must be greater than minimum salary');
        return false;
    }
    
    if (salaryMin < 0 || salaryMax < 0) {
        alert('Salary values must be positive');
        return false;
    }
    
    return true;
}

// Save as draft
const saveDraftBtn = document.getElementById('saveDraftBtn');
if (saveDraftBtn) {
    saveDraftBtn.addEventListener('click', function() {
        const session = checkAuth();
        if (!session) return;
        
        const formData = new FormData(document.getElementById('postJobForm'));
        const jobData = {
            id: generateJobId(),
            employerEmail: session.email,
            employerName: session.fullName,
            companyName: session.companyName || session.fullName,
            status: 'draft',
            createdAt: new Date().toISOString(),
            ...Object.fromEntries(formData)
        };
        
        saveJob(jobData, true);
        alert('Job saved as draft!');
        window.location.href = 'employer-dashboard.html';
    });
}

// Handle form submission
const postJobForm = document.getElementById('postJobForm');
if (postJobForm) {
    postJobForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validate form
        if (!validateForm()) {
            return;
        }
        
        const session = checkAuth();
        if (!session) return;
        
        // Get form data
        const formData = new FormData(this);
        
        // Process skills (convert comma-separated to array)
        const requiredSkills = formData.get('requiredSkills').split(',').map(s => s.trim()).filter(s => s);
        const preferredSkills = formData.get('preferredSkills') ? 
            formData.get('preferredSkills').split(',').map(s => s.trim()).filter(s => s) : [];
        
        // Create job object
        const jobData = {
            id: generateJobId(),
            employerEmail: session.email,
            employerName: session.fullName,
            companyName: session.companyName || session.fullName,
            jobTitle: formData.get('jobTitle'),
            jobDescription: formData.get('jobDescription'),
            jobType: formData.get('jobType'),
            experienceLevel: formData.get('experienceLevel'),
            salaryMin: parseFloat(formData.get('salaryMin')),
            salaryMax: parseFloat(formData.get('salaryMax')),
            salaryPeriod: formData.get('salaryPeriod'),
            workLocation: formData.get('workLocation'),
            location: formData.get('location'),
            requiredSkills: requiredSkills,
            preferredSkills: preferredSkills,
            requirements: formData.get('requirements'),
            deadline: formData.get('deadline') || null,
            positions: parseInt(formData.get('positions')) || 1,
            useEscrow: formData.get('useEscrow') === 'on',
            status: 'active',
            createdAt: new Date().toISOString(),
            applications: [],
            views: 0
        };
        
        // Save to localStorage
        saveJob(jobData);
        
        // Show success message
        alert('Job posted successfully! 🎉');
        
        // Redirect to employer dashboard
        setTimeout(() => {
            window.location.href = 'employer-dashboard.html';
        }, 1000);
    });
}

// Initialize
const session = checkAuth();
if (session) {
    displayUserInfo(session);
}

console.log('Job posting page loaded successfully!');