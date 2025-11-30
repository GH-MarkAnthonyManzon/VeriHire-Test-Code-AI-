// Login form submission
const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form values
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;
    
    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('verihire_users') || '[]');
    
    // Find user with matching email
    const user = users.find(u => u.email === email);
    
    if (!user) {
        alert('No account found with this email address');
        return;
    }
    
    // Check password
    if (user.password !== password) {
        alert('Incorrect password');
        return;
    }
    
    // Success - store session
    const sessionData = {
        fullName: user.fullName,
        email: user.email,
        accountType: user.accountType,
        loginTime: new Date().toISOString()
    };
    
    // Store in sessionStorage (or localStorage if remember me is checked)
    if (remember) {
        localStorage.setItem('verihire_session', JSON.stringify(sessionData));
    } else {
        sessionStorage.setItem('verihire_session', JSON.stringify(sessionData));
    }
    
    alert('Login successful! Redirecting to dashboard...');
    
    // Redirect based on account type
    setTimeout(() => {
        if (user.accountType === 'worker') {
            window.location.href = 'worker-dashboard.html';
        } else {
            window.location.href = 'employer-dashboard.html';
        }
    }, 1000);
});

console.log('Login page loaded successfully!');