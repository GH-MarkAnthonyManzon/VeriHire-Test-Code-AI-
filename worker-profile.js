// Check authentication
function checkAuth() {
    try {
        const sessionData = sessionStorage.getItem('verihire_session') || localStorage.getItem('verihire_session');
        
        if (!sessionData) {
            alert('Please login to access your profile');
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

// Get user profile from localStorage
function getUserProfile(email) {
    const users = JSON.parse(localStorage.getItem('verihire_users') || '[]');
    return users.find(u => u.email === email);
}

// Update user profile in localStorage
function updateUserProfile(email, profileData) {
    const users = JSON.parse(localStorage.getItem('verihire_users') || '[]');
    const userIndex = users.findIndex(u => u.email === email);
    
    if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...profileData };
        localStorage.setItem('verihire_users', JSON.stringify(users));
        return true;
    }
    return false;
}

// Load profile data into form
function loadProfileData(session) {
    const profile = getUserProfile(session.email);
    
    if (!profile) return;
    
    // Basic Information
    document.getElementById('fullName').value = profile.fullName || '';
    document.getElementById('email').value = profile.email || '';
    document.getElementById('phone').value = profile.phone || '';
    document.getElementById('location').value = profile.location || '';
    document.getElementById('headline').value = profile.headline || '';
    document.getElementById('bio').value = profile.bio || '';
    
    // Professional Details
    document.getElementById('experience').value = profile.experience || '';
    document.getElementById('employmentType').value = profile.employmentType || '';
    document.getElementById('skills').value = profile.skills || '';
    document.getElementById('jobTitle').value = profile.jobTitle || '';
    document.getElementById('company').value = profile.company || '';
    
    // Education
    document.getElementById('education').value = profile.education || '';
    document.getElementById('school').value = profile.school || '';
    document.getElementById('degree').value = profile.degree || '';
    
    // Work Preferences
    document.getElementById('workLocation').value = profile.workLocation || '';
    document.getElementById('salaryMin').value = profile.salaryMin || '';
    document.getElementById('salaryMax').value = profile.salaryMax || '';
    document.getElementById('salaryPeriod').value = profile.salaryPeriod || 'year';
    document.getElementById('openToWork').checked = profile.openToWork || false;
    
    // Social Links
    document.getElementById('linkedin').value = profile.linkedin || '';
    document.getElementById('github').value = profile.github || '';
    document.getElementById('portfolio').value = profile.portfolio || '';
    document.getElementById('website').value = profile.website || '';
    
    // Update bio character count
    updateBioCount();
    
    // Calculate profile completion
    calculateProfileCompletion(profile);
}

// Calculate profile completion percentage
function calculateProfileCompletion(profile) {
    const fields = [
        profile.fullName,
        profile.email,
        profile.phone,
        profile.location,
        profile.headline,
        profile.bio,
        profile.experience,
        profile.skills,
        profile.jobTitle,
        profile.company,
        profile.education,
        profile.workLocation,
        profile.linkedin || profile.github || profile.portfolio
    ];
    
    // Filter out empty/null/undefined values
    const filledFields = fields.filter(field => {
        if (field === null || field === undefined) return false;
        if (typeof field === 'string') return field.trim() !== '';
        return true;
    }).length;
    
    const percentage = Math.round((filledFields / fields.length) * 100);
    
    // Update UI
    document.getElementById('completionPercentage').textContent = percentage + '%';
    document.getElementById('completionProgress').style.width = percentage + '%';
    
    // Update completion text
    const completionText = document.getElementById('completionText');
    if (percentage === 100) {
        completionText.textContent = '🎉 Your profile is complete! You\'re ready to impress employers!';
        completionText.style.color = '#10b981';
    } else if (percentage >= 70) {
        completionText.textContent = '👍 Great progress! Just a few more details to go.';
        completionText.style.color = '#f97316';
    } else if (percentage >= 40) {
        completionText.textContent = '📝 Keep going! Complete your profile to attract more opportunities.';
        completionText.style.color = '#fbbf24';
    } else {
        completionText.textContent = '⚠️ Your profile needs more information to stand out to employers.';
        completionText.style.color = '#ef4444';
    }
}

// Bio character counter
const bioTextarea = document.getElementById('bio');
const bioCount = document.getElementById('bioCount');

function updateBioCount() {
    const length = bioTextarea.value.length;
    bioCount.textContent = length;
    
    if (length > 500) {
        bioCount.style.color = '#ef4444';
        bioTextarea.value = bioTextarea.value.substring(0, 500);
    } else if (length > 450) {
        bioCount.style.color = '#f97316';
    } else {
        bioCount.style.color = '#94a3b8';
    }
}

bioTextarea.addEventListener('input', updateBioCount);

// Headline character limit
const headlineInput = document.getElementById('headline');
headlineInput.addEventListener('input', function() {
    if (this.value.length > 80) {
        this.value = this.value.substring(0, 80);
    }
});

// Form submission
const profileForm = document.getElementById('profileForm');

profileForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const session = checkAuth();
    if (!session) return;
    
    // Validate salary range
    const salaryMin = parseFloat(document.getElementById('salaryMin').value);
    const salaryMax = parseFloat(document.getElementById('salaryMax').value);
    
    if (salaryMin && salaryMax && salaryMin >= salaryMax) {
        alert('Maximum salary must be greater than minimum salary');
        return;
    }
    
    // Collect form data
    const profileData = {
        fullName: document.getElementById('fullName').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        location: document.getElementById('location').value.trim(),
        headline: document.getElementById('headline').value.trim(),
        bio: document.getElementById('bio').value.trim(),
        
        experience: document.getElementById('experience').value,
        employmentType: document.getElementById('employmentType').value,
        skills: document.getElementById('skills').value.trim(),
        jobTitle: document.getElementById('jobTitle').value.trim(),
        company: document.getElementById('company').value.trim(),
        
        education: document.getElementById('education').value,
        school: document.getElementById('school').value.trim(),
        degree: document.getElementById('degree').value.trim(),
        
        workLocation: document.getElementById('workLocation').value,
        salaryMin: salaryMin || null,
        salaryMax: salaryMax || null,
        salaryPeriod: document.getElementById('salaryPeriod').value,
        openToWork: document.getElementById('openToWork').checked,
        
        linkedin: document.getElementById('linkedin').value.trim(),
        github: document.getElementById('github').value.trim(),
        portfolio: document.getElementById('portfolio').value.trim(),
        website: document.getElementById('website').value.trim(),
        
        lastUpdated: new Date().toISOString()
    };
    
    // Update profile
    const success = updateUserProfile(session.email, profileData);
    
    if (success) {
        // Update session if name changed
        if (profileData.fullName !== session.fullName) {
            session.fullName = profileData.fullName;
            if (sessionStorage.getItem('verihire_session')) {
                sessionStorage.setItem('verihire_session', JSON.stringify(session));
            }
            if (localStorage.getItem('verihire_session')) {
                localStorage.setItem('verihire_session', JSON.stringify(session));
            }
            displayUserInfo(session);
        }
        
        alert('✅ Profile saved successfully!');
        
        // Get the updated profile from storage to recalculate
        const updatedProfile = getUserProfile(session.email);
        calculateProfileCompletion(updatedProfile);
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        alert('❌ Error saving profile. Please try again.');
    }
});

// Auto-save draft (optional feature)
let autoSaveTimer;
const autoSaveDelay = 30000; // 30 seconds

function enableAutoSave() {
    const formInputs = profileForm.querySelectorAll('input, textarea, select');
    
    formInputs.forEach(input => {
        input.addEventListener('input', function() {
            clearTimeout(autoSaveTimer);
            autoSaveTimer = setTimeout(() => {
                // Save as draft in sessionStorage
                const draftData = new FormData(profileForm);
                const draft = Object.fromEntries(draftData);
                sessionStorage.setItem('profile_draft_' + session.email, JSON.stringify(draft));
            }, autoSaveDelay);
        });
    });
}

// Initialize
const session = checkAuth();
if (session) {
    displayUserInfo(session);
    loadProfileData(session);
    enableAutoSave();
}

console.log('Worker profile page loaded successfully!');