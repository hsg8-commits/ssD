// API Adapter for دوائك المنزلي
// Provides RESTful API interface using local database

class APIAdapter {
    constructor() {
        this.baseUrl = '';
        this.db = window.localDB;
        this.setupFetchInterceptor();
        console.log('API Adapter initialized - all requests will use local database');
    }

    setupFetchInterceptor() {
        const originalFetch = window.fetch;
        
        window.fetch = async (url, options = {}) => {
            // Check if this is a tables/ API call
            if (url.includes('tables/')) {
                return this.handleTableRequest(url, options);
            }
            
            // For non-API calls, use original fetch
            return originalFetch(url, options);
        };
    }

    async handleTableRequest(url, options) {
        try {
            const method = options.method || 'GET';
            const urlParts = url.split('tables/')[1];
            const [tableName, resourceId] = urlParts.split('/');
            const queryParams = this.parseQueryParams(url);

            console.log(`API Request: ${method} ${url}`);

            switch (method) {
                case 'GET':
                    return this.handleGet(tableName, resourceId, queryParams);
                case 'POST':
                    return this.handlePost(tableName, options.body);
                case 'PUT':
                    return this.handlePut(tableName, resourceId, options.body);
                case 'PATCH':
                    return this.handlePatch(tableName, resourceId, options.body);
                case 'DELETE':
                    return this.handleDelete(tableName, resourceId);
                default:
                    throw new Error(`Unsupported method: ${method}`);
            }
        } catch (error) {
            console.error('API Error:', error);
            return this.createErrorResponse(error.message, 500);
        }
    }

    parseQueryParams(url) {
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
            const item = this.db.data[tableName]?.find(item => item.id === resourceId);
            if (item) {
                return this.createSuccessResponse(item);
            } else {
                return this.createErrorResponse('Resource not found', 404);
            }
        } else {
            // Get collection with filters
            let results = this.db.data[tableName] || [];
            
            // Apply filters
            Object.keys(queryParams).forEach(key => {
                if (key === 'limit' || key === 'page') return;
                
                const value = queryParams[key];
                results = results.filter(item => {
                    if (item[key] === undefined) return false;
                    return item[key].toString() === value;
                });
            });

            // Apply pagination
            const limit = parseInt(queryParams.limit) || 100;
            const page = parseInt(queryParams.page) || 1;
            const offset = (page - 1) * limit;
            
            const paginatedResults = results.slice(offset, offset + limit);

            return this.createSuccessResponse({
                data: paginatedResults,
                total: results.length,
                page: page,
                limit: limit,
                table: tableName
            });
        }
    }

    async handlePost(tableName, body) {
        try {
            const data = JSON.parse(body);
            let result;

            switch (tableName) {
                case 'users':
                    result = this.db.addUser(data);
                    break;
                case 'doctors':
                    result = this.db.addDoctor(data);
                    break;
                case 'conversations':
                    result = this.db.addConversation(data);
                    break;
                case 'messages':
                    result = this.db.addMessage(data);
                    break;
                case 'medical_tips':
                    result = this.db.addMedicalTip(data);
                    break;
                case 'visitors':
                    result = this.db.addVisitor(data);
                    break;
                case 'ai_consultations':
                    result = this.db.addAIConsultation(data);
                    break;
                case 'support_requests':
                    result = this.db.addSupportRequest(data);
                    break;
                default:
                    throw new Error(`Unknown table: ${tableName}`);
            }

            return this.createSuccessResponse(result, 201);
        } catch (error) {
            return this.createErrorResponse(error.message, 400);
        }
    }

    async handlePut(tableName, resourceId, body) {
        try {
            const data = JSON.parse(body);
            const itemIndex = this.db.data[tableName]?.findIndex(item => item.id === resourceId);
            
            if (itemIndex === -1) {
                return this.createErrorResponse('Resource not found', 404);
            }

            // Full update
            const updatedItem = {
                ...this.db.data[tableName][itemIndex],
                ...data,
                id: resourceId, // Preserve ID
                updated_at: new Date().toISOString()
            };

            this.db.data[tableName][itemIndex] = updatedItem;
            this.db.saveData();

            return this.createSuccessResponse(updatedItem);
        } catch (error) {
            return this.createErrorResponse(error.message, 400);
        }
    }

    async handlePatch(tableName, resourceId, body) {
        try {
            const updates = JSON.parse(body);
            
            if (tableName === 'users') {
                const result = this.db.updateUser(resourceId, updates);
                if (result) {
                    return this.createSuccessResponse(result);
                } else {
                    return this.createErrorResponse('User not found', 404);
                }
            } else if (tableName === 'conversations') {
                const result = this.db.updateConversation(resourceId, updates);
                if (result) {
                    return this.createSuccessResponse(result);
                } else {
                    return this.createErrorResponse('Conversation not found', 404);
                }
            } else {
                // Generic update
                const itemIndex = this.db.data[tableName]?.findIndex(item => item.id === resourceId);
                
                if (itemIndex === -1) {
                    return this.createErrorResponse('Resource not found', 404);
                }

                this.db.data[tableName][itemIndex] = {
                    ...this.db.data[tableName][itemIndex],
                    ...updates,
                    updated_at: new Date().toISOString()
                };

                this.db.saveData();
                return this.createSuccessResponse(this.db.data[tableName][itemIndex]);
            }
        } catch (error) {
            return this.createErrorResponse(error.message, 400);
        }
    }

    async handleDelete(tableName, resourceId) {
        const itemIndex = this.db.data[tableName]?.findIndex(item => item.id === resourceId);
        
        if (itemIndex === -1) {
            return this.createErrorResponse('Resource not found', 404);
        }

        // Soft delete - mark as deleted instead of removing
        this.db.data[tableName][itemIndex].deleted = true;
        this.db.data[tableName][itemIndex].deleted_at = new Date().toISOString();
        this.db.saveData();

        return new Response('', { status: 204 });
    }

    createSuccessResponse(data, status = 200) {
        return new Response(JSON.stringify(data), {
            status: status,
            statusText: 'OK',
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    createErrorResponse(message, status = 500) {
        return new Response(JSON.stringify({ error: message }), {
            status: status,
            statusText: this.getStatusText(status),
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    getStatusText(status) {
        const statusTexts = {
            400: 'Bad Request',
            401: 'Unauthorized',
            404: 'Not Found',
            500: 'Internal Server Error'
        };
        return statusTexts[status] || 'Unknown Error';
    }

    // Special methods for complex operations
    async authenticateUser(username, password) {
        const user = this.db.findUser({ username, password });
        return user || null;
    }

    async getUserConversations(userEmail) {
        return this.db.data.conversations.filter(conv => 
            conv.patient_email === userEmail && !conv.deleted
        );
    }

    async getConversationMessages(conversationId) {
        return this.db.getMessages(conversationId);
    }

    // Visitor tracking with IP geolocation fallback
    async trackVisitor() {
        try {
            // Try to get location info
            let locationData = {
                country: 'غير محدد',
                city: 'غير محدد',
                ip_address: 'unknown'
            };

            // Fallback visitor data
            const visitorData = {
                ...locationData,
                device_type: this.getDeviceType(),
                browser: this.getBrowserInfo(),
                os: this.getOSInfo(),
                page_visited: window.location.pathname,
                session_duration: 0
            };

            return this.db.addVisitor(visitorData);
        } catch (error) {
            console.error('Error tracking visitor:', error);
            return null;
        }
    }

    getDeviceType() {
        const ua = navigator.userAgent;
        if (/tablet|ipad|playbook|silk/i.test(ua)) return 'Tablet';
        if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(ua)) return 'Mobile';
        return 'Desktop';
    }

    getBrowserInfo() {
        const ua = navigator.userAgent;
        if (ua.includes('Chrome')) return 'Chrome';
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Safari')) return 'Safari';
        if (ua.includes('Edge')) return 'Edge';
        return 'Unknown';
    }

    getOSInfo() {
        const ua = navigator.userAgent;
        if (ua.includes('Windows')) return 'Windows';
        if (ua.includes('Mac')) return 'macOS';
        if (ua.includes('Linux')) return 'Linux';
        if (ua.includes('Android')) return 'Android';
        if (ua.includes('iOS')) return 'iOS';
        return 'Unknown';
    }
}

// Initialize API Adapter
document.addEventListener('DOMContentLoaded', () => {
    window.apiAdapter = new APIAdapter();
});

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIAdapter;
}