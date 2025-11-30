// ========================================
// AUTHENTICATION & USER MANAGEMENT
// ========================================

function checkAuth() {
    try {
        const sessionData = sessionStorage.getItem('verihire_session') || localStorage.getItem('verihire_session');
        
        if (!sessionData) {
            alert('Please login to access your portfolio');
            window.location.href = 'login.html';
            return null;
        }
        
        const session = JSON.parse(sessionData);
        
        if (session.accountType !== 'worker') {
            alert('Access denied. Portfolio is for workers only.');
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

// Display user info in navigation
function displayUserInfo(session) {
    const userNameEl = document.getElementById('userName');
    if (userNameEl) {
        const firstName = session.fullName.split(' ')[0];
        userNameEl.textContent = firstName;
    }
}

// ========================================
// USER MENU & LOGOUT
// ========================================

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

// ========================================
// PORTFOLIO DATA MANAGEMENT
// ========================================

// Get all portfolio items for a user
function getUserPortfolio(userEmail) {
    const allPortfolios = JSON.parse(localStorage.getItem('verihire_portfolios') || '{}');
    return allPortfolios[userEmail] || [];
}

// Save portfolio items for a user
function saveUserPortfolio(userEmail, portfolioItems) {
    const allPortfolios = JSON.parse(localStorage.getItem('verihire_portfolios') || '{}');
    allPortfolios[userEmail] = portfolioItems;
    localStorage.setItem('verihire_portfolios', JSON.stringify(allPortfolios));
}

// Generate unique project ID
function generateProjectId() {
    return 'project_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========================================
// DISPLAY PORTFOLIO ITEMS
// ========================================

let currentPortfolio = [];

function displayPortfolio(session) {
    currentPortfolio = getUserPortfolio(session.email);
    
    const portfolioGrid = document.getElementById('portfolioGrid');
    const emptyState = document.getElementById('emptyState');
    
    // Update stats
    updateStats(currentPortfolio);
    
    if (currentPortfolio.length === 0) {
        portfolioGrid.innerHTML = '';
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
        portfolioGrid.innerHTML = currentPortfolio.map(project => createProjectCard(project)).join('');
        
        // Attach event listeners to buttons
        attachProjectListeners();
    }
}

function createProjectCard(project) {
    const technologies = project.technologies ? 
        project.technologies.split(',').map(tech => tech.trim()).filter(tech => tech) : [];
    
    const imageContent = project.imageUrl ? 
        `<img src="${escapeHtml(project.imageUrl)}" alt="${escapeHtml(project.title)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <div style="font-size: 3rem; display: none;">🖼️</div>` :
        getProjectTypeIcon(project.type);
    
    const featuredBadge = project.featured ? 
        '<span class="job-badge featured" style="position: absolute; top: 12px; right: 12px;">⭐ Featured</span>' : '';
    
    return `
        <div class="portfolio-item" data-project-id="${project.id}">
            <div class="portfolio-image" style="position: relative;">
                ${imageContent}
                ${featuredBadge}
            </div>
            <div class="portfolio-content">
                <h3 class="portfolio-title">${escapeHtml(project.title)}</h3>
                <p class="portfolio-description">${escapeHtml(project.description)}</p>
                
                ${technologies.length > 0 ? `
                    <div class="portfolio-meta">
                        ${technologies.slice(0, 3).map(tech => 
                            `<span class="portfolio-tag">${escapeHtml(tech)}</span>`
                        ).join('')}
                        ${technologies.length > 3 ? `<span class="portfolio-tag">+${technologies.length - 3} more</span>` : ''}
                    </div>
                ` : ''}
                
                ${project.link ? `
                    <div style="margin-top: 12px;">
                        <a href="${escapeHtml(project.link)}" target="_blank" rel="noopener noreferrer" style="color: #f97316; text-decoration: none; font-size: 14px; display: inline-flex; align-items: center; gap: 4px;">
                            🔗 View Project →
                        </a>
                    </div>
                ` : ''}
                
                <div class="portfolio-actions">
                    <button class="btn-secondary btn-small edit-project" data-project-id="${project.id}">✏️ Edit</button>
                    <button class="btn-secondary btn-small delete-project" data-project-id="${project.id}" style="background-color: #ef4444; border-color: #ef4444; color: white;">🗑️ Delete</button>
                </div>
            </div>
        </div>
    `;
}

function getProjectTypeIcon(type) {
    const icons = {
        'web': '💻',
        'design': '🎨',
        'other': '📄'
    };
    return `<div style="font-size: 3rem;">${icons[type] || '📄'}</div>`;
}

// ========================================
// UPDATE STATISTICS
// ========================================

function updateStats(portfolio) {
    const totalProjects = portfolio.length;
    const featuredCount = portfolio.filter(p => p.featured).length;
    const totalViews = portfolio.reduce((sum, p) => sum + (p.views || 0), 0);
    
    // Calculate profile strength (based on having projects)
    let completionRate = 0;
    if (totalProjects === 0) completionRate = 0;
    else if (totalProjects === 1) completionRate = 40;
    else if (totalProjects === 2) completionRate = 60;
    else if (totalProjects >= 3 && totalProjects < 5) completionRate = 80;
    else completionRate = 100;
    
    document.getElementById('totalProjects').textContent = totalProjects;
    document.getElementById('totalViews').textContent = totalViews;
    document.getElementById('featuredCount').textContent = featuredCount;
    document.getElementById('completionRate').textContent = completionRate + '%';
}

// ========================================
// MODAL MANAGEMENT
// ========================================

const projectModal = document.getElementById('projectModal');
const addProjectBtn = document.getElementById('addProjectBtn');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const saveProjectBtn = document.getElementById('saveProjectBtn');
const projectForm = document.getElementById('projectForm');

let isEditMode = false;
let currentEditingId = null;

// Open modal to add new project
addProjectBtn.addEventListener('click', function() {
    openModal();
});

// Close modal
closeModal.addEventListener('click', closeModalFn);
cancelBtn.addEventListener('click', closeModalFn);

// Close modal when clicking outside
projectModal.addEventListener('click', function(e) {
    if (e.target === projectModal) {
        closeModalFn();
    }
});

// Close modal with ESC key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && projectModal.classList.contains('show')) {
        closeModalFn();
    }
});

function openModal(projectData = null) {
    if (projectData) {
        // Edit mode
        isEditMode = true;
        currentEditingId = projectData.id;
        document.getElementById('modalTitle').textContent = 'Edit Project';
        
        // Fill form with project data
        document.getElementById('projectTitle').value = projectData.title;
        document.getElementById('projectDescription').value = projectData.description;
        document.getElementById('projectTechnologies').value = projectData.technologies || '';
        document.getElementById('projectLink').value = projectData.link || '';
        document.getElementById('projectImage').value = projectData.imageUrl || '';
        document.getElementById('projectFeatured').checked = projectData.featured || false;
        document.getElementById('projectId').value = projectData.id;
        
        // Set project type
        document.querySelectorAll('.project-type-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.type === projectData.type) {
                btn.classList.add('active');
            }
        });
        document.getElementById('projectType').value = projectData.type;
        
        // Update image preview if exists
        if (projectData.imageUrl) {
            updateImagePreview(projectData.imageUrl);
        }
        
        updateDescCount();
    } else {
        // Add mode
        isEditMode = false;
        currentEditingId = null;
        document.getElementById('modalTitle').textContent = 'Add New Project';
        projectForm.reset();
        document.getElementById('projectType').value = 'web';
        document.querySelectorAll('.project-type-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector('.project-type-btn[data-type="web"]').classList.add('active');
        
        // Reset image preview
        document.getElementById('imagePreview').innerHTML = `
            <div class="image-preview-placeholder">
                📷 Image preview will appear here
            </div>
        `;
    }
    
    projectModal.classList.add('show');
}

function closeModalFn() {
    projectModal.classList.remove('show');
    projectForm.reset();
    isEditMode = false;
    currentEditingId = null;
}

// ========================================
// PROJECT TYPE SELECTION
// ========================================

document.querySelectorAll('.project-type-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.project-type-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        document.getElementById('projectType').value = this.dataset.type;
    });
});

// ========================================
// IMAGE PREVIEW
// ========================================

const projectImageInput = document.getElementById('projectImage');
projectImageInput.addEventListener('input', function() {
    updateImagePreview(this.value);
});

function updateImagePreview(imageUrl) {
    const preview = document.getElementById('imagePreview');
    
    if (imageUrl && isValidUrl(imageUrl)) {
        preview.innerHTML = `<img src="${imageUrl}" alt="Preview" onerror="this.parentElement.innerHTML='<div class=&quot;image-preview-placeholder&quot;>❌ Failed to load image</div>'">`;
    } else {
        preview.innerHTML = `
            <div class="image-preview-placeholder">
                📷 Image preview will appear here
            </div>
        `;
    }
}

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// ========================================
// DESCRIPTION CHARACTER COUNTER
// ========================================

const descTextarea = document.getElementById('projectDescription');
const descCount = document.getElementById('descCount');

function updateDescCount() {
    const length = descTextarea.value.length;
    descCount.textContent = length;
    
    if (length > 500) {
        descCount.style.color = '#ef4444';
        descTextarea.value = descTextarea.value.substring(0, 500);
    } else if (length > 450) {
        descCount.style.color = '#f97316';
    } else {
        descCount.style.color = '#94a3b8';
    }
}

descTextarea.addEventListener('input', updateDescCount);

// ========================================
// PREVENT FORM DEFAULT SUBMISSION
// ========================================

projectForm.addEventListener('submit', function(e) {
    e.preventDefault();
    // Trigger save button click instead
    saveProjectBtn.click();
});

// ========================================
// SAVE PROJECT
// ========================================

saveProjectBtn.addEventListener('click', function() {
    const session = checkAuth();
    if (!session) return;
    
    // Get form values
    const title = document.getElementById('projectTitle').value.trim();
    const description = document.getElementById('projectDescription').value.trim();
    const technologies = document.getElementById('projectTechnologies').value.trim();
    const link = document.getElementById('projectLink').value.trim();
    const imageUrl = document.getElementById('projectImage').value.trim();
    const featured = document.getElementById('projectFeatured').checked;
    const type = document.getElementById('projectType').value;
    
    // Validation
    if (!title) {
        alert('Please enter a project title');
        return;
    }
    
    if (!description) {
        alert('Please enter a project description');
        return;
    }
    
    if (description.length < 20) {
        alert('Project description must be at least 20 characters');
        return;
    }
    
    // Create or update project object
    const projectData = {
        id: isEditMode ? currentEditingId : generateProjectId(),
        title: title,
        description: description,
        technologies: technologies,
        link: link,
        imageUrl: imageUrl,
        featured: featured,
        type: type,
        views: isEditMode ? (currentPortfolio.find(p => p.id === currentEditingId)?.views || 0) : 0,
        createdAt: isEditMode ? (currentPortfolio.find(p => p.id === currentEditingId)?.createdAt) : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Get current portfolio
    let portfolio = getUserPortfolio(session.email);
    
    if (isEditMode) {
        // Update existing project
        const index = portfolio.findIndex(p => p.id === currentEditingId);
        if (index !== -1) {
            portfolio[index] = projectData;
        }
    } else {
        // Add new project
        portfolio.push(projectData);
    }
    
    // Save to localStorage
    saveUserPortfolio(session.email, portfolio);
    
    // Close modal and refresh display
    closeModalFn();
    displayPortfolio(session);
    
    alert(isEditMode ? '✅ Project updated successfully!' : '✅ Project added successfully!');
});

// ========================================
// EDIT & DELETE PROJECTS
// ========================================

function attachProjectListeners() {
    // Edit buttons
    document.querySelectorAll('.edit-project').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const projectId = this.dataset.projectId;
            const project = currentPortfolio.find(p => p.id === projectId);
            if (project) {
                openModal(project);
            }
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.delete-project').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const projectId = this.dataset.projectId;
            deleteProject(projectId);
        });
    });
}

function deleteProject(projectId) {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
        return;
    }
    
    const session = checkAuth();
    if (!session) return;
    
    let portfolio = getUserPortfolio(session.email);
    portfolio = portfolio.filter(p => p.id !== projectId);
    
    saveUserPortfolio(session.email, portfolio);
    displayPortfolio(session);
    
    alert('🗑️ Project deleted successfully');
}

// ========================================
// SEARCH FUNCTIONALITY
// ========================================

const portfolioSearch = document.getElementById('portfolioSearch');

portfolioSearch.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase().trim();
    
    if (!searchTerm) {
        displayPortfolio(checkAuth());
        return;
    }
    
    const filtered = currentPortfolio.filter(project => {
        return project.title.toLowerCase().includes(searchTerm) ||
               project.description.toLowerCase().includes(searchTerm) ||
               (project.technologies && project.technologies.toLowerCase().includes(searchTerm));
    });
    
    displayFilteredPortfolio(filtered);
});

function displayFilteredPortfolio(projects) {
    const portfolioGrid = document.getElementById('portfolioGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (projects.length === 0) {
        portfolioGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #94a3b8;">No projects match your search</div>';
        emptyState.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        portfolioGrid.innerHTML = projects.map(project => createProjectCard(project)).join('');
        attachProjectListeners();
    }
}

// ========================================
// INITIALIZE
// ========================================

const session = checkAuth();
if (session) {
    displayUserInfo(session);
    displayPortfolio(session);
}

console.log('Portfolio page loaded successfully!');