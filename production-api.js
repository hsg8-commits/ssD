// Production API System - محاكي API موثوق للنشر العام
// يعمل مع أي استضافة خارجية بدون اعتماد على خوادم

class ProductionAPI {
    constructor() {
        this.db = window.prodDB;
        this.baseUrl = '';
        this.setupFetchInterceptor();
        console.log('Production API System initialized');
    }

    setupFetchInterceptor() {
        const originalFetch = window.fetch;
        
        window.fetch = async (url, options = {}) => {
            console.log('API Request intercepted:', url, options.method || 'GET');
            
            // Check if this is a tables/ API call
            if (url.includes('tables/') || url.startsWith('tables/')) {
                return await this.handleAPIRequest(url, options);
            }
            
            // For external URLs (like AI API, IP geolocation), use original fetch
            return originalFetch(url, options);
        };
    }

    async handleAPIRequest(url, options) {
        try {
            const method = options.method || 'GET';
            const urlPath = url.replace(/^.*tables\//, '');
            const pathParts = urlPath.split('?')[0].split('/'); // Remove query params first
            const [tableName, resourceId] = pathParts;
            const queryParams = this.parseQueryString(url);

            console.log(`Processing API: ${method} ${tableName}/${resourceId || ''}`);

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
                    throw new Error(`Unsupported method: ${method}`);
            }

            console.log('API Response:', response.status);
            return response;

        } catch (error) {
            console.error('API Error:', error);
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
            const item = this.db.data[tableName]?.find(item => item.id === resourceId && !item.deleted);
            if (item) {
                return this.createSuccessResponse(item);
            } else {
                return this.createErrorResponse('Resource not found', 404);
            }
        } else {
            // Get collection
            const results = this.db.query(tableName, queryParams, parseInt(queryParams.limit) || 100);
            
            const responseData = {
                data: results,
                total: results.length,
                page: parseInt(queryParams.page) || 1,
                limit: parseInt(queryParams.limit) || 100,
                table: tableName
            };

            return this.createSuccessResponse(responseData);
        }
    }

    async handlePost(tableName, body) {
        try {
            const data = JSON.parse(body || '{}');
            let result;

            console.log(`Creating new ${tableName}:`, data);

            switch (tableName) {
                case 'users':
                    // Check if user already exists
                    if (data.username && this.db.findUser({ username: data.username })) {
                        return this.createErrorResponse('اسم المستخدم موجود بالفعل', 409);
                    }
                    if (data.email && this.db.findUser({ email: data.email })) {
                        return this.createErrorResponse('البريد الإلكتروني موجود بالفعل', 409);
                    }
                    result = this.db.addUser(data);
                    break;

                case 'conversations':
                    result = this.db.addConversation(data);
                    break;

                case 'messages':
                    result = this.db.addMessage(data);
                    // Update conversation timestamp
                    if (data.conversation_id) {
                        this.db.updateRecord('conversations', data.conversation_id, {
                            updated_at: new Date().toISOString(),
                            last_message_time: new Date().toISOString()
                        });
                    }
                    break;

                case 'medical_tips':
                    result = this.db.addMedicalTip(data);
                    break;

                case 'visitors':
                    result = this.db.addVisitor(data);
                    break;

                case 'ai_consultations':
                    result = {
                        id: this.db.generateId('ai'),
                        created_at: new Date().toISOString(),
                        ...data
                    };
                    this.db.data.ai_consultations.push(result);
                    this.db.saveData();
                    break;

                case 'support_requests':
                    result = {
                        id: this.db.generateId('support'),
                        created_at: new Date().toISOString(),
                        status: 'pending',
                        ...data
                    };
                    this.db.data.support_requests.push(result);
                    this.db.saveData();
                    break;

                case 'doctors':
                    result = {
                        id: this.db.generateId('doctor'),
                        created_at: new Date().toISOString(),
                        ...data
                    };
                    this.db.data.doctors.push(result);
                    this.db.saveData();
                    break;

                default:
                    throw new Error(`Unknown table: ${tableName}`);
            }

            console.log(`${tableName} created successfully:`, result.id);
            return this.createSuccessResponse(result, 201);

        } catch (error) {
            console.error(`Error creating ${tableName}:`, error);
            return this.createErrorResponse(error.message, 400);
        }
    }

    async handlePut(tableName, resourceId, body) {
        try {
            const data = JSON.parse(body || '{}');
            const result = this.db.updateRecord(tableName, resourceId, data);
            
            if (result) {
                return this.createSuccessResponse(result);
            } else {
                return this.createErrorResponse('Resource not found', 404);
            }
        } catch (error) {
            console.error(`Error updating ${tableName}:`, error);
            return this.createErrorResponse(error.message, 400);
        }
    }

    async handlePatch(tableName, resourceId, body) {
        return this.handlePut(tableName, resourceId, body);
    }

    async handleDelete(tableName, resourceId) {
        const success = this.db.deleteRecord(tableName, resourceId);
        
        if (success) {
            return new Response('', { status: 204 });
        } else {
            return this.createErrorResponse('Resource not found', 404);
        }
    }

    createSuccessResponse(data, status = 200) {
        return new Response(JSON.stringify(data), {
            status: status,
            statusText: 'OK',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }

    createErrorResponse(message, status = 500) {
        return new Response(JSON.stringify({ 
            error: message,
            status: status,
            timestamp: new Date().toISOString()
        }), {
            status: status,
            statusText: this.getStatusText(status),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }

    getStatusText(status) {
        const statusTexts = {
            200: 'OK',
            201: 'Created',
            204: 'No Content',
            400: 'Bad Request',
            401: 'Unauthorized',
            404: 'Not Found',
            409: 'Conflict',
            500: 'Internal Server Error'
        };
        return statusTexts[status] || 'Unknown Status';
    }

    // Authentication helpers
    async login(username, password) {
        console.log('Login attempt:', username);
        
        const user = this.db.authenticateUser(username, password);
        if (user) {
            console.log('Login successful for:', username);
            return { success: true, user: user };
        } else {
            console.log('Login failed for:', username);
            return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
        }
    }

    async register(userData) {
        try {
            console.log('Registration attempt:', userData.username);
            
            // Check for existing user
            if (this.db.findUser({ username: userData.username })) {
                return { success: false, error: 'اسم المستخدم موجود بالفعل' };
            }
            
            if (this.db.findUser({ email: userData.email })) {
                return { success: false, error: 'البريد الإلكتروني مستخدم بالفعل' };
            }

            const user = this.db.addUser({
                ...userData,
                user_type: 'user'
            });

            console.log('Registration successful for:', userData.username);
            return { success: true, user: user };
            
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: 'حدث خطأ في إنشاء الحساب' };
        }
    }

    getCurrentUser() {
        return this.db.getCurrentUser();
    }

    logout() {
        this.db.logoutUser();
    }

    // Medical Tips helpers
    getMedicalTips() {
        return this.db.getMedicalTips();
    }

    // Doctors helpers
    getDoctors() {
        return this.db.data.doctors.filter(d => !d.deleted);
    }

    // Messages and Conversations helpers
    getConversationsForUser(userEmail) {
        return this.db.getConversations({ patient_email: userEmail });
    }

    getMessagesForConversation(conversationId) {
        return this.db.getMessages(conversationId);
    }

    // Admin helpers
    getStats() {
        return this.db.getStats();
    }

    getAllUsers() {
        return this.db.data.users.filter(u => !u.deleted);
    }

    getAllConversations() {
        return this.db.getConversations();
    }

    getAllMessages() {
        return this.db.data.messages.filter(m => !m.deleted);
    }

    // Data management
    exportData() {
        return this.db.exportData();
    }

    importData(jsonData) {
        return this.db.importData(jsonData);
    }

    clearAllData() {
        this.db.clearAllData();
    }
}

// Initialize when database is ready
function initializeProductionAPI() {
    if (window.prodDB) {
        window.prodAPI = new ProductionAPI();
        console.log('Production API ready');
        
        // Trigger ready event
        document.dispatchEvent(new CustomEvent('productionAPIReady'));
    } else {
        // Wait a bit and try again
        setTimeout(initializeProductionAPI, 100);
    }
}

// Start initialization
initializeProductionAPI();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductionAPI;
}