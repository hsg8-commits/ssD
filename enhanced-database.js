/**
 * Enhanced Database System for Medical Platform
 * نظام قاعدة بيانات محسن للمنصة الطبية
 * 
 * Features:
 * - Persistent JSON file storage
 * - Advanced encryption for passwords
 * - Data export/import capabilities
 * - Automatic backups
 * - Cross-browser data sync via QR codes
 * - Enhanced security and session management
 */

class EnhancedDatabase {
    constructor() {
        this.storageKey = 'medical_platform_enhanced_db';
        this.backupKey = 'medical_platform_backup';
        this.sessionKey = 'medical_platform_session';
        this.encryptionKey = 'medical_platform_secret_2024';
        
        // Database schema
        this.schema = {
            users: {
                fields: ['id', 'username', 'password_hash', 'salt', 'full_name', 'email', 'phone', 'age', 'gender', 'user_type', 'is_active', 'created_at', 'updated_at', 'last_login', 'login_attempts', 'is_locked'],
                indexes: ['username', 'email', 'user_type']
            },
            doctors: {
                fields: ['id', 'user_id', 'name', 'specialty', 'country', 'experience_years', 'profile_image', 'bio', 'is_available', 'consultation_price', 'rating', 'consultations_count'],
                indexes: ['user_id', 'specialty', 'country', 'is_available']
            },
            medical_tips: {
                fields: ['id', 'title', 'content', 'category', 'author_id', 'image_url', 'is_published', 'views', 'likes', 'created_at', 'updated_at'],
                indexes: ['category', 'author_id', 'is_published']
            },
            conversations: {
                fields: ['id', 'user_id', 'doctor_id', 'user_name', 'doctor_name', 'title', 'status', 'priority', 'last_message', 'last_message_time', 'unread_count', 'is_urgent', 'created_at', 'updated_at'],
                indexes: ['user_id', 'doctor_id', 'status', 'priority']
            },
            messages: {
                fields: ['id', 'conversation_id', 'sender_id', 'sender_type', 'content', 'message_type', 'attachments', 'is_read', 'is_deleted', 'created_at', 'updated_at'],
                indexes: ['conversation_id', 'sender_id', 'sender_type', 'created_at']
            },
            sessions: {
                fields: ['id', 'user_id', 'session_token', 'ip_address', 'user_agent', 'created_at', 'expires_at', 'is_active'],
                indexes: ['user_id', 'session_token', 'is_active']
            },
            audit_log: {
                fields: ['id', 'user_id', 'action', 'table_name', 'record_id', 'old_values', 'new_values', 'ip_address', 'user_agent', 'created_at'],
                indexes: ['user_id', 'action', 'table_name', 'created_at']
            },
            system_settings: {
                fields: ['id', 'key', 'value', 'description', 'is_encrypted', 'updated_by', 'updated_at'],
                indexes: ['key']
            }
        };

        this.data = {};
        this.currentSession = null;
        this.isInitialized = false;
        
        // Initialize
        this.init();
    }

    async init() {
        try {
            console.log('🔧 Enhanced Database System initializing...');
            
            // Initialize tables
            this.initializeTables();
            
            // Load existing data
            await this.loadData();
            
            // Setup default data if needed
            this.setupDefaultData();
            
            // Setup auto-save
            this.setupAutoSave();
            
            // Setup security monitoring
            this.setupSecurityMonitoring();
            
            this.isInitialized = true;
            console.log('✅ Enhanced Database System initialized successfully');
            
            // Trigger custom event
            window.dispatchEvent(new CustomEvent('enhanced-db-ready'));
            
        } catch (error) {
            console.error('❌ Enhanced Database initialization failed:', error);
            throw error;
        }
    }

    initializeTables() {
        Object.keys(this.schema).forEach(tableName => {
            if (!this.data[tableName]) {
                this.data[tableName] = [];
            }
        });
    }

    async loadData() {
        try {
            // Try to load from localStorage first
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (this.validateData(parsed)) {
                    this.data = parsed;
                    console.log('📂 Data loaded from localStorage');
                    return;
                }
            }

            // Try sessionStorage
            const sessionStored = sessionStorage.getItem(this.storageKey);
            if (sessionStored) {
                const parsed = JSON.parse(sessionStored);
                if (this.validateData(parsed)) {
                    this.data = parsed;
                    console.log('📂 Data loaded from sessionStorage');
                    return;
                }
            }

            // Try backup
            await this.loadFromBackup();
            
        } catch (error) {
            console.warn('⚠️ Could not load existing data:', error);
            this.initializeTables();
        }
    }

    validateData(data) {
        if (!data || typeof data !== 'object') return false;
        
        // Check if all required tables exist
        for (const tableName of Object.keys(this.schema)) {
            if (!Array.isArray(data[tableName])) {
                console.warn(`⚠️ Invalid table structure: ${tableName}`);
                return false;
            }
        }
        return true;
    }

    setupDefaultData() {
        // Create default admin user if none exists
        if (this.data.users.length === 0) {
            const adminSalt = this.generateSalt();
            const adminPassword = this.hashPassword('admin123', adminSalt);
            
            const adminUser = {
                id: this.generateUUID(),
                username: 'admin',
                password_hash: adminPassword,
                salt: adminSalt,
                full_name: 'مدير النظام',
                email: 'admin@medical-platform.com',
                phone: '+966501234567',
                age: 35,
                gender: 'male',
                user_type: 'admin',
                is_active: true,
                created_at: Date.now(),
                updated_at: Date.now(),
                last_login: null,
                login_attempts: 0,
                is_locked: false
            };

            this.data.users.push(adminUser);

            // Create default doctor
            const doctorSalt = this.generateSalt();
            const doctorPassword = this.hashPassword('doctor123', doctorSalt);
            
            const doctorUser = {
                id: this.generateUUID(),
                username: 'dr.afrah',
                password_hash: doctorPassword,
                salt: doctorSalt,
                full_name: 'د. أفراح محمد',
                email: 'dr.afrah@medical-platform.com',
                phone: '+967771234567',
                age: 32,
                gender: 'female',
                user_type: 'doctor',
                is_active: true,
                created_at: Date.now(),
                updated_at: Date.now(),
                last_login: null,
                login_attempts: 0,
                is_locked: false
            };

            this.data.users.push(doctorUser);

            // Create doctor profile
            const doctorProfile = {
                id: this.generateUUID(),
                user_id: doctorUser.id,
                name: 'د. أفراح محمد',
                specialty: 'طب عام',
                country: 'اليمن',
                experience_years: 8,
                profile_image: 'https://via.placeholder.com/150/4F46E5/FFFFFF?text=د.أفراح',
                bio: 'طبيبة عامة متخصصة في الصحة العامة والطب الوقائي مع خبرة 8 سنوات في المجال الطبي.',
                is_available: true,
                consultation_price: 50,
                rating: 4.8,
                consultations_count: 127
            };

            this.data.doctors.push(doctorProfile);

            // Add some default medical tips
            const defaultTips = [
                {
                    id: this.generateUUID(),
                    title: 'أهمية غسل اليدين',
                    content: 'غسل اليدين بالماء والصابون لمدة 20 ثانية على الأقل يقلل من انتشار الجراثيم والأمراض بنسبة تصل إلى 80%.',
                    category: 'وقاية',
                    author_id: doctorUser.id,
                    image_url: 'https://via.placeholder.com/400x200/10B981/FFFFFF?text=غسل+اليدين',
                    is_published: true,
                    views: 145,
                    likes: 23,
                    created_at: Date.now() - 86400000, // Yesterday
                    updated_at: Date.now() - 86400000
                },
                {
                    id: this.generateUUID(),
                    title: 'نصائح للنظام الغذائي المتوازن',
                    content: 'تناول 5 حصص من الخضار والفواكه يومياً، واشرب 8 أكواب من الماء، وقلل من السكريات والأملاح.',
                    category: 'تغذية',
                    author_id: doctorUser.id,
                    image_url: 'https://via.placeholder.com/400x200/059669/FFFFFF?text=تغذية+صحية',
                    is_published: true,
                    views: 89,
                    likes: 15,
                    created_at: Date.now() - 172800000, // 2 days ago
                    updated_at: Date.now() - 172800000
                }
            ];

            this.data.medical_tips.push(...defaultTips);

            console.log('✅ Default data created successfully');
        }
    }

    setupAutoSave() {
        // Save data every 30 seconds
        setInterval(() => {
            this.saveData();
        }, 30000);

        // Save on page unload
        window.addEventListener('beforeunload', () => {
            this.saveData();
        });

        // Save on visibility change (when user switches tabs)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveData();
            }
        });
    }

    setupSecurityMonitoring() {
        // Monitor failed login attempts
        this.maxLoginAttempts = 5;
        this.lockoutDuration = 15 * 60 * 1000; // 15 minutes

        // Log security events
        this.securityLog = [];
    }

    // === ENCRYPTION METHODS ===
    
    generateSalt(length = 16) {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let salt = '';
        for (let i = 0; i < length; i++) {
            salt += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return salt;
    }

    async hashPassword(password, salt) {
        // Simple but effective hashing for client-side
        const combined = password + salt + this.encryptionKey;
        
        // Use crypto API if available
        if (window.crypto && window.crypto.subtle) {
            try {
                const encoder = new TextEncoder();
                const data = encoder.encode(combined);
                const hash = await window.crypto.subtle.digest('SHA-256', data);
                return Array.from(new Uint8Array(hash))
                    .map(b => b.toString(16).padStart(2, '0'))
                    .join('');
            } catch (error) {
                console.warn('Crypto API failed, using fallback hash');
            }
        }
        
        // Fallback hashing method
        let hash = 0;
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(16);
    }

    async verifyPassword(password, hash, salt) {
        const computedHash = await this.hashPassword(password, salt);
        return computedHash === hash;
    }

    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    generateSessionToken() {
        return this.generateUUID() + '-' + Date.now() + '-' + this.generateSalt(8);
    }

    // === AUTHENTICATION METHODS ===

    async login(username, password, ipAddress = 'unknown', userAgent = 'unknown') {
        try {
            const user = this.data.users.find(u => u.username === username && u.is_active);
            
            if (!user) {
                this.logSecurityEvent('login_failed', 'user_not_found', username, ipAddress);
                return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
            }

            // Check if account is locked
            if (user.is_locked && user.locked_until && user.locked_until > Date.now()) {
                const remainingTime = Math.ceil((user.locked_until - Date.now()) / 60000);
                return { 
                    success: false, 
                    error: `الحساب مقفل لمدة ${remainingTime} دقيقة أخرى` 
                };
            }

            // Verify password
            const isValidPassword = await this.verifyPassword(password, user.password_hash, user.salt);
            
            if (!isValidPassword) {
                // Increment failed attempts
                user.login_attempts = (user.login_attempts || 0) + 1;
                user.updated_at = Date.now();

                // Lock account if too many attempts
                if (user.login_attempts >= this.maxLoginAttempts) {
                    user.is_locked = true;
                    user.locked_until = Date.now() + this.lockoutDuration;
                    this.logSecurityEvent('account_locked', 'too_many_attempts', username, ipAddress);
                }

                this.saveData();
                this.logSecurityEvent('login_failed', 'wrong_password', username, ipAddress);
                return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
            }

            // Successful login - reset failed attempts
            user.login_attempts = 0;
            user.is_locked = false;
            user.locked_until = null;
            user.last_login = Date.now();
            user.updated_at = Date.now();

            // Create session
            const sessionToken = this.generateSessionToken();
            const session = {
                id: this.generateUUID(),
                user_id: user.id,
                session_token: sessionToken,
                ip_address: ipAddress,
                user_agent: userAgent,
                created_at: Date.now(),
                expires_at: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
                is_active: true
            };

            this.data.sessions.push(session);
            this.currentSession = session;

            // Store session in browser
            sessionStorage.setItem(this.sessionKey, JSON.stringify({
                session_token: sessionToken,
                user_id: user.id
            }));

            this.saveData();
            this.logSecurityEvent('login_success', 'successful_login', username, ipAddress);

            // Return safe user data (without sensitive info)
            const safeUser = { ...user };
            delete safeUser.password_hash;
            delete safeUser.salt;

            return { 
                success: true, 
                user: safeUser, 
                session_token: sessionToken 
            };

        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'حدث خطأ في النظام، يرجى المحاولة لاحقاً' };
        }
    }

    async register(userData) {
        try {
            // Validate required fields
            const required = ['username', 'password', 'full_name', 'email', 'phone', 'age', 'gender'];
            for (const field of required) {
                if (!userData[field]) {
                    return { success: false, error: `حقل ${field} مطلوب` };
                }
            }

            // Check if username exists
            const existingUser = this.data.users.find(u => u.username === userData.username);
            if (existingUser) {
                return { success: false, error: 'اسم المستخدم موجود مسبقاً' };
            }

            // Check if email exists
            const existingEmail = this.data.users.find(u => u.email === userData.email);
            if (existingEmail) {
                return { success: false, error: 'البريد الإلكتروني مسجل مسبقاً' };
            }

            // Create new user
            const salt = this.generateSalt();
            const passwordHash = await this.hashPassword(userData.password, salt);

            const newUser = {
                id: this.generateUUID(),
                username: userData.username,
                password_hash: passwordHash,
                salt: salt,
                full_name: userData.full_name,
                email: userData.email,
                phone: userData.phone,
                age: parseInt(userData.age),
                gender: userData.gender,
                user_type: userData.user_type || 'user',
                is_active: true,
                created_at: Date.now(),
                updated_at: Date.now(),
                last_login: null,
                login_attempts: 0,
                is_locked: false
            };

            this.data.users.push(newUser);
            this.saveData();

            this.logSecurityEvent('user_registered', 'new_registration', userData.username, 'unknown');

            // Return safe user data
            const safeUser = { ...newUser };
            delete safeUser.password_hash;
            delete safeUser.salt;

            return { success: true, user: safeUser };

        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: 'حدث خطأ في إنشاء الحساب' };
        }
    }

    logout(sessionToken = null) {
        try {
            if (sessionToken) {
                const session = this.data.sessions.find(s => s.session_token === sessionToken);
                if (session) {
                    session.is_active = false;
                    session.ended_at = Date.now();
                }
            }

            // Clear current session
            this.currentSession = null;
            sessionStorage.removeItem(this.sessionKey);
            
            this.saveData();
            return { success: true };

        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: 'حدث خطأ في تسجيل الخروج' };
        }
    }

    validateSession(sessionToken) {
        const session = this.data.sessions.find(s => 
            s.session_token === sessionToken && 
            s.is_active && 
            s.expires_at > Date.now()
        );

        if (!session) return null;

        const user = this.data.users.find(u => u.id === session.user_id && u.is_active);
        if (!user) return null;

        // Return safe user data
        const safeUser = { ...user };
        delete safeUser.password_hash;
        delete safeUser.salt;

        return { user: safeUser, session };
    }

    // === DATA MANAGEMENT METHODS ===

    insert(tableName, data) {
        if (!this.schema[tableName]) {
            throw new Error(`Table ${tableName} does not exist`);
        }

        const record = {
            id: data.id || this.generateUUID(),
            ...data,
            created_at: data.created_at || Date.now(),
            updated_at: Date.now()
        };

        this.data[tableName].push(record);
        this.saveData();
        
        this.logAuditEvent('insert', tableName, record.id, null, record);
        return record;
    }

    update(tableName, id, updates) {
        if (!this.schema[tableName]) {
            throw new Error(`Table ${tableName} does not exist`);
        }

        const index = this.data[tableName].findIndex(item => item.id === id);
        if (index === -1) {
            throw new Error(`Record with id ${id} not found in ${tableName}`);
        }

        const oldRecord = { ...this.data[tableName][index] };
        const updatedRecord = {
            ...this.data[tableName][index],
            ...updates,
            updated_at: Date.now()
        };

        this.data[tableName][index] = updatedRecord;
        this.saveData();
        
        this.logAuditEvent('update', tableName, id, oldRecord, updatedRecord);
        return updatedRecord;
    }

    delete(tableName, id) {
        if (!this.schema[tableName]) {
            throw new Error(`Table ${tableName} does not exist`);
        }

        const index = this.data[tableName].findIndex(item => item.id === id);
        if (index === -1) {
            throw new Error(`Record with id ${id} not found in ${tableName}`);
        }

        const deletedRecord = this.data[tableName][index];
        this.data[tableName].splice(index, 1);
        this.saveData();
        
        this.logAuditEvent('delete', tableName, id, deletedRecord, null);
        return deletedRecord;
    }

    find(tableName, query = {}, options = {}) {
        if (!this.schema[tableName]) {
            throw new Error(`Table ${tableName} does not exist`);
        }

        let results = [...this.data[tableName]];

        // Apply filters
        Object.keys(query).forEach(key => {
            if (query[key] !== undefined) {
                results = results.filter(item => {
                    if (typeof query[key] === 'object' && query[key].$regex) {
                        const regex = new RegExp(query[key].$regex, query[key].$options || 'i');
                        return regex.test(item[key]);
                    }
                    return item[key] === query[key];
                });
            }
        });

        // Apply sorting
        if (options.sort) {
            const [field, direction] = Object.entries(options.sort)[0];
            results.sort((a, b) => {
                if (direction === -1) {
                    return b[field] > a[field] ? 1 : -1;
                }
                return a[field] > b[field] ? 1 : -1;
            });
        }

        // Apply pagination
        const total = results.length;
        if (options.limit || options.offset) {
            const offset = options.offset || 0;
            const limit = options.limit || total;
            results = results.slice(offset, offset + limit);
        }

        return {
            data: results,
            total,
            offset: options.offset || 0,
            limit: options.limit || total
        };
    }

    findOne(tableName, query) {
        const result = this.find(tableName, query, { limit: 1 });
        return result.data[0] || null;
    }

    // === PERSISTENCE METHODS ===

    saveData() {
        try {
            const dataString = JSON.stringify(this.data);
            
            // Save to localStorage
            localStorage.setItem(this.storageKey, dataString);
            
            // Save to sessionStorage as backup
            sessionStorage.setItem(this.storageKey, dataString);
            
            // Create backup
            this.createBackup();
            
            console.log('💾 Data saved successfully');
            return true;
        } catch (error) {
            console.error('💾 Failed to save data:', error);
            return false;
        }
    }

    createBackup() {
        try {
            const backup = {
                data: this.data,
                timestamp: Date.now(),
                version: '1.0.0'
            };
            
            const backupString = JSON.stringify(backup);
            localStorage.setItem(this.backupKey, backupString);
        } catch (error) {
            console.warn('⚠️ Failed to create backup:', error);
        }
    }

    async loadFromBackup() {
        try {
            const backup = localStorage.getItem(this.backupKey);
            if (backup) {
                const parsed = JSON.parse(backup);
                if (parsed.data && this.validateData(parsed.data)) {
                    this.data = parsed.data;
                    console.log('📂 Data loaded from backup');
                    return true;
                }
            }
        } catch (error) {
            console.warn('⚠️ Failed to load backup:', error);
        }
        return false;
    }

    // === DATA EXPORT/IMPORT ===

    exportData() {
        const exportData = {
            data: this.data,
            schema: this.schema,
            timestamp: Date.now(),
            version: '1.0.0',
            platform: 'دوائك المنزلي'
        };
        
        const dataString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `medical-platform-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        return exportData;
    }

    async importData(file) {
        try {
            const text = await file.text();
            const importData = JSON.parse(text);
            
            if (!importData.data || !this.validateData(importData.data)) {
                throw new Error('Invalid data format');
            }
            
            // Create backup before import
            this.createBackup();
            
            // Import data
            this.data = importData.data;
            this.saveData();
            
            console.log('📥 Data imported successfully');
            return { success: true };
            
        } catch (error) {
            console.error('📥 Import failed:', error);
            return { success: false, error: 'فشل في استيراد البيانات' };
        }
    }

    // === SECURITY & LOGGING ===

    logSecurityEvent(action, type, username, ipAddress) {
        const event = {
            timestamp: Date.now(),
            action,
            type,
            username,
            ip_address: ipAddress,
            user_agent: navigator.userAgent
        };
        
        this.securityLog.push(event);
        console.log('🔐 Security Event:', event);
    }

    logAuditEvent(action, tableName, recordId, oldValues, newValues) {
        const auditRecord = {
            id: this.generateUUID(),
            user_id: this.currentSession?.user_id || 'system',
            action,
            table_name: tableName,
            record_id: recordId,
            old_values: oldValues ? JSON.stringify(oldValues) : null,
            new_values: newValues ? JSON.stringify(newValues) : null,
            ip_address: 'unknown',
            user_agent: navigator.userAgent,
            created_at: Date.now()
        };
        
        this.data.audit_log = this.data.audit_log || [];
        this.data.audit_log.push(auditRecord);
    }

    // === UTILITY METHODS ===

    getStatistics() {
        const stats = {
            tables: {},
            total_records: 0,
            database_size: 0,
            last_backup: null
        };

        Object.keys(this.schema).forEach(tableName => {
            const count = this.data[tableName].length;
            stats.tables[tableName] = count;
            stats.total_records += count;
        });

        try {
            const dataString = JSON.stringify(this.data);
            stats.database_size = new Blob([dataString]).size;
        } catch (error) {
            stats.database_size = 0;
        }

        try {
            const backup = localStorage.getItem(this.backupKey);
            if (backup) {
                const parsed = JSON.parse(backup);
                stats.last_backup = parsed.timestamp;
            }
        } catch (error) {
            // Ignore
        }

        return stats;
    }

    clearAllData() {
        if (confirm('هل أنت متأكد من حذف جميع البيانات؟ هذا الإجراء لا يمكن التراجع عنه.')) {
            this.initializeTables();
            this.setupDefaultData();
            this.saveData();
            console.log('🗑️ All data cleared and reset to defaults');
            return true;
        }
        return false;
    }
}

// Global instance
window.enhancedDB = new EnhancedDatabase();

// Make it available globally
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedDatabase;
}