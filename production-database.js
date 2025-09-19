// Production Database System - يعمل في أي بيئة نشر عامة
// نظام قاعدة بيانات موثوق لمنصة دوائك المنزلي

class ProductionDatabase {
    constructor() {
        this.storageKey = 'medical_platform_db';
        this.sessionKey = 'session_data';
        this.data = {};
        
        // Multiple storage fallbacks
        this.storageType = this.detectBestStorage();
        
        console.log('Production Database initializing with storage type:', this.storageType);
        
        this.initialize();
    }

    detectBestStorage() {
        // Test multiple storage options and use the most reliable
        try {
            // Test localStorage
            localStorage.setItem('test_key', 'test_value');
            localStorage.removeItem('test_key');
            
            // Test sessionStorage  
            sessionStorage.setItem('test_key', 'test_value');
            sessionStorage.removeItem('test_key');
            
            return 'hybrid'; // Use both localStorage and sessionStorage
        } catch (error) {
            console.warn('Storage API not available, using memory + cookies');
            return 'memory';
        }
    }

    initialize() {
        // Initialize with default data
        this.data = this.getDefaultData();
        
        // Try to load existing data
        this.loadData();
        
        // Ensure default users exist
        this.ensureDefaultUsers();
        
        // Auto-save every 5 seconds
        setInterval(() => {
            this.autoSave();
        }, 5000);
        
        // Save on page unload
        window.addEventListener('beforeunload', () => {
            this.saveData();
        });
        
        console.log('Production Database initialized successfully');
        console.log('Data loaded:', Object.keys(this.data).map(key => `${key}: ${this.data[key].length}`));
    }

    getDefaultData() {
        return {
            users: [
                {
                    id: 'admin_001',
                    username: 'admin',
                    password: 'admin123',
                    full_name: 'مدير النظام',
                    email: 'admin@dawaakmanzaly.com',
                    phone: '+966501234567',
                    age: 35,
                    gender: 'male',
                    user_type: 'admin',
                    is_active: true,
                    created_at: '2024-01-01T00:00:00.000Z'
                },
                {
                    id: 'doctor_001',
                    username: 'dr.afrah',
                    password: 'doctor123',
                    full_name: 'د. أفراح محمد',
                    email: 'dr.afrah@dawaakmanzaly.com',
                    phone: '+967701234567',
                    age: 32,
                    gender: 'female',
                    user_type: 'doctor',
                    is_active: true,
                    created_at: '2024-01-01T00:00:00.000Z'
                }
            ],
            doctors: [
                {
                    id: 'doctor_001',
                    user_id: 'doctor_001',
                    name: 'د. أفراح محمد',
                    specialty: 'طب عام',
                    country: 'اليمن',
                    experience_years: 8,
                    profile_image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face',
                    bio: 'طبيبة عامة متخصصة في الطب الباطني والأمراض الشائعة مع خبرة 8 سنوات في التشخيص والعلاج',
                    is_available: true,
                    consultation_price: 100,
                    created_at: '2024-01-01T00:00:00.000Z'
                }
            ],
            medical_tips: [
                {
                    id: 'tip_001',
                    title: 'أهمية غسل اليدين',
                    content: 'غسل اليدين بالماء والصابون لمدة 20 ثانية من أهم طرق الوقاية من الأمراض المعدية. احرص على غسل يديك قبل الأكل وبعد استخدام الحمام وعند العودة من الخارج.',
                    category: 'وقاية',
                    author_id: 'doctor_001',
                    image_url: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=600&h=300&fit=crop',
                    is_published: true,
                    views: 150,
                    created_at: '2024-01-01T00:00:00.000Z'
                },
                {
                    id: 'tip_002',
                    title: 'نصائح للنظام الغذائي المتوازن',
                    content: 'تناول الخضروات والفواكه يومياً، واشرب 8 أكواب من الماء، وتجنب الأطعمة المصنعة. النظام الغذائي المتوازن أساس الصحة الجيدة.',
                    category: 'تغذية',
                    author_id: 'doctor_001',
                    image_url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=300&fit=crop',
                    is_published: true,
                    views: 203,
                    created_at: '2024-01-01T00:00:00.000Z'
                }
            ],
            conversations: [],
            messages: [],
            visitors: [],
            ai_consultations: [],
            support_requests: [],
            settings: {
                initialized: true,
                version: '2.0.0',
                last_update: new Date().toISOString()
            }
        };
    }

    ensureDefaultUsers() {
        // Ensure admin and doctor users always exist
        const adminExists = this.data.users.find(u => u.username === 'admin');
        const doctorExists = this.data.users.find(u => u.username === 'dr.afrah');
        
        if (!adminExists) {
            console.log('Adding default admin user');
            this.addUser(this.getDefaultData().users[0]);
        }
        
        if (!doctorExists) {
            console.log('Adding default doctor user');
            this.addUser(this.getDefaultData().users[1]);
        }
    }

    loadData() {
        try {
            let loadedData = null;
            
            if (this.storageType === 'hybrid') {
                // Try localStorage first
                const stored = localStorage.getItem(this.storageKey);
                if (stored) {
                    loadedData = JSON.parse(stored);
                }
                
                // Fallback to sessionStorage
                if (!loadedData) {
                    const sessionStored = sessionStorage.getItem(this.storageKey);
                    if (sessionStored) {
                        loadedData = JSON.parse(sessionStored);
                    }
                }
            } else if (this.storageType === 'memory') {
                // Try to load from cookies
                loadedData = this.loadFromCookies();
            }
            
            if (loadedData && typeof loadedData === 'object') {
                // Merge with default data to ensure all tables exist
                Object.keys(this.data).forEach(key => {
                    if (loadedData[key]) {
                        this.data[key] = loadedData[key];
                    }
                });
                console.log('Data loaded successfully from storage');
            } else {
                console.log('No existing data found, using defaults');
            }
        } catch (error) {
            console.error('Error loading data, using defaults:', error);
        }
    }

    saveData() {
        try {
            const dataString = JSON.stringify(this.data);
            
            if (this.storageType === 'hybrid') {
                // Save to both localStorage and sessionStorage for redundancy
                localStorage.setItem(this.storageKey, dataString);
                sessionStorage.setItem(this.storageKey, dataString);
                
                // Also save critical data in cookies as backup
                this.saveCriticalDataToCookies();
            } else if (this.storageType === 'memory') {
                this.saveToCookies(dataString);
            }
            
            console.log('Data saved successfully');
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            return false;
        }
    }

    saveCriticalDataToCookies() {
        try {
            // Save only critical user data in cookies (size limited)
            const criticalData = {
                users: this.data.users.slice(0, 10), // Limit to prevent cookie size issues
                last_save: new Date().toISOString()
            };
            
            // Use encodeURIComponent for Arabic text support instead of btoa
            const cookieValue = encodeURIComponent(JSON.stringify(criticalData));
            document.cookie = `medical_platform_backup=${cookieValue}; expires=${new Date(Date.now() + 30*24*60*60*1000).toUTCString()}; path=/`;
        } catch (error) {
            console.warn('Could not save backup to cookies:', error);
        }
    }

    loadFromCookies() {
        try {
            const cookies = document.cookie.split(';');
            const backupCookie = cookies.find(cookie => cookie.trim().startsWith('medical_platform_backup='));
            
            if (backupCookie) {
                const cookieValue = backupCookie.split('=')[1];
                return JSON.parse(decodeURIComponent(cookieValue));
            }
        } catch (error) {
            console.warn('Could not load from cookies:', error);
        }
        return null;
    }

    saveToCookies(dataString) {
        // For memory mode, try to save in multiple smaller cookies
        try {
            const chunkSize = 3000; // Safe cookie size
            const chunks = [];
            
            for (let i = 0; i < dataString.length; i += chunkSize) {
                chunks.push(dataString.slice(i, i + chunkSize));
            }
            
            chunks.forEach((chunk, index) => {
                document.cookie = `medical_data_${index}=${btoa(chunk)}; expires=${new Date(Date.now() + 30*24*60*60*1000).toUTCString()}; path=/`;
            });
            
            document.cookie = `medical_data_chunks=${chunks.length}; expires=${new Date(Date.now() + 30*24*60*60*1000).toUTCString()}; path=/`;
        } catch (error) {
            console.error('Could not save to cookies:', error);
        }
    }

    autoSave() {
        this.saveData();
    }

    // Core database operations
    generateId(prefix = 'item') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    addUser(userData) {
        const user = {
            id: this.generateId('user'),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_active: true,
            ...userData
        };
        
        this.data.users.push(user);
        this.saveData();
        console.log('User added:', user.username);
        return user;
    }

    findUser(criteria) {
        const user = this.data.users.find(user => {
            return Object.keys(criteria).every(key => user[key] === criteria[key]);
        });
        
        if (user) {
            console.log('User found:', user.username);
        } else {
            console.log('User not found for criteria:', criteria);
        }
        
        return user;
    }

    authenticateUser(username, password) {
        console.log('Attempting authentication for:', username);
        console.log('Available users:', this.data.users.map(u => u.username));
        
        const user = this.findUser({ username, password });
        
        if (user) {
            console.log('Authentication successful for:', username);
            
            // Set session data
            const sessionData = {
                userId: user.id,
                username: user.username,
                loginTime: new Date().toISOString()
            };
            
            if (this.storageType === 'hybrid') {
                sessionStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
            }
            
            return user;
        } else {
            console.log('Authentication failed for:', username);
            return null;
        }
    }

    getCurrentUser() {
        try {
            if (this.storageType === 'hybrid') {
                const sessionData = sessionStorage.getItem(this.sessionKey);
                if (sessionData) {
                    const session = JSON.parse(sessionData);
                    return this.data.users.find(u => u.id === session.userId);
                }
            }
        } catch (error) {
            console.error('Error getting current user:', error);
        }
        return null;
    }

    logoutUser() {
        try {
            if (this.storageType === 'hybrid') {
                sessionStorage.removeItem(this.sessionKey);
            }
            console.log('User logged out');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    }

    addMessage(messageData) {
        const message = {
            id: this.generateId('msg'),
            created_at: new Date().toISOString(),
            timestamp: messageData.timestamp || new Date().toISOString(),
            is_read: false,
            ...messageData
        };
        
        this.data.messages.push(message);
        this.saveData();
        console.log('Message added:', message.id);
        return message;
    }

    getMessages(conversationId) {
        return this.data.messages
            .filter(msg => msg.conversation_id === conversationId && !msg.deleted)
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    addConversation(conversationData) {
        const conversation = {
            id: this.generateId('conv'),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: 'active',
            ...conversationData
        };
        
        this.data.conversations.push(conversation);
        this.saveData();
        console.log('Conversation added:', conversation.id);
        return conversation;
    }

    getConversations(filters = {}) {
        let conversations = this.data.conversations.filter(conv => !conv.deleted);
        
        Object.keys(filters).forEach(key => {
            if (filters[key] !== undefined) {
                conversations = conversations.filter(conv => conv[key] === filters[key]);
            }
        });
        
        return conversations.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    }

    addMedicalTip(tipData) {
        const tip = {
            id: this.generateId('tip'),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            views: 0,
            is_published: true,
            ...tipData
        };
        
        this.data.medical_tips.push(tip);
        this.saveData();
        console.log('Medical tip added:', tip.id);
        return tip;
    }

    getMedicalTips(published = true) {
        return this.data.medical_tips.filter(tip => 
            !tip.deleted && (!published || tip.is_published)
        );
    }

    addVisitor(visitorData) {
        const visitor = {
            id: this.generateId('visitor'),
            visit_time: new Date().toISOString(),
            ...visitorData
        };
        
        this.data.visitors.push(visitor);
        this.saveData();
        return visitor;
    }

    // Generic query method
    query(tableName, filters = {}, limit = 100) {
        if (!this.data[tableName]) {
            console.warn(`Table ${tableName} not found`);
            return [];
        }

        let results = this.data[tableName].filter(item => !item.deleted);
        
        // Apply filters
        Object.keys(filters).forEach(key => {
            if (filters[key] !== undefined && key !== 'limit' && key !== 'page') {
                results = results.filter(item => item[key] === filters[key]);
            }
        });

        return results.slice(0, limit);
    }

    updateRecord(tableName, id, updates) {
        const index = this.data[tableName].findIndex(item => item.id === id);
        if (index !== -1) {
            this.data[tableName][index] = {
                ...this.data[tableName][index],
                ...updates,
                updated_at: new Date().toISOString()
            };
            this.saveData();
            console.log(`Record updated in ${tableName}:`, id);
            return this.data[tableName][index];
        }
        return null;
    }

    deleteRecord(tableName, id) {
        const index = this.data[tableName].findIndex(item => item.id === id);
        if (index !== -1) {
            this.data[tableName][index].deleted = true;
            this.data[tableName][index].deleted_at = new Date().toISOString();
            this.saveData();
            console.log(`Record deleted from ${tableName}:`, id);
            return true;
        }
        return false;
    }

    getStats() {
        return {
            users: this.data.users.filter(u => !u.deleted).length,
            doctors: this.data.doctors.filter(d => !d.deleted).length,
            conversations: this.data.conversations.filter(c => !c.deleted).length,
            messages: this.data.messages.filter(m => !m.deleted).length,
            medical_tips: this.data.medical_tips.filter(t => !t.deleted).length,
            visitors: this.data.visitors.length,
            storage_type: this.storageType,
            last_save: new Date().toISOString()
        };
    }

    // Export/Import for backup
    exportData() {
        return JSON.stringify(this.data, null, 2);
    }

    importData(jsonData) {
        try {
            const importedData = JSON.parse(jsonData);
            this.data = { ...this.getDefaultData(), ...importedData };
            this.saveData();
            console.log('Data imported successfully');
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    clearAllData() {
        this.data = this.getDefaultData();
        this.saveData();
        console.log('All data cleared and reset to defaults');
    }
}

// Create global instance
window.prodDB = new ProductionDatabase();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductionDatabase;
}