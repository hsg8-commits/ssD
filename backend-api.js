/**
 * Backend API Client for Medical Platform
 * عميل API للخادم الخلفي للمنصة الطبية
 * 
 * يتصل مع خادم Node.js لحفظ البيانات في ملفات JSON حقيقية
 */

class BackendAPI {
    constructor() {
        // API Base URL - يجب تغييرها حسب عنوان السيرفر
        this.baseURL = window.location.origin.includes('13.60.79.191') ? 
            'http://localhost:3000/api' : 
            '/api'; // للاستضافة العامة
        
        this.token = localStorage.getItem('medical_platform_token');
        this.currentUser = null;
        
        console.log('🔌 Backend API Client initialized');
        console.log('🌐 API Base URL:', this.baseURL);
        
        // Restore user session if token exists
        if (this.token) {
            this.restoreUserSession();
        }
    }

    /**
     * Make HTTP request to backend
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` })
            }
        };

        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        console.log(`🔄 Backend Request: ${options.method || 'GET'} ${url}`);

        try {
            const response = await fetch(url, mergedOptions);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            console.log('✅ Backend Response:', response.status);
            return data;

        } catch (error) {
            console.error('❌ Backend Request Failed:', error);
            
            // If unauthorized, clear token
            if (error.message.includes('401') || error.message.includes('403')) {
                this.clearSession();
            }
            
            throw error;
        }
    }

    /**
     * Authentication Methods
     */
    async login(username, password) {
        try {
            const data = await this.request('/login', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });

            if (data.success) {
                this.token = data.token;
                this.currentUser = data.user;
                
                // Store token in localStorage for persistence
                localStorage.setItem('medical_platform_token', this.token);
                localStorage.setItem('medical_platform_user', JSON.stringify(this.currentUser));
                
                console.log('✅ Login successful:', this.currentUser.full_name);
                return { success: true, user: this.currentUser };
            }

            return { success: false, error: data.error };

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async register(userData) {
        try {
            const data = await this.request('/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            });

            if (data.success) {
                console.log('✅ Registration successful:', data.user.full_name);
                return { success: true, user: data.user };
            }

            return { success: false, error: data.error };

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async logout() {
        try {
            if (this.token) {
                await this.request('/logout', { method: 'POST' });
            }
        } catch (error) {
            console.warn('Logout request failed:', error);
        } finally {
            this.clearSession();
        }
    }

    clearSession() {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('medical_platform_token');
        localStorage.removeItem('medical_platform_user');
        console.log('🚪 Session cleared');
    }

    async restoreUserSession() {
        try {
            const storedUser = localStorage.getItem('medical_platform_user');
            if (storedUser && this.token) {
                // Validate token by making a test request
                const data = await this.request('/tables/users?limit=1');
                
                // If successful, restore user
                this.currentUser = JSON.parse(storedUser);
                console.log('🔄 Session restored:', this.currentUser.full_name);
            }
        } catch (error) {
            console.warn('Session restoration failed:', error);
            this.clearSession();
        }
    }

    isAuthenticated() {
        return !!this.token && !!this.currentUser;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    hasRole(role) {
        return this.currentUser && this.currentUser.user_type === role;
    }

    /**
     * Table Data Methods
     */
    async getTableData(tableName, params = {}) {
        try {
            const queryParams = new URLSearchParams(params).toString();
            const endpoint = queryParams ? `/tables/${tableName}?${queryParams}` : `/tables/${tableName}`;
            
            return await this.request(endpoint);
        } catch (error) {
            console.error(`Error fetching ${tableName}:`, error);
            throw error;
        }
    }

    async getRecord(tableName, id) {
        try {
            return await this.request(`/tables/${tableName}/${id}`);
        } catch (error) {
            console.error(`Error fetching ${tableName} record ${id}:`, error);
            throw error;
        }
    }

    async createRecord(tableName, data) {
        try {
            return await this.request(`/tables/${tableName}`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.error(`Error creating ${tableName} record:`, error);
            throw error;
        }
    }

    async updateRecord(tableName, id, data) {
        try {
            return await this.request(`/tables/${tableName}/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.error(`Error updating ${tableName} record ${id}:`, error);
            throw error;
        }
    }

    async patchRecord(tableName, id, data) {
        try {
            return await this.request(`/tables/${tableName}/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.error(`Error patching ${tableName} record ${id}:`, error);
            throw error;
        }
    }

    async deleteRecord(tableName, id) {
        try {
            await this.request(`/tables/${tableName}/${id}`, {
                method: 'DELETE'
            });
            return true;
        } catch (error) {
            console.error(`Error deleting ${tableName} record ${id}:`, error);
            throw error;
        }
    }

    /**
     * Admin Methods
     */
    async getSystemStats() {
        try {
            return await this.request('/admin/stats');
        } catch (error) {
            console.error('Error fetching system stats:', error);
            throw error;
        }
    }

    async exportAllData() {
        try {
            const response = await fetch(`${this.baseURL}/admin/export`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Export failed');
            }

            // Create download link
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `medical-platform-backup-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            window.URL.revokeObjectURL(url);
            return true;

        } catch (error) {
            console.error('Error exporting data:', error);
            throw error;
        }
    }
}

// Create global instance
window.backendAPI = new BackendAPI();

// Enhanced authentication wrapper for backward compatibility
window.enhancedAuth = {
    async login(username, password) {
        return await window.backendAPI.login(username, password);
    },
    
    async register(userData) {
        return await window.backendAPI.register(userData);
    },
    
    async logout() {
        return await window.backendAPI.logout();
    },
    
    getCurrentUser() {
        return window.backendAPI.getCurrentUser();
    },
    
    isLoggedIn() {
        return window.backendAPI.isAuthenticated();
    },
    
    hasRole(role) {
        return window.backendAPI.hasRole(role);
    }
};

// Enhanced API wrapper for existing code compatibility
class BackendAPIAdapter {
    constructor() {
        this.isInitialized = true;
    }

    async handleAPIRequest(url, options) {
        const urlPath = url.replace(/^.*tables\//, '');
        const pathParts = urlPath.split('?')[0].split('/');
        const [tableName, resourceId] = pathParts;
        const queryParams = this.parseQueryString(url);

        try {
            switch (options.method?.toUpperCase() || 'GET') {
                case 'GET':
                    if (resourceId) {
                        const data = await window.backendAPI.getRecord(tableName, resourceId);
                        return this.createSuccessResponse(data);
                    } else {
                        const data = await window.backendAPI.getTableData(tableName, queryParams);
                        return this.createSuccessResponse(data);
                    }

                case 'POST':
                    const postData = JSON.parse(options.body);
                    const created = await window.backendAPI.createRecord(tableName, postData);
                    return this.createSuccessResponse(created, 201);

                case 'PUT':
                    const putData = JSON.parse(options.body);
                    const updated = await window.backendAPI.updateRecord(tableName, resourceId, putData);
                    return this.createSuccessResponse(updated);

                case 'PATCH':
                    const patchData = JSON.parse(options.body);
                    const patched = await window.backendAPI.patchRecord(tableName, resourceId, patchData);
                    return this.createSuccessResponse(patched);

                case 'DELETE':
                    await window.backendAPI.deleteRecord(tableName, resourceId);
                    return this.createSuccessResponse(null, 204);

                default:
                    throw new Error(`Method ${options.method} not supported`);
            }
        } catch (error) {
            return this.createErrorResponse(error.message, 500);
        }
    }

    parseQueryString(url) {
        const params = {};
        const queryString = url.split('?')[1];
        
        if (queryString) {
            queryString.split('&').forEach(param => {
                const [key, value] = param.split('=');
                params[decodeURIComponent(key)] = decodeURIComponent(value || '');
            });
        }
        
        return params;
    }

    createSuccessResponse(data, status = 200) {
        return {
            ok: status >= 200 && status < 300,
            status: status,
            statusText: status === 200 ? 'OK' : 
                        status === 201 ? 'Created' : 
                        status === 204 ? 'No Content' : 'Success',
            json: async () => data,
            text: async () => JSON.stringify(data),
            headers: new Headers({
                'Content-Type': 'application/json',
                'X-Backend-API': 'true'
            })
        };
    }

    createErrorResponse(message, status = 400) {
        const error = { error: message, status };
        return {
            ok: false,
            status: status,
            statusText: message,
            json: async () => error,
            text: async () => JSON.stringify(error),
            headers: new Headers({
                'Content-Type': 'application/json',
                'X-Backend-API': 'true'
            })
        };
    }
}

// Initialize API adapter and override fetch for backward compatibility
const backendAPIAdapter = new BackendAPIAdapter();

// Store original fetch
const originalFetch = window.fetch;

// Override fetch to intercept API calls
window.fetch = async (url, options = {}) => {
    // Check if this is a tables API call
    if (typeof url === 'string' && url.includes('tables/')) {
        console.log('🔄 Intercepted API call, routing to backend:', url);
        return backendAPIAdapter.handleAPIRequest(url, options);
    }
    
    // For non-API calls, use original fetch
    return originalFetch(url, options);
};

console.log('🚀 Backend API Client loaded and ready');
console.log('🔄 Fetch interceptor activated for tables/ calls');

// Make it available for exports
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BackendAPI;
}