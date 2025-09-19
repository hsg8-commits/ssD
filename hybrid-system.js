/**
 * Hybrid System - يعمل مع وبدون خادم Node.js
 * نظام هجين يتكيف مع البيئة تلقائياً
 */

class HybridSystem {
    constructor() {
        this.isServerMode = false;
        this.backendAPI = null;
        this.localStorage = window.localStorage;
        this.currentUser = null;
        
        this.init();
    }

    async init() {
        console.log('🔄 Initializing Hybrid System...');
        
        // اختبار توفر الخادم
        await this.detectServerMode();
        
        if (this.isServerMode) {
            console.log('✅ Server mode detected - using Node.js backend');
            this.backendAPI = window.backendAPI;
        } else {
            console.log('⚠️ No server detected - using localStorage fallback');
            this.initLocalStorage();
        }
        
        // استعادة الجلسة
        await this.restoreSession();
        
        console.log('🚀 Hybrid System initialized');
        
        // إشعار الجاهزية
        window.dispatchEvent(new CustomEvent('hybrid-system-ready'));
    }

    async detectServerMode() {
        try {
            // محاولة الاتصال بالخادم
            const response = await fetch('/api/tables/users?limit=1', {
                method: 'GET',
                timeout: 5000
            });
            
            if (response.ok) {
                this.isServerMode = true;
                return true;
            }
        } catch (error) {
            console.warn('Server not available, using localStorage mode');
        }
        
        this.isServerMode = false;
        return false;
    }

    initLocalStorage() {
        // إنشاء بيانات افتراضية في localStorage
        const defaultData = {
            users: [
                {
                    id: 'admin-001',
                    username: 'admin',
                    password: 'admin123', // في الواقع يجب أن تكون مشفرة
                    full_name: 'مدير النظام',
                    email: 'admin@medical-platform.com',
                    phone: '+966501234567',
                    age: 35,
                    gender: 'male',
                    user_type: 'admin',
                    is_active: true,
                    created_at: Date.now(),
                    updated_at: Date.now()
                },
                {
                    id: 'doctor-001',
                    username: 'dr.afrah',
                    password: 'doctor123',
                    full_name: 'د. أفراح محمد',
                    email: 'dr.afrah@medical-platform.com',
                    phone: '+967771234567',
                    age: 32,
                    gender: 'female',
                    user_type: 'doctor',
                    is_active: true,
                    created_at: Date.now(),
                    updated_at: Date.now()
                }
            ],
            medical_tips: [
                {
                    id: 'tip-001',
                    title: 'أهمية غسل اليدين',
                    content: 'غسل اليدين بالماء والصابون لمدة 20 ثانية على الأقل يقلل من انتشار الجراثيم والأمراض بنسبة تصل إلى 80%.',
                    category: 'وقاية',
                    author_id: 'doctor-001',
                    image_url: 'https://via.placeholder.com/400x200/10B981/FFFFFF?text=غسل+اليدين',
                    is_published: true,
                    views: 145,
                    likes: 23,
                    created_at: Date.now() - 86400000,
                    updated_at: Date.now() - 86400000
                }
            ],
            doctors: [
                {
                    id: 'doctor-profile-001',
                    user_id: 'doctor-001',
                    name: 'د. أفراح محمد',
                    specialty: 'طب عام',
                    country: 'اليمن',
                    experience_years: 8,
                    profile_image: 'https://via.placeholder.com/150/4F46E5/FFFFFF?text=د.أفراح',
                    bio: 'طبيبة عامة متخصصة في الصحة العامة والطب الوقائي مع خبرة 8 سنوات في المجال الطبي.',
                    is_available: true,
                    consultation_price: 50,
                    rating: 4.8,
                    consultations_count: 127,
                    created_at: Date.now(),
                    updated_at: Date.now()
                }
            ],
            conversations: [],
            messages: []
        };

        // تحميل أو إنشاء البيانات
        Object.keys(defaultData).forEach(table => {
            const existing = this.localStorage.getItem(`medical_${table}`);
            if (!existing) {
                this.localStorage.setItem(`medical_${table}`, JSON.stringify(defaultData[table]));
                console.log(`📝 Created localStorage table: ${table}`);
            }
        });
    }

    async restoreSession() {
        const token = this.localStorage.getItem('medical_platform_token');
        const userData = this.localStorage.getItem('medical_platform_user');
        
        if (token && userData) {
            try {
                this.currentUser = JSON.parse(userData);
                console.log('🔄 Session restored:', this.currentUser.full_name);
            } catch (error) {
                console.warn('Failed to restore session:', error);
                this.clearSession();
            }
        }
    }

    // ==================== AUTH METHODS ====================

    async login(username, password) {
        if (this.isServerMode && this.backendAPI) {
            // استخدام الخادم
            return await this.backendAPI.login(username, password);
        } else {
            // استخدام localStorage
            return await this.localLogin(username, password);
        }
    }

    async localLogin(username, password) {
        try {
            const users = JSON.parse(this.localStorage.getItem('medical_users') || '[]');
            const user = users.find(u => u.username === username && u.password === password && u.is_active);
            
            if (user) {
                // حفظ الجلسة
                this.currentUser = user;
                this.localStorage.setItem('medical_platform_token', 'local_token_' + Date.now());
                this.localStorage.setItem('medical_platform_user', JSON.stringify(user));
                
                // تحديث آخر دخول
                user.last_login = Date.now();
                user.updated_at = Date.now();
                this.localStorage.setItem('medical_users', JSON.stringify(users));
                
                console.log('✅ Local login successful:', user.full_name);
                return { success: true, user };
            } else {
                return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
            }
        } catch (error) {
            return { success: false, error: 'حدث خطأ في تسجيل الدخول' };
        }
    }

    async register(userData) {
        if (this.isServerMode && this.backendAPI) {
            return await this.backendAPI.register(userData);
        } else {
            return await this.localRegister(userData);
        }
    }

    async localRegister(userData) {
        try {
            const users = JSON.parse(this.localStorage.getItem('medical_users') || '[]');
            
            // فحص التكرار
            if (users.find(u => u.username === userData.username)) {
                return { success: false, error: 'اسم المستخدم موجود مسبقاً' };
            }
            
            if (users.find(u => u.email === userData.email)) {
                return { success: false, error: 'البريد الإلكتروني مسجل مسبقاً' };
            }
            
            // إنشاء مستخدم جديد
            const newUser = {
                id: 'user_' + Date.now(),
                ...userData,
                user_type: userData.user_type || 'user',
                is_active: true,
                created_at: Date.now(),
                updated_at: Date.now(),
                last_login: null
            };
            
            users.push(newUser);
            this.localStorage.setItem('medical_users', JSON.stringify(users));
            
            console.log('✅ Local registration successful:', newUser.full_name);
            return { success: true, user: newUser };
            
        } catch (error) {
            return { success: false, error: 'حدث خطأ في إنشاء الحساب' };
        }
    }

    logout() {
        this.clearSession();
        return { success: true };
    }

    clearSession() {
        this.currentUser = null;
        this.localStorage.removeItem('medical_platform_token');
        this.localStorage.removeItem('medical_platform_user');
        console.log('🚪 Session cleared');
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isLoggedIn() {
        return !!this.currentUser;
    }

    hasRole(role) {
        return this.currentUser && this.currentUser.user_type === role;
    }

    // ==================== DATA METHODS ====================

    async getTableData(tableName, params = {}) {
        if (this.isServerMode && this.backendAPI) {
            return await this.backendAPI.getTableData(tableName, params);
        } else {
            return this.localGetTableData(tableName, params);
        }
    }

    localGetTableData(tableName, params = {}) {
        try {
            const data = JSON.parse(this.localStorage.getItem(`medical_${tableName}`) || '[]');
            let filteredData = [...data];

            // تطبيق البحث
            if (params.search) {
                const searchTerm = params.search.toLowerCase();
                filteredData = filteredData.filter(item => {
                    const searchFields = ['title', 'name', 'full_name', 'content', 'username', 'specialty'];
                    return searchFields.some(field => 
                        item[field] && item[field].toString().toLowerCase().includes(searchTerm)
                    );
                });
            }

            // تطبيق التصفيف
            if (params.sort) {
                const sortField = params.sort.startsWith('-') ? params.sort.substring(1) : params.sort;
                const sortDirection = params.sort.startsWith('-') ? -1 : 1;
                filteredData.sort((a, b) => {
                    if (sortDirection === -1) {
                        return b[sortField] > a[sortField] ? 1 : -1;
                    }
                    return a[sortField] > b[sortField] ? 1 : -1;
                });
            }

            // تطبيق الترقيم
            const total = filteredData.length;
            const page = parseInt(params.page) || 1;
            const limit = parseInt(params.limit) || 100;
            const offset = (page - 1) * limit;
            const paginatedData = filteredData.slice(offset, offset + limit);

            return {
                data: paginatedData,
                total,
                page,
                limit,
                table: tableName
            };
            
        } catch (error) {
            console.error(`Error loading ${tableName}:`, error);
            return { data: [], total: 0, page: 1, limit: 100, table: tableName };
        }
    }

    async createRecord(tableName, recordData) {
        if (this.isServerMode && this.backendAPI) {
            return await this.backendAPI.createRecord(tableName, recordData);
        } else {
            return this.localCreateRecord(tableName, recordData);
        }
    }

    localCreateRecord(tableName, recordData) {
        try {
            const data = JSON.parse(this.localStorage.getItem(`medical_${tableName}`) || '[]');
            
            const newRecord = {
                id: `${tableName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ...recordData,
                created_at: Date.now(),
                updated_at: Date.now()
            };
            
            data.push(newRecord);
            this.localStorage.setItem(`medical_${tableName}`, JSON.stringify(data));
            
            console.log(`✅ Record created in ${tableName}:`, newRecord.id);
            return newRecord;
            
        } catch (error) {
            console.error(`Error creating record in ${tableName}:`, error);
            throw error;
        }
    }

    async updateRecord(tableName, id, updateData) {
        if (this.isServerMode && this.backendAPI) {
            return await this.backendAPI.updateRecord(tableName, id, updateData);
        } else {
            return this.localUpdateRecord(tableName, id, updateData);
        }
    }

    localUpdateRecord(tableName, id, updateData) {
        try {
            const data = JSON.parse(this.localStorage.getItem(`medical_${tableName}`) || '[]');
            const index = data.findIndex(item => item.id === id);
            
            if (index === -1) {
                throw new Error(`Record with id ${id} not found in ${tableName}`);
            }
            
            data[index] = {
                ...data[index],
                ...updateData,
                updated_at: Date.now()
            };
            
            this.localStorage.setItem(`medical_${tableName}`, JSON.stringify(data));
            
            console.log(`✅ Record updated in ${tableName}:`, id);
            return data[index];
            
        } catch (error) {
            console.error(`Error updating record in ${tableName}:`, error);
            throw error;
        }
    }

    // ==================== COMPATIBILITY LAYER ====================

    // محاكاة fetch للتوافق مع الكود الموجود
    async handleFetchRequest(url, options = {}) {
        if (!url.includes('tables/')) {
            // ليس طلب API - استخدام fetch العادي
            return fetch(url, options);
        }

        const urlPath = url.replace(/^.*tables\//, '');
        const pathParts = urlPath.split('?')[0].split('/');
        const [tableName, resourceId] = pathParts;
        const queryParams = this.parseQueryString(url);

        try {
            switch (options.method?.toUpperCase() || 'GET') {
                case 'GET':
                    if (resourceId) {
                        // Get single record - not implemented in localStorage mode
                        const data = await this.getTableData(tableName);
                        const record = data.data.find(item => item.id === resourceId);
                        return this.createMockResponse(record || null, record ? 200 : 404);
                    } else {
                        const data = await this.getTableData(tableName, queryParams);
                        return this.createMockResponse(data);
                    }

                case 'POST':
                    const postData = JSON.parse(options.body);
                    const created = await this.createRecord(tableName, postData);
                    return this.createMockResponse(created, 201);

                case 'PUT':
                case 'PATCH':
                    const updateData = JSON.parse(options.body);
                    const updated = await this.updateRecord(tableName, resourceId, updateData);
                    return this.createMockResponse(updated);

                default:
                    throw new Error(`Method ${options.method} not supported`);
            }
        } catch (error) {
            return this.createMockResponse({ error: error.message }, 500);
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

    createMockResponse(data, status = 200) {
        return {
            ok: status >= 200 && status < 300,
            status: status,
            statusText: status === 200 ? 'OK' : status === 201 ? 'Created' : 'Error',
            json: async () => data,
            text: async () => JSON.stringify(data),
            headers: new Headers({
                'Content-Type': 'application/json',
                'X-Hybrid-System': 'true'
            })
        };
    }
}

// إنشاء النظام الهجين العام
window.hybridSystem = new HybridSystem();

// توافق مع الكود الموجود
window.enhancedAuth = {
    async login(username, password) {
        return await window.hybridSystem.login(username, password);
    },
    
    async register(userData) {
        return await window.hybridSystem.register(userData);
    },
    
    logout() {
        return window.hybridSystem.logout();
    },
    
    getCurrentUser() {
        return window.hybridSystem.getCurrentUser();
    },
    
    isLoggedIn() {
        return window.hybridSystem.isLoggedIn();
    },
    
    hasRole(role) {
        return window.hybridSystem.hasRole(role);
    }
};

// استبدال fetch للتوافق
const originalFetch = window.fetch;
window.fetch = async (url, options = {}) => {
    if (typeof url === 'string' && url.includes('tables/')) {
        return await window.hybridSystem.handleFetchRequest(url, options);
    }
    return originalFetch(url, options);
};

console.log('🚀 Hybrid System loaded - works with and without Node.js server');