/**
 * Enhanced API Adapter for Medical Platform
 * محول API محسن للمنصة الطبية
 * 
 * This adapter bridges the enhanced database system with existing API calls
 * يربط هذا المحول نظام قاعدة البيانات المحسن مع استدعاءات API الموجودة
 */

class EnhancedAPIAdapter {
    constructor() {
        this.isInitialized = false;
        this.db = null;
        this.init();
    }

    async init() {
        // Wait for enhanced database to be ready
        if (window.enhancedDB && window.enhancedDB.isInitialized) {
            this.db = window.enhancedDB;
            this.setupAPIInterception();
            this.isInitialized = true;
            console.log('🔌 Enhanced API Adapter initialized');
        } else {
            // Wait for database to be ready
            window.addEventListener('enhanced-db-ready', () => {
                this.db = window.enhancedDB;
                this.setupAPIInterception();
                this.isInitialized = true;
                console.log('🔌 Enhanced API Adapter initialized');
            });
        }
    }

    setupAPIInterception() {
        // Store original fetch
        const originalFetch = window.fetch;
        
        // Override fetch to intercept API calls
        window.fetch = async (url, options = {}) => {
            // Check if this is a tables API call
            if (typeof url === 'string' && url.includes('tables/')) {
                console.log('🔄 API Request intercepted:', url, options.method || 'GET');
                return this.handleAPIRequest(url, options);
            }
            
            // For non-API calls, use original fetch
            return originalFetch(url, options);
        };

        console.log('✅ API interception setup complete');
    }

    async handleAPIRequest(url, options) {
        try {
            const method = options.method || 'GET';
            const urlPath = url.replace(/^.*tables\//, '');
            const pathParts = urlPath.split('?')[0].split('/');
            const [tableName, resourceId] = pathParts;
            const queryParams = this.parseQueryString(url);

            console.log(`🔄 Processing Enhanced API: ${method} ${tableName}/${resourceId || ''}`);

            let response;
            switch (method.toUpperCase()) {
                case 'GET':
                    response = await this.handleGet(tableName, resourceId, queryParams);
                    break;
                case 'POST':
                    response = await this.handlePost(tableName, options.body);
                    break;
                case 'PUT':
                    response = await this.handlePut(tableName, resourceId, options.body);
                    break;
                case 'PATCH':
                    response = await this.handlePatch(tableName, resourceId, options.body);
                    break;
                case 'DELETE':
                    response = await this.handleDelete(tableName, resourceId);
                    break;
                default:
                    response = this.createErrorResponse(`Method ${method} not supported`, 405);
            }

            console.log('✅ Enhanced API Response:', response.status);
            return response;

        } catch (error) {
            console.error('❌ Enhanced API Error:', error);
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

    async handleGet(tableName, resourceId, queryParams) {
        if (resourceId) {
            // Get single resource
            const item = this.db.findOne(tableName, { id: resourceId });
            if (item) {
                return this.createSuccessResponse(item);
            } else {
                return this.createErrorResponse('Resource not found', 404);
            }
        } else {
            // Get collection with filters and pagination
            const query = {};
            const options = {};

            // Handle search parameter
            if (queryParams.search) {
                // Search in common text fields
                const searchFields = ['title', 'name', 'full_name', 'content', 'username'];
                const searchRegex = { $regex: queryParams.search, $options: 'i' };
                
                // Create OR query for multiple fields (simplified)
                query.$or = searchFields.map(field => ({ [field]: searchRegex }));
            }

            // Handle other filters
            Object.keys(queryParams).forEach(key => {
                if (key !== 'search' && key !== 'page' && key !== 'limit' && key !== 'sort') {
                    query[key] = queryParams[key];
                }
            });

            // Handle pagination
            const page = parseInt(queryParams.page) || 1;
            const limit = parseInt(queryParams.limit) || 100;
            options.offset = (page - 1) * limit;
            options.limit = limit;

            // Handle sorting
            if (queryParams.sort) {
                const sortField = queryParams.sort.startsWith('-') ? 
                    queryParams.sort.substring(1) : queryParams.sort;
                const sortDirection = queryParams.sort.startsWith('-') ? -1 : 1;
                options.sort = { [sortField]: sortDirection };
            }

            const result = this.db.find(tableName, query, options);
            
            return this.createSuccessResponse({
                data: result.data,
                total: result.total,
                page: page,
                limit: limit,
                table: tableName,
                schema: this.db.schema[tableName] || {}
            });
        }
    }

    async handlePost(tableName, body) {
        const data = JSON.parse(body);
        const result = this.db.insert(tableName, data);
        return this.createSuccessResponse(result, 201);
    }

    async handlePut(tableName, resourceId, body) {
        const updates = JSON.parse(body);
        try {
            const result = this.db.update(tableName, resourceId, updates);
            return this.createSuccessResponse(result);
        } catch (error) {
            if (error.message.includes('not found')) {
                return this.createErrorResponse('Resource not found', 404);
            }
            throw error;
        }
    }

    async handlePatch(tableName, resourceId, body) {
        const updates = JSON.parse(body);
        try {
            const result = this.db.update(tableName, resourceId, updates);
            return this.createSuccessResponse(result);
        } catch (error) {
            if (error.message.includes('not found')) {
                return this.createErrorResponse('Resource not found', 404);
            }
            throw error;
        }
    }

    async handleDelete(tableName, resourceId) {
        try {
            this.db.delete(tableName, resourceId);
            return this.createSuccessResponse(null, 204);
        } catch (error) {
            if (error.message.includes('not found')) {
                return this.createErrorResponse('Resource not found', 404);
            }
            throw error;
        }
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
                'X-Enhanced-DB': 'true'
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
                'X-Enhanced-DB': 'true'
            })
        };
    }

    // Enhanced methods for authentication
    async login(username, password) {
        const clientIP = await this.getClientIP();
        const userAgent = navigator.userAgent;
        return await this.db.login(username, password, clientIP, userAgent);
    }

    async register(userData) {
        return await this.db.register(userData);
    }

    logout(sessionToken = null) {
        return this.db.logout(sessionToken);
    }

    validateSession(sessionToken) {
        return this.db.validateSession(sessionToken);
    }

    getCurrentSession() {
        try {
            const sessionData = sessionStorage.getItem(this.db.sessionKey);
            if (sessionData) {
                const parsed = JSON.parse(sessionData);
                return this.validateSession(parsed.session_token);
            }
        } catch (error) {
            console.warn('Failed to get current session:', error);
        }
        return null;
    }

    async getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.warn('Could not get client IP:', error);
            return 'unknown';
        }
    }

    // Data management methods
    exportData() {
        return this.db.exportData();
    }

    async importData(file) {
        return await this.db.importData(file);
    }

    getStatistics() {
        return this.db.getStatistics();
    }

    clearAllData() {
        return this.db.clearAllData();
    }

    // Backup methods
    createBackup() {
        this.db.createBackup();
        return { success: true, message: 'تم إنشاء النسخة الاحتياطية بنجاح' };
    }

    async restoreFromBackup() {
        const success = await this.db.loadFromBackup();
        return { 
            success, 
            message: success ? 'تم استرداد النسخة الاحتياطية بنجاح' : 'فشل في استرداد النسخة الاحتياطية'
        };
    }
}

// Initialize enhanced API adapter
window.enhancedAPI = new EnhancedAPIAdapter();

// Enhanced authentication methods for global access
window.enhancedAuth = {
    async login(username, password) {
        return await window.enhancedAPI.login(username, password);
    },
    
    async register(userData) {
        return await window.enhancedAPI.register(userData);
    },
    
    logout(sessionToken = null) {
        return window.enhancedAPI.logout(sessionToken);
    },
    
    getCurrentUser() {
        const session = window.enhancedAPI.getCurrentSession();
        return session ? session.user : null;
    },
    
    isLoggedIn() {
        return !!window.enhancedAPI.getCurrentSession();
    },
    
    hasRole(role) {
        const user = this.getCurrentUser();
        return user && user.user_type === role;
    }
};

console.log('🚀 Enhanced API Adapter loaded successfully');

// Make it available for exports
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedAPIAdapter;
}