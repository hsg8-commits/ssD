// Local Database System for دوائك المنزلي
// Works in any hosting environment without server dependencies

class LocalDatabase {
    constructor() {
        this.storageKey = 'medical_platform_data';
        this.data = this.loadData();
        this.initializeDefaultData();
        console.log('Local Database initialized');
    }

    // Load data from localStorage
    loadData() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading data from localStorage:', error);
        }
        
        return this.getDefaultStructure();
    }

    // Save data to localStorage
    saveData() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
            return true;
        } catch (error) {
            console.error('Error saving data to localStorage:', error);
            return false;
        }
    }

    // Get default database structure
    getDefaultStructure() {
        return {
            users: [],
            doctors: [],
            conversations: [],
            messages: [],
            medical_tips: [],
            visitors: [],
            ai_consultations: [],
            support_requests: [],
            settings: {
                initialized: false,
                lastBackup: null
            }
        };
    }

    // Initialize with default data
    initializeDefaultData() {
        if (this.data.settings.initialized) {
            return; // Already initialized
        }

        // Add default admin user
        this.addUser({
            username: 'admin',
            password: 'admin123',
            full_name: 'مدير النظام',
            email: 'admin@dawaakmanzaly.com',
            phone: '+966501234567',
            age: 30,
            gender: 'male',
            user_type: 'admin',
            is_active: true
        });

        // Add default doctor
        this.addDoctor({
            user_id: 'dr_afrah',
            name: 'د. أفراح محمد',
            specialty: 'طب عام',
            country: 'اليمن',
            experience_years: 8,
            profile_image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face',
            bio: 'طبيبة عامة متخصصة في الطب الباطني والأمراض الشائعة مع خبرة 8 سنوات في التشخيص والعلاج',
            is_available: true,
            consultation_price: 100,
            username: 'dr.afrah',
            password: 'doctor123',
            user_type: 'doctor',
            email: 'dr.afrah@dawaakmanzaly.com'
        });

        // Add default medical tips
        const defaultTips = [
            {
                title: 'أهمية غسل اليدين',
                content: 'غسل اليدين بالماء والصابون لمدة 20 ثانية من أهم طرق الوقاية من الأمراض المعدية.',
                category: 'وقاية',
                author_id: 'dr_afrah',
                image_url: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=600&h=300&fit=crop',
                is_published: true,
                views: 150
            },
            {
                title: 'نصائح للنظام الغذائي المتوازن',
                content: 'تناول الخضروات والفواكه يومياً، وشرب 8 أكواب من الماء، وتجنب الأطعمة المصنعة.',
                category: 'تغذية',
                author_id: 'dr_afrah',
                image_url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=300&fit=crop',
                is_published: true,
                views: 203
            },
            {
                title: 'فوائد الرياضة لصحة القلب',
                content: 'ممارسة الرياضة لمدة 30 دقيقة يومياً تقوي عضلة القلب وتحسن الدورة الدموية.',
                category: 'صحة القلب',
                author_id: 'dr_afrah',
                image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=300&fit=crop',
                is_published: true,
                views: 180
            }
        ];

        defaultTips.forEach(tip => this.addMedicalTip(tip));

        // Mark as initialized
        this.data.settings.initialized = true;
        this.data.settings.lastBackup = new Date().toISOString();
        this.saveData();

        console.log('Default data initialized');
    }

    // Generate unique ID
    generateId(prefix = '') {
        return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Users operations
    addUser(userData) {
        const user = {
            id: this.generateId('user'),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...userData
        };
        
        this.data.users.push(user);
        this.saveData();
        return user;
    }

    findUser(criteria) {
        return this.data.users.find(user => {
            return Object.keys(criteria).every(key => user[key] === criteria[key]);
        });
    }

    updateUser(userId, updates) {
        const userIndex = this.data.users.findIndex(user => user.id === userId);
        if (userIndex !== -1) {
            this.data.users[userIndex] = {
                ...this.data.users[userIndex],
                ...updates,
                updated_at: new Date().toISOString()
            };
            this.saveData();
            return this.data.users[userIndex];
        }
        return null;
    }

    // Doctors operations
    addDoctor(doctorData) {
        const doctor = {
            id: this.generateId('doctor'),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...doctorData
        };
        
        this.data.doctors.push(doctor);
        
        // Also add as user if has user credentials
        if (doctorData.username && doctorData.password) {
            this.addUser({
                username: doctorData.username,
                password: doctorData.password,
                full_name: doctorData.name,
                email: doctorData.email,
                user_type: doctorData.user_type || 'doctor',
                is_active: true
            });
        }
        
        this.saveData();
        return doctor;
    }

    getDoctors(limit = 100) {
        return this.data.doctors.slice(0, limit);
    }

    // Conversations operations
    addConversation(conversationData) {
        const conversation = {
            id: this.generateId('conv'),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            messages: [],
            ...conversationData
        };
        
        this.data.conversations.push(conversation);
        this.saveData();
        return conversation;
    }

    findConversation(criteria) {
        return this.data.conversations.find(conv => {
            return Object.keys(criteria).every(key => conv[key] === criteria[key]);
        });
    }

    updateConversation(convId, updates) {
        const convIndex = this.data.conversations.findIndex(conv => conv.id === convId);
        if (convIndex !== -1) {
            this.data.conversations[convIndex] = {
                ...this.data.conversations[convIndex],
                ...updates,
                updated_at: new Date().toISOString()
            };
            this.saveData();
            return this.data.conversations[convIndex];
        }
        return null;
    }

    // Messages operations
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
        return message;
    }

    getMessages(conversationId, limit = 100) {
        return this.data.messages
            .filter(msg => msg.conversation_id === conversationId)
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
            .slice(-limit);
    }

    // Medical Tips operations
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
        return tip;
    }

    getMedicalTips(limit = 100) {
        return this.data.medical_tips
            .filter(tip => tip.is_published)
            .slice(0, limit);
    }

    // Visitors operations
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

    // AI Consultations operations
    addAIConsultation(consultationData) {
        const consultation = {
            id: this.generateId('ai'),
            created_at: new Date().toISOString(),
            response_time: new Date().toISOString(),
            confidence_level: 0.85,
            is_reviewed: false,
            ...consultationData
        };
        
        this.data.ai_consultations.push(consultation);
        this.saveData();
        return consultation;
    }

    // Support Requests operations
    addSupportRequest(requestData) {
        const request = {
            id: this.generateId('support'),
            created_at: new Date().toISOString(),
            status: 'pending',
            priority: 'normal',
            ...requestData
        };
        
        this.data.support_requests.push(request);
        this.saveData();
        return request;
    }

    // Generic query methods
    query(tableName, criteria = {}, limit = 100) {
        if (!this.data[tableName]) {
            return [];
        }

        let results = this.data[tableName];
        
        // Apply filters
        if (Object.keys(criteria).length > 0) {
            results = results.filter(item => {
                return Object.keys(criteria).every(key => {
                    if (key.includes('&')) {
                        // Handle special query parameters like conversation_id&is_read=false
                        return true; // Skip for now
                    }
                    return item[key] === criteria[key];
                });
            });
        }

        // Apply limit
        return results.slice(0, limit);
    }

    // Backup and restore
    exportData() {
        return JSON.stringify(this.data, null, 2);
    }

    importData(jsonData) {
        try {
            const importedData = JSON.parse(jsonData);
            this.data = { ...this.getDefaultStructure(), ...importedData };
            this.saveData();
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    // Clear all data (for testing)
    clearAllData() {
        this.data = this.getDefaultStructure();
        this.saveData();
        console.log('All data cleared');
    }

    // Get statistics
    getStats() {
        return {
            users: this.data.users.length,
            doctors: this.data.doctors.length,
            conversations: this.data.conversations.length,
            messages: this.data.messages.length,
            medical_tips: this.data.medical_tips.length,
            visitors: this.data.visitors.length,
            ai_consultations: this.data.ai_consultations.length,
            support_requests: this.data.support_requests.length
        };
    }
}

// Create global database instance
window.localDB = new LocalDatabase();