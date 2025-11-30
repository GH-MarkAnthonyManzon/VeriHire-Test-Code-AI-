// Account type selection
const typeButtons = document.querySelectorAll('.type-btn');
const workerFields = document.getElementById('workerFields');
const employerFields = document.getElementById('employerFields');
let selectedType = 'worker';

// Check URL parameter for account type
const urlParams = new URLSearchParams(window.location.search);
const typeParam = urlParams.get('type');

if (typeParam === 'employer') {
    selectedType = 'employer';
    typeButtons.forEach(btn => {
        if (btn.dataset.type === 'employer') {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    workerFields.style.display = 'none';
    employerFields.style.display = 'flex';
}

// Handle account type switching
typeButtons.forEach(button => {
    button.addEventListener('click', function() {
        // Remove active class from all buttons
        typeButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        this.classList.add('active');
        
        // Get selected type
        selectedType = this.dataset.type;
        
        // Show/hide conditional fields
        if (selectedType === 'worker') {
            workerFields.style.display = 'flex';
            employerFields.style.display = 'none';
            
            // Make worker fields required
            document.getElementById('skills').required = true;
            document.getElementById('experience').required = true;
            
            // Remove required from employer fields
            document.getElementById('companyName').required = false;
            document.getElementById('companySize').required = false;
            document.getElementById('industry').required = false;
        } else {
            workerFields.style.display = 'none';
            employerFields.style.display = 'flex';
            
            // Remove required from worker fields
            document.getElementById('skills').required = false;
            document.getElementById('experience').required = false;
            
            // Make employer fields required
            document.getElementById('companyName').required = true;
            document.getElementById('companySize').required = true;
            document.getElementById('industry').required = true;
        }
    });
});

// Form submission
const registerForm = document.getElementById('registerForm');

registerForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form values
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const terms = document.getElementById('terms').checked;
    
    // Validation
    if (password.length < 8) {
        alert('Password must be at least 8 characters long');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    if (!terms) {
        alert('Please agree to the Terms of Service and Privacy Policy');
        return;
    }
    
    // Collect user data based on account type
    const userData = {
        fullName,
        email,
        password,
        accountType: selectedType,
        timestamp: new Date().toISOString()
    };
    
    if (selectedType === 'worker') {
        userData.skills = document.getElementById('skills').value;
        userData.experience = document.getElementById('experience').value;
    } else {
        userData.companyName = document.getElementById('companyName').value;
        userData.companySize = document.getElementById('companySize').value;
        userData.industry = document.getElementById('industry').value;
    }
    
    // Store in localStorage (temporary - in production this would go to a backend)
    const users = JSON.parse(localStorage.getItem('verihire_users') || '[]');
    
    // Check if email already exists
    if (users.some(user => user.email === email)) {
        alert('An account with this email already exists');
        return;
    }
    
    users.push(userData);
    localStorage.setItem('verihire_users', JSON.stringify(users));
    
    // Success message
    alert('Account created successfully! Redirecting to login...');
    
    // Redirect to login page after 1 second
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1000);
});

console.log('Registration page loaded successfully!');