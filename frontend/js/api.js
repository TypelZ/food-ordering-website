/**
 * API Utility
 * Fetch wrapper with JWT authentication
 */

const API_BASE = '/api';

/**
 * Make API request with authentication
 * @param {string} endpoint - API endpoint
 * @param {object} options - Fetch options
 * @returns {Promise<object>} Response data
 */
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  
  const headers = {
    ...options.headers
  };

  // Add auth header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Add content-type for JSON requests (not for FormData)
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();

    // Handle unauthorized - redirect to login
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/pages/login.html';
      return;
    }

    // Handle forbidden
    if (response.status === 403) {
      showToast('Access denied', 'danger');
      return { success: false, message: 'Access denied' };
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    showToast('Network error. Please try again.', 'danger');
    return { success: false, message: 'Network error' };
  }
}

// Convenience methods
const api = {
  get: (endpoint) => apiRequest(endpoint, { method: 'GET' }),
  
  post: (endpoint, data) => apiRequest(endpoint, {
    method: 'POST',
    body: data instanceof FormData ? data : JSON.stringify(data)
  }),
  
  put: (endpoint, data) => apiRequest(endpoint, {
    method: 'PUT',
    body: data instanceof FormData ? data : JSON.stringify(data)
  }),
  
  delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' })
};

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Bootstrap color type (success, danger, warning, info)
 */
function showToast(message, type = 'info') {
  // Create toast container if not exists
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast align-items-center text-white bg-${type} border-0`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;

  container.appendChild(toast);

  // Initialize and show toast
  const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
  bsToast.show();

  // Remove after hidden
  toast.addEventListener('hidden.bs.toast', () => toast.remove());
}

/**
 * Show loading spinner
 */
function showLoading() {
  let overlay = document.querySelector('.spinner-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'spinner-overlay';
    overlay.innerHTML = '<div class="spinner-border text-light" role="status"><span class="visually-hidden">Loading...</span></div>';
    document.body.appendChild(overlay);
  }
  overlay.style.display = 'flex';
}

/**
 * Hide loading spinner
 */
function hideLoading() {
  const overlay = document.querySelector('.spinner-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

/**
 * Format currency
 * @param {number} amount 
 * @returns {string} Formatted currency
 */
function formatCurrency(amount) {
  return 'RM ' + parseFloat(amount).toFixed(2);
}

/**
 * Format date
 * @param {string} dateString 
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
  return new Date(dateString).toLocaleString();
}

/**
 * Get status badge class
 * @param {string} status 
 * @returns {string} CSS class
 */
function getStatusClass(status) {
  const classes = {
    'Pending': 'status-pending',
    'Preparing': 'status-preparing',
    'Ready': 'status-ready',
    'Completed': 'status-completed',
    'Cancelled': 'status-cancelled'
  };
  return classes[status] || '';
}
