// Check authentication
function checkAuth() {
    const sessionData = sessionStorage.getItem('verihire_session') || localStorage.getItem('verihire_session');
    
    if (!sessionData) {
        alert('Please login to access your profile');
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

// Get user profile
function getUserProfile(email) {
    const users = JSON.parse(localStorage.getItem('verihire_users') || '[]');
    return users.find(u => u.email === email);
}

// Update user profile
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

// Load profile data
function loadProfileData(session) {
    const profile = getUserProfile(session.email);
    
    if (!profile) return;
    
    // Company Information
    document.getElementById('companyName').value = profile.companyName || '';
    document.getElementById('email').value = profile.email || '';
    document.getElementById('phone').value = profile.phone || '';
    document.getElementById('website').value = profile.website || '';
    document.getElementById('tagline').value = profile.tagline || '';
    document.getElementById('description').value = profile.description || '';
    
    // Company Details
    document.getElementById('industry').value = profile.industry || '';
    document.getElementById('companySize').value = profile.companySize || '';
    document.getElementById('founded').value = profile.founded || '';
    document.getElementById('location').value = profile.location || '';
    
    // Contact Person
    document.getElementById('contactName').value = profile.contactName || '';
    document.getElementById('contactTitle').value = profile.contactTitle || '';
    document.getElementById('contactEmail').value = profile.contactEmail || '';
    
    // Culture & Benefits
    document.getElementById('culture').value = profile.culture || '';
    document.getElementById('benefits').value = profile.benefits || '';
    
    // Social Links
    document.getElementById('linkedin').value = profile.linkedin || '';
    document.getElementById('twitter').value = profile.twitter || '';
    document.getElementById('facebook').value = profile.facebook || '';
    
    // Hiring Preferences
    document.getElementById('activelyHiring').checked = profile.activelyHiring || false;
    document.getElementById('remoteOk').checked = profile.remoteOk || false;
    document.getElementById('sponsorVisa').checked = profile.sponsorVisa || false;
    
    // Update character counts
    updateDescCount();
    
    // Calculate completion
    calculateProfileCompletion(profile);
}

// Calculate profile completion
function calculateProfileCompletion(profile) {
    const fields = [
        profile.companyName,
        profile.email,
        profile.phone,
        profile.website,
        profile.description,
        profile.industry,
        profile.companySize,
        profile.location,
        profile.contactName,
        profile.linkedin || profile.twitter,
        profile.culture || profile.benefits
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
    
    const completionText = document.getElementById('completionText');
    if (percentage === 100) {
        completionText.textContent = '🎉 Your company profile is complete!';
        completionText.style.color = '#10b981';
    } else if (percentage >= 70) {
        completionText.textContent = '👍 Great! A few more details will make your company stand out.';
        completionText.style.color = '#f97316';
    } else if (percentage >= 40) {
        completionText.textContent = '📝 Keep going! Complete profile attracts better candidates.';
        completionText.style.color = '#fbbf24';
    } else {
        completionText.textContent = '⚠️ Your profile needs more information to attract top talent.';
        completionText.style.color = '#ef4444';
    }
}

// Description character counter
const descTextarea = document.getElementById('description');
const descCount = document.getElementById('descCount');

function updateDescCount() {
    const length = descTextarea.value.length;
    descCount.textContent = length;
    
    if (length > 1000) {
        descCount.style.color = '#ef4444';
        descTextarea.value = descTextarea.value.substring(0, 1000);
    } else if (length > 900) {
        descCount.style.color = '#f97316';
    } else {
        descCount.style.color = '#94a3b8';
    }
}

descTextarea.addEventListener('input', updateDescCount);

// Tagline character limit
const taglineInput = document.getElementById('tagline');
taglineInput.addEventListener('input', function() {
    if (this.value.length > 100) {
        this.value = this.value.substring(0, 100);
    }
});

// Form submission
const profileForm = document.getElementById('profileForm');

profileForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const session = checkAuth();
    if (!session) return;
    
    // Collect form data
    const profileData = {
        companyName: document.getElementById('companyName').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        website: document.getElementById('website').value.trim(),
        tagline: document.getElementById('tagline').value.trim(),
        description: document.getElementById('description').value.trim(),
        
        industry: document.getElementById('industry').value,
        companySize: document.getElementById('companySize').value,
        founded: document.getElementById('founded').value || null,
        location: document.getElementById('location').value.trim(),
        
        contactName: document.getElementById('contactName').value.trim(),
        contactTitle: document.getElementById('contactTitle').value.trim(),
        contactEmail: document.getElementById('contactEmail').value.trim(),
        
        culture: document.getElementById('culture').value.trim(),
        benefits: document.getElementById('benefits').value.trim(),
        
        linkedin: document.getElementById('linkedin').value.trim(),
        twitter: document.getElementById('twitter').value.trim(),
        facebook: document.getElementById('facebook').value.trim(),
        
        activelyHiring: document.getElementById('activelyHiring').checked,
        remoteOk: document.getElementById('remoteOk').checked,
        sponsorVisa: document.getElementById('sponsorVisa').checked,
        
        lastUpdated: new Date().toISOString()
    };
    
    // Update profile
    const success = updateUserProfile(session.email, profileData);
    
    if (success) {
        // Update session if company name changed
        if (profileData.companyName) {
            const users = JSON.parse(localStorage.getItem('verihire_users') || '[]');
            const userData = users.find(u => u.email === session.email);
            displayUserInfo(session);
        }
        
        alert('✅ Company profile saved successfully!');
        
        // Get the updated profile from storage to recalculate
        const updatedProfile = getUserProfile(session.email);
        calculateProfileCompletion(updatedProfile);
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        alert('❌ Error saving profile. Please try again.');
    }
});

// Initialize
const session = checkAuth();
if (session) {
    displayUserInfo(session);
    loadProfileData(session);
}

console.log('Employer profile page loaded successfully!');