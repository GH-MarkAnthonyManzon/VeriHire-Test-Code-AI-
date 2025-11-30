// Login Form Handler
const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const remember = document.getElementById('remember').checked;
        
        console.log('Login attempt:', email); // Debug
        
        // Get registered users from localStorage
        const users = JSON.parse(localStorage.getItem('verihire_users') || '[]');
        
        console.log('Total users in system:', users.length); // Debug
        
        // Find user
        const user = users.find(u => u.email === email && u.password === password);
        
        if (!user) {
            alert('Invalid email or password. Please try again.');
            console.log('Login failed - user not found'); // Debug
            return;
        }
        
        console.log('Login successful for:', user.accountType); // Debug
        
        // Create session data
        const sessionData = {
            email: user.email,
            fullName: user.fullName,
            accountType: user.accountType,
            companyName: user.companyName || null,
            loginTime: new Date().toISOString()
        };
        
        // Store session
        if (remember) {
            // Remember me - store in localStorage
            localStorage.setItem('verihire_session', JSON.stringify(sessionData));
        } else {
            // Don't remember - store in sessionStorage only
            sessionStorage.setItem('verihire_session', JSON.stringify(sessionData));
        }
        
        // Redirect based on account type
        if (user.accountType === 'worker') {
            window.location.href = 'worker-dashboard.html';
        } else if (user.accountType === 'employer') {
            window.location.href = 'employer-dashboard.html';
        } else {
            alert('Unknown account type');
        }
    });
}

// Forgot password placeholder
const forgotPasswordLink = document.querySelector('.forgot-password');
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', function(e) {
        e.preventDefault();
        alert('Password reset functionality will be implemented soon!\n\nFor now, you can:\n1. Create a new account\n2. Use the debug panel to view existing accounts');
    });
}

console.log('Login page loaded successfully!');