/**
 * Authentication Utility
 * Handles login, logout, and role-based access
 */

/**
 * Check if user is logged in
 * @returns {boolean}
 */
function isLoggedIn() {
  return !!localStorage.getItem('token');
}

/**
 * Get current user
 * @returns {object|null}
 */
function getCurrentUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

/**
 * Get user role
 * @returns {string|null}
 */
function getUserRole() {
  const user = getCurrentUser();
  return user ? user.role : null;
}

/**
 * Login user
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<object>}
 */
async function login(email, password) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (data.success) {
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
  }

  return data;
}

/**
 * Register new customer
 * @param {object} userData 
 * @returns {Promise<object>}
 */
async function register(userData) {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });

  return response.json();
}

/**
 * Logout user
 */
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/pages/login.html';
}

/**
 * Redirect to appropriate dashboard based on role
 */
function redirectToDashboard() {
  const role = getUserRole();
  
  switch (role) {
    case 'CUSTOMER':
      window.location.href = '/pages/customer/dashboard.html';
      break;
    case 'STAFF':
      window.location.href = '/pages/staff/dashboard.html';
      break;
    case 'ADMIN':
      window.location.href = '/pages/admin/dashboard.html';
      break;
    default:
      window.location.href = '/pages/login.html';
  }
}

/**
 * Check if user has required role
 * @param {string|string[]} requiredRoles 
 * @returns {boolean}
 */
function hasRole(requiredRoles) {
  const role = getUserRole();
  if (!role) return false;
  
  if (Array.isArray(requiredRoles)) {
    return requiredRoles.includes(role);
  }
  return role === requiredRoles;
}

/**
 * Protect page - redirect if not authenticated or wrong role
 * @param {string|string[]} allowedRoles 
 */
function protectPage(allowedRoles) {
  if (!isLoggedIn()) {
    window.location.href = '/pages/login.html';
    return;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    redirectToDashboard();
    return;
  }
}

/**
 * Create navigation HTML based on role
 * @returns {string} Navigation HTML
 */
function getNavigation() {
  const user = getCurrentUser();
  if (!user) return '';

  let navItems = '';
  
  switch (user.role) {
    case 'CUSTOMER':
      navItems = `
        <li class="nav-item"><a class="nav-link" href="/pages/customer/menu.html">Menu</a></li>
        <li class="nav-item"><a class="nav-link" href="/pages/customer/cart.html">Cart</a></li>
        <li class="nav-item"><a class="nav-link" href="/pages/customer/orders.html">Orders</a></li>
        <li class="nav-item"><a class="nav-link" href="/pages/customer/settings.html">Settings</a></li>
      `;
      break;
    case 'STAFF':
      navItems = `
        <li class="nav-item"><a class="nav-link" href="/pages/staff/menu.html">Menu Management</a></li>
        <li class="nav-item"><a class="nav-link" href="/pages/staff/orders.html">Order Management</a></li>
        <li class="nav-item"><a class="nav-link" href="/pages/staff/settings.html">Settings</a></li>
      `;
      break;
    case 'ADMIN':
      navItems = `
        <li class="nav-item"><a class="nav-link" href="/pages/admin/users.html">User Management</a></li>
      `;
      break;
  }

  return `
    <nav class="navbar navbar-expand-lg navbar-custom">
      <div class="container">
        <a class="navbar-brand" href="#">🍔 Food Order</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto">
            ${navItems}
          </ul>
          <div class="d-flex align-items-center">
            <span class="text-white me-3">Hello, ${user.nickname}</span>
            <button class="btn btn-logout btn-sm" onclick="logout()">Logout</button>
          </div>
        </div>
      </div>
    </nav>
  `;
}

/**
 * Initialize page with navigation
 */
function initPage() {
  // Insert navigation
  const navContainer = document.getElementById('navbar-container');
  if (navContainer) {
    navContainer.innerHTML = getNavigation();
  }

  // Highlight active nav link
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });
}
