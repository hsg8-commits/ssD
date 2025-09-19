// Admin Dashboard JavaScript for دوائك المنزلي
class AdminDashboard {
    constructor() {
        this.currentSection = 'dashboard';
        this.charts = {};
        this.data = {
            users: [],
            doctors: [],
            visitors: [],
            conversations: [],
            tips: [],
            aiConsultations: []
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDashboardData();
        this.initializeCharts();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.closest('[data-section]').dataset.section;
                this.navigateToSection(section);
            });
        });

        // Add buttons
        document.getElementById('addUserBtn')?.addEventListener('click', () => {
            this.showAddUserModal();
        });

        document.getElementById('addDoctorBtn')?.addEventListener('click', () => {
            this.showAddDoctorModal();
        });

        document.getElementById('addTipBtn')?.addEventListener('click', () => {
            this.showAddTipModal();
        });
    }

    navigateToSection(section) {
        // Update active nav
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('bg-white', 'bg-opacity-10');
        });
        
        document.querySelector(`[data-section="${section}"]`)?.classList.add('bg-white', 'bg-opacity-10');

        // Hide all sections
        document.querySelectorAll('section').forEach(sec => {
            sec.classList.add('hidden');
        });

        // Show target section
        const targetSection = document.getElementById(section + 'Section');
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }

        // Update page title
        const titles = {
            dashboard: 'لوحة المتابعة',
            visitors: 'إحصائيات الزوار',
            users: 'إدارة المستخدمين',
            doctors: 'إدارة الطبيبات',
            conversations: 'إدارة المحادثات',
            tips: 'إدارة النصائح الطبية',
            ai: 'استشارات الذكاء الاصطناعي'
        };
        
        document.getElementById('pageTitle').textContent = titles[section] || section;

        this.currentSection = section;
        this.loadSectionData(section);
    }

    async loadDashboardData() {
        try {
            // Load all data in parallel
            const [users, doctors, visitors, conversations, tips, aiConsultations] = await Promise.all([
                this.fetchTableData('users'),
                this.fetchTableData('doctors'),
                this.fetchTableData('visitors'),
                this.fetchTableData('conversations'),
                this.fetchTableData('medical_tips'),
                this.fetchTableData('ai_consultations')
            ]);

            this.data = { users, doctors, visitors, conversations, tips, aiConsultations };
            this.updateDashboardStats();
            this.updateCharts();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    async fetchTableData(tableName) {
        try {
            const response = await fetch(`tables/${tableName}?limit=1000`);
            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error(`Error fetching ${tableName}:`, error);
            return [];
        }
    }

    updateDashboardStats() {
        // Total users
        document.getElementById('totalUsers').textContent = this.data.users.length;

        // Active doctors
        const activeDoctors = this.data.doctors.filter(doc => doc.is_available).length;
        document.getElementById('activeDoctors').textContent = activeDoctors;

        // Today's conversations
        const today = new Date().toISOString().split('T')[0];
        const todayConversations = this.data.conversations.filter(conv => 
            conv.created_at && conv.created_at.startsWith(today)
        ).length;
        document.getElementById('todayConversations').textContent = todayConversations;

        // Today's visitors
        const todayVisitors = this.data.visitors.filter(visitor => 
            visitor.visit_time && visitor.visit_time.startsWith(today)
        ).length;
        document.getElementById('todayVisitors').textContent = todayVisitors;

        this.loadRecentActivities();
    }

    loadRecentActivities() {
        const activities = [];
        
        // Add recent conversations
        this.data.conversations.slice(-5).forEach(conv => {
            activities.push({
                type: 'conversation',
                message: 'محادثة جديدة مع طبيبة',
                time: conv.created_at,
                icon: 'fas fa-comments',
                color: 'text-blue-500'
            });
        });

        // Add recent registrations
        this.data.users.slice(-3).forEach(user => {
            activities.push({
                type: 'registration',
                message: `تسجيل مستخدم جديد: ${user.full_name}`,
                time: user.created_at,
                icon: 'fas fa-user-plus',
                color: 'text-green-500'
            });
        });

        // Sort by time
        activities.sort((a, b) => new Date(b.time) - new Date(a.time));

        const activitiesContainer = document.getElementById('recentActivities');
        activitiesContainer.innerHTML = activities.slice(0, 10).map(activity => `
            <div class="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div class="flex-shrink-0">
                    <i class="${activity.icon} ${activity.color} text-lg ml-3"></i>
                </div>
                <div class="flex-1">
                    <p class="text-gray-800 font-medium">${activity.message}</p>
                    <p class="text-gray-500 text-sm">${this.formatDate(activity.time)}</p>
                </div>
            </div>
        `).join('');
    }

    initializeCharts() {
        // Visitors Chart
        const visitorsCtx = document.getElementById('visitorsChart');
        if (visitorsCtx) {
            this.charts.visitors = new Chart(visitorsCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'الزوار',
                        data: [],
                        borderColor: 'rgb(99, 102, 241)',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        // Countries Chart
        const countriesCtx = document.getElementById('countriesChart');
        if (countriesCtx) {
            this.charts.countries = new Chart(countriesCtx, {
                type: 'doughnut',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: [
                            '#3B82F6',
                            '#10B981', 
                            '#8B5CF6',
                            '#F59E0B',
                            '#EF4444',
                            '#6B7280'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    }

    updateCharts() {
        this.updateVisitorsChart();
        this.updateCountriesChart();
    }

    updateVisitorsChart() {
        if (!this.charts.visitors) return;

        // Get last 7 days data
        const days = [];
        const counts = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            days.push(date.toLocaleDateString('ar-EG', { weekday: 'short' }));
            
            const dayVisitors = this.data.visitors.filter(visitor => 
                visitor.visit_time && visitor.visit_time.startsWith(dateStr)
            ).length;
            
            counts.push(dayVisitors);
        }

        this.charts.visitors.data.labels = days;
        this.charts.visitors.data.datasets[0].data = counts;
        this.charts.visitors.update();
    }

    updateCountriesChart() {
        if (!this.charts.countries) return;

        // Count visitors by country
        const countryCounts = {};
        this.data.visitors.forEach(visitor => {
            const country = visitor.country || 'غير معروف';
            countryCounts[country] = (countryCounts[country] || 0) + 1;
        });

        const sortedCountries = Object.entries(countryCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 6);

        this.charts.countries.data.labels = sortedCountries.map(([country]) => country);
        this.charts.countries.data.datasets[0].data = sortedCountries.map(([,count]) => count);
        this.charts.countries.update();
    }

    loadSectionData(section) {
        switch(section) {
            case 'visitors':
                this.loadVisitorsSection();
                break;
            case 'users':
                this.loadUsersSection();
                break;
            case 'doctors':
                this.loadDoctorsSection();
                break;
            case 'conversations':
                this.loadConversationsSection();
                break;
            case 'tips':
                this.loadTipsSection();
                break;
            case 'ai':
                this.loadAISection();
                break;
        }
    }

    loadVisitorsSection() {
        const tableBody = document.getElementById('visitorsTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = this.data.visitors.map(visitor => `
            <tr class="border-b hover:bg-gray-50">
                <td class="px-4 py-3">${visitor.ip_address}</td>
                <td class="px-4 py-3">${visitor.country}</td>
                <td class="px-4 py-3">${visitor.city}</td>
                <td class="px-4 py-3">
                    <span class="px-2 py-1 rounded-full text-xs ${this.getDeviceColor(visitor.device_type)}">
                        ${visitor.device_type}
                    </span>
                </td>
                <td class="px-4 py-3">${visitor.browser}</td>
                <td class="px-4 py-3">${visitor.os}</td>
                <td class="px-4 py-3">${this.formatDate(visitor.visit_time)}</td>
                <td class="px-4 py-3">${this.formatDuration(visitor.session_duration)}</td>
            </tr>
        `).join('');
    }

    loadUsersSection() {
        const tableBody = document.getElementById('usersTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = this.data.users.map(user => `
            <tr class="border-b hover:bg-gray-50">
                <td class="px-4 py-3 font-medium">${user.full_name}</td>
                <td class="px-4 py-3">${user.username}</td>
                <td class="px-4 py-3">${user.email || '-'}</td>
                <td class="px-4 py-3">${user.phone || '-'}</td>
                <td class="px-4 py-3">
                    <span class="px-2 py-1 rounded-full text-xs ${this.getUserTypeColor(user.user_type)}">
                        ${this.translateUserType(user.user_type)}
                    </span>
                </td>
                <td class="px-4 py-3">
                    <span class="px-2 py-1 rounded-full text-xs ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${user.is_active ? 'نشط' : 'معطل'}
                    </span>
                </td>
                <td class="px-4 py-3">
                    <div class="flex space-x-2 space-x-reverse">
                        <button onclick="adminDashboard.editUser('${user.id}')" 
                                class="text-blue-600 hover:text-blue-800">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="adminDashboard.toggleUserStatus('${user.id}')" 
                                class="text-${user.is_active ? 'red' : 'green'}-600 hover:text-${user.is_active ? 'red' : 'green'}-800">
                            <i class="fas fa-${user.is_active ? 'ban' : 'check'}"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    loadDoctorsSection() {
        const doctorsGrid = document.getElementById('doctorsGrid');
        if (!doctorsGrid) return;

        doctorsGrid.innerHTML = this.data.doctors.map(doctor => `
            <div class="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div class="flex items-center mb-4">
                    <img src="${doctor.profile_image}" alt="${doctor.name}" 
                         class="w-16 h-16 rounded-full object-cover ml-4">
                    <div class="flex-1">
                        <h3 class="font-bold text-lg text-gray-800">${doctor.name}</h3>
                        <p class="text-blue-600 font-semibold">${doctor.specialty}</p>
                        <p class="text-gray-500 text-sm">${doctor.country}</p>
                    </div>
                    <div class="text-left">
                        <span class="px-2 py-1 rounded-full text-xs ${doctor.is_available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}">
                            ${doctor.is_available ? 'متاحة' : 'غير متاحة'}
                        </span>
                    </div>
                </div>
                
                <div class="mb-4">
                    <p class="text-gray-600 text-sm">${doctor.bio}</p>
                </div>
                
                <div class="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span><i class="fas fa-graduation-cap ml-1"></i>${doctor.experience_years} سنوات</span>
                    <span class="font-bold text-green-600">${doctor.consultation_price} ر.س</span>
                </div>
                
                <div class="flex space-x-2 space-x-reverse">
                    <button onclick="adminDashboard.editDoctor('${doctor.id}')" 
                            class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                        تعديل
                    </button>
                    <button onclick="adminDashboard.toggleDoctorStatus('${doctor.id}')" 
                            class="bg-${doctor.is_available ? 'red' : 'green'}-600 text-white py-2 px-4 rounded-lg hover:bg-${doctor.is_available ? 'red' : 'green'}-700 transition-colors">
                        ${doctor.is_available ? 'تعطيل' : 'تفعيل'}
                    </button>
                </div>
            </div>
        `).join('');
    }

    loadConversationsSection() {
        const conversationsList = document.getElementById('conversationsList');
        if (!conversationsList) return;

        conversationsList.innerHTML = this.data.conversations.map(conversation => {
            const doctor = this.data.doctors.find(d => d.id === conversation.doctor_id);
            const user = this.data.users.find(u => u.id === conversation.user_id);
            
            return `
                <div class="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center space-x-3 space-x-reverse">
                            <img src="${doctor?.profile_image || ''}" alt="${doctor?.name || 'طبيبة'}" 
                                 class="w-10 h-10 rounded-full object-cover">
                            <div>
                                <h4 class="font-semibold text-gray-800">${conversation.title}</h4>
                                <p class="text-sm text-gray-600">المريض: ${user?.full_name || 'غير معروف'}</p>
                            </div>
                        </div>
                        <div class="text-left">
                            <span class="px-2 py-1 rounded-full text-xs ${this.getStatusColor(conversation.status)}">
                                ${conversation.status}
                            </span>
                            ${conversation.is_urgent ? '<span class="mr-2 text-red-500"><i class="fas fa-exclamation-triangle"></i></span>' : ''}
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-between text-sm text-gray-500">
                        <span>آخر رسالة: ${this.formatDate(conversation.last_message_time)}</span>
                        <div class="flex space-x-2 space-x-reverse">
                            <button onclick="adminDashboard.openConversation('${conversation.id}')" 
                                    class="text-blue-600 hover:text-blue-800">
                                <i class="fas fa-eye ml-1"></i>عرض المحادثة
                            </button>
                            <button onclick="adminDashboard.replyAsAdmin('${conversation.id}')" 
                                    class="text-purple-600 hover:text-purple-800">
                                <i class="fas fa-reply ml-1"></i>الرد كأدمن
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    loadTipsSection() {
        const tipsGrid = document.getElementById('tipsManagementGrid');
        if (!tipsGrid) return;

        tipsGrid.innerHTML = this.data.tips.map(tip => `
            <div class="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <img src="${tip.image_url}" alt="${tip.title}" class="w-full h-40 object-cover">
                
                <div class="p-4">
                    <div class="flex items-center justify-between mb-2">
                        <span class="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            ${tip.category}
                        </span>
                        <span class="text-sm text-gray-500">
                            <i class="fas fa-eye ml-1"></i>${tip.views || 0}
                        </span>
                    </div>
                    
                    <h3 class="font-bold text-lg text-gray-800 mb-2">${tip.title}</h3>
                    <p class="text-gray-600 text-sm mb-4">${tip.content.substring(0, 100)}...</p>
                    
                    <div class="flex items-center justify-between">
                        <span class="px-2 py-1 rounded-full text-xs ${tip.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}">
                            ${tip.is_published ? 'منشورة' : 'مسودة'}
                        </span>
                        <div class="flex space-x-2 space-x-reverse">
                            <button onclick="adminDashboard.editTip('${tip.id}')" 
                                    class="text-blue-600 hover:text-blue-800">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="adminDashboard.toggleTipStatus('${tip.id}')" 
                                    class="text-${tip.is_published ? 'red' : 'green'}-600 hover:text-${tip.is_published ? 'red' : 'green'}-800">
                                <i class="fas fa-${tip.is_published ? 'eye-slash' : 'eye'}"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    loadAISection() {
        const aiList = document.getElementById('aiConsultationsList');
        if (!aiList) return;

        aiList.innerHTML = this.data.aiConsultations.map(consultation => {
            const user = this.data.users.find(u => u.id === consultation.user_id);
            
            return `
                <div class="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div class="flex items-center justify-between mb-3">
                        <div>
                            <h4 class="font-semibold text-gray-800">استشارة ذكية</h4>
                            <p class="text-sm text-gray-600">المستخدم: ${user?.full_name || 'غير معروف'}</p>
                        </div>
                        <div class="text-left">
                            <span class="px-2 py-1 rounded-full text-xs ${consultation.is_reviewed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                                ${consultation.is_reviewed ? 'تمت المراجعة' : 'بحاجة لمراجعة'}
                            </span>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <p class="text-sm text-gray-700"><strong>الاستفسار:</strong></p>
                        <p class="text-sm text-gray-600 bg-white p-2 rounded mt-1">${consultation.query.substring(0, 200)}...</p>
                    </div>
                    
                    <div class="mb-3">
                        <p class="text-sm text-gray-700"><strong>رد الذكاء الاصطناعي:</strong></p>
                        <p class="text-sm text-gray-600 bg-white p-2 rounded mt-1">${consultation.ai_response.substring(0, 200)}...</p>
                    </div>
                    
                    <div class="flex items-center justify-between text-sm text-gray-500">
                        <span>وقت الاستشارة: ${this.formatDate(consultation.response_time)}</span>
                        <div class="flex space-x-2 space-x-reverse">
                            <button onclick="adminDashboard.viewFullConsultation('${consultation.id}')" 
                                    class="text-blue-600 hover:text-blue-800">
                                <i class="fas fa-eye ml-1"></i>عرض كامل
                            </button>
                            ${!consultation.is_reviewed ? `
                                <button onclick="adminDashboard.markAsReviewed('${consultation.id}')" 
                                        class="text-green-600 hover:text-green-800">
                                    <i class="fas fa-check ml-1"></i>تمت المراجعة
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Utility Functions
    formatDate(dateString) {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('ar-EG');
    }

    formatDuration(seconds) {
        if (!seconds) return '-';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}س ${minutes}د`;
        } else if (minutes > 0) {
            return `${minutes}د ${secs}ث`;
        } else {
            return `${secs}ث`;
        }
    }

    getDeviceColor(deviceType) {
        const colors = {
            'Mobile': 'bg-blue-100 text-blue-800',
            'Desktop': 'bg-green-100 text-green-800',
            'Tablet': 'bg-purple-100 text-purple-800'
        };
        return colors[deviceType] || 'bg-gray-100 text-gray-800';
    }

    getUserTypeColor(userType) {
        const colors = {
            'admin': 'bg-red-100 text-red-800',
            'doctor': 'bg-purple-100 text-purple-800',
            'user': 'bg-blue-100 text-blue-800'
        };
        return colors[userType] || 'bg-gray-100 text-gray-800';
    }

    translateUserType(userType) {
        const translations = {
            'admin': 'مدير',
            'doctor': 'طبيبة',
            'user': 'مستخدم'
        };
        return translations[userType] || userType;
    }

    getStatusColor(status) {
        const colors = {
            'نشطة': 'bg-green-100 text-green-800',
            'منتهية': 'bg-gray-100 text-gray-800',
            'مغلقة': 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    }

    // Modal Functions
    showAddUserModal() {
        const modal = this.createModal('إضافة مستخدم جديد', `
            <form id="addUserForm" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1">الاسم الكامل</label>
                        <input type="text" name="full_name" required 
                               class="w-full border border-gray-300 rounded-lg p-3 focus:border-purple-500 focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1">اسم المستخدم</label>
                        <input type="text" name="username" required 
                               class="w-full border border-gray-300 rounded-lg p-3 focus:border-purple-500 focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1">البريد الإلكتروني</label>
                        <input type="email" name="email" 
                               class="w-full border border-gray-300 rounded-lg p-3 focus:border-purple-500 focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1">رقم الهاتف</label>
                        <input type="tel" name="phone" 
                               class="w-full border border-gray-300 rounded-lg p-3 focus:border-purple-500 focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1">كلمة المرور</label>
                        <input type="password" name="password" required 
                               class="w-full border border-gray-300 rounded-lg p-3 focus:border-purple-500 focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1">نوع المستخدم</label>
                        <select name="user_type" required 
                                class="w-full border border-gray-300 rounded-lg p-3 focus:border-purple-500 focus:outline-none">
                            <option value="user">مستخدم عادي</option>
                            <option value="doctor">طبيبة</option>
                            <option value="admin">مدير</option>
                        </select>
                    </div>
                </div>
                
                <div class="flex justify-end space-x-3 space-x-reverse mt-6">
                    <button type="button" onclick="this.closest('.fixed').remove()" 
                            class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                        إلغاء
                    </button>
                    <button type="submit" 
                            class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                        إضافة المستخدم
                    </button>
                </div>
            </form>
        `);

        document.getElementById('addUserForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const userData = Object.fromEntries(formData.entries());
            userData.is_active = true;
            userData.age = 0;
            userData.gender = 'ذكر';
            
            try {
                await this.createUser(userData);
                modal.remove();
                this.loadDashboardData();
                this.showNotification('تم إضافة المستخدم بنجاح', 'success');
            } catch (error) {
                this.showNotification('حدث خطأ في إضافة المستخدم', 'error');
            }
        });
    }

    async createUser(userData) {
        const response = await fetch('tables/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        return await response.json();
    }

    createModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        
        modal.innerHTML = `
            <div class="bg-white rounded-2xl max-w-2xl w-full max-h-screen overflow-y-auto">
                <div class="sticky top-0 bg-white border-b p-4 flex justify-between items-center rounded-t-2xl">
                    <h3 class="text-xl font-bold text-gray-800">${title}</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                <div class="p-6">
                    ${content}
                </div>
            </div>
        `;
        
        document.getElementById('modalContainer').appendChild(modal);
        return modal;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 bg-white border-l-4 p-4 rounded-lg shadow-lg max-w-sm`;
        
        const colors = {
            success: 'border-green-500',
            error: 'border-red-500',
            warning: 'border-yellow-500',
            info: 'border-blue-500'
        };
        
        const icons = {
            success: 'fas fa-check-circle text-green-500',
            error: 'fas fa-exclamation-circle text-red-500',
            warning: 'fas fa-exclamation-triangle text-yellow-500',
            info: 'fas fa-info-circle text-blue-500'
        };
        
        notification.className += ` ${colors[type]}`;
        
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="${icons[type]} ml-3"></i>
                <span class="text-gray-800">${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    // User management functions
    async editUser(userId) {
        const user = this.data.users.find(u => u.id === userId);
        if (!user) return;
        
        const modal = this.createModal('تعديل المستخدم', `
            <form id="editUserForm" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1">الاسم الكامل</label>
                        <input type="text" name="full_name" value="${user.full_name}" required 
                               class="w-full border border-gray-300 rounded-lg p-3 focus:border-purple-500 focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1">البريد الإلكتروني</label>
                        <input type="email" name="email" value="${user.email || ''}" 
                               class="w-full border border-gray-300 rounded-lg p-3 focus:border-purple-500 focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1">رقم الهاتف</label>
                        <input type="tel" name="phone" value="${user.phone || ''}" 
                               class="w-full border border-gray-300 rounded-lg p-3 focus:border-purple-500 focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1">العمر</label>
                        <input type="number" name="age" value="${user.age || ''}" 
                               class="w-full border border-gray-300 rounded-lg p-3 focus:border-purple-500 focus:outline-none">
                    </div>
                </div>
                
                <div class="flex justify-end space-x-3 space-x-reverse mt-6">
                    <button type="button" onclick="this.closest('.fixed').remove()" 
                            class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                        إلغاء
                    </button>
                    <button type="submit" 
                            class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                        حفظ التغييرات
                    </button>
                </div>
            </form>
        `);

        document.getElementById('editUserForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const updatedData = Object.fromEntries(formData.entries());
            
            try {
                await fetch(`tables/users/${userId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...user, ...updatedData })
                });
                modal.remove();
                this.loadDashboardData();
                this.showNotification('تم تحديث المستخدم بنجاح', 'success');
            } catch (error) {
                this.showNotification('حدث خطأ في التحديث', 'error');
            }
        });
    }

    async toggleUserStatus(userId) {
        const user = this.data.users.find(u => u.id === userId);
        if (!user) return;
        
        try {
            const newStatus = !user.is_active;
            await fetch(`tables/users/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: newStatus })
            });
            
            user.is_active = newStatus;
            this.loadUsersSection();
            this.showNotification(`تم ${newStatus ? 'تفعيل' : 'إلغاء تفعيل'} المستخدم`, 'success');
        } catch (error) {
            this.showNotification('حدث خطأ في تغيير الحالة', 'error');
        }
    }

    async toggleDoctorStatus(doctorId) {
        const doctor = this.data.doctors.find(d => d.id === doctorId);
        if (!doctor) return;
        
        try {
            const newStatus = !doctor.is_available;
            await fetch(`tables/doctors/${doctorId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_available: newStatus })
            });
            
            doctor.is_available = newStatus;
            this.loadDoctorsSection();
            this.showNotification(`تم ${newStatus ? 'تفعيل' : 'إلغاء تفعيل'} الطبيبة`, 'success');
        } catch (error) {
            this.showNotification('حدث خطأ في تغيير الحالة', 'error');
        }
    }

    async markAsReviewed(consultationId) {
        try {
            await fetch(`tables/ai_consultations/${consultationId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_reviewed: true })
            });
            
            this.loadAISection();
            this.showNotification('تم تمييز الاستشارة كمراجعة', 'success');
        } catch (error) {
            this.showNotification('حدث خطأ في التحديث', 'error');
        }
    }

    showAddDoctorModal() {
        const modal = this.createModal('إضافة طبيبة جديدة', `
            <form id="addDoctorForm" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1">الاسم</label>
                        <input type="text" name="name" required 
                               class="w-full border border-gray-300 rounded-lg p-3 focus:border-purple-500 focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1">التخصص</label>
                        <input type="text" name="specialty" required 
                               class="w-full border border-gray-300 rounded-lg p-3 focus:border-purple-500 focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1">الدولة</label>
                        <input type="text" name="country" required 
                               class="w-full border border-gray-300 rounded-lg p-3 focus:border-purple-500 focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1">سنوات الخبرة</label>
                        <input type="number" name="experience_years" required 
                               class="w-full border border-gray-300 rounded-lg p-3 focus:border-purple-500 focus:outline-none">
                    </div>
                    <div class="col-span-2">
                        <label class="block text-sm font-semibold text-gray-700 mb-1">رابط الصورة</label>
                        <input type="url" name="profile_image" 
                               class="w-full border border-gray-300 rounded-lg p-3 focus:border-purple-500 focus:outline-none">
                    </div>
                    <div class="col-span-2">
                        <label class="block text-sm font-semibold text-gray-700 mb-1">النبذة</label>
                        <textarea name="bio" rows="3" 
                                  class="w-full border border-gray-300 rounded-lg p-3 focus:border-purple-500 focus:outline-none"></textarea>
                    </div>
                </div>
                
                <div class="flex justify-end space-x-3 space-x-reverse mt-6">
                    <button type="button" onclick="this.closest('.fixed').remove()" 
                            class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                        إلغاء
                    </button>
                    <button type="submit" 
                            class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                        إضافة الطبيبة
                    </button>
                </div>
            </form>
        `);

        document.getElementById('addDoctorForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const doctorData = Object.fromEntries(formData.entries());
            doctorData.is_available = true;
            doctorData.consultation_price = 50;
            doctorData.user_id = 'doctor_' + Date.now();
            
            try {
                await fetch('tables/doctors', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(doctorData)
                });
                modal.remove();
                this.loadDashboardData();
                this.showNotification('تم إضافة الطبيبة بنجاح', 'success');
            } catch (error) {
                this.showNotification('حدث خطأ في الإضافة', 'error');
            }
        });
    }

    showAddTipModal() {
        const modal = this.createModal('إضافة نصيحة طبية جديدة', `
            <form id="addTipForm" class="space-y-4">
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">العنوان</label>
                    <input type="text" name="title" required 
                           class="w-full border border-gray-300 rounded-lg p-3 focus:border-purple-500 focus:outline-none">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">التصنيف</label>
                    <select name="category" required 
                            class="w-full border border-gray-300 rounded-lg p-3 focus:border-purple-500 focus:outline-none">
                        <option value="وقاية">وقاية</option>
                        <option value="تغذية">تغذية</option>
                        <option value="أمراض مزمنة">أمراض مزمنة</option>
                        <option value="صحة القلب">صحة القلب</option>
                        <option value="صحة العقل">صحة العقل</option>
                        <option value="طب عام">طب عام</option>
                        <option value="نساء وتوليد">نساء وتوليد</option>
                        <option value="أطفال">أطفال</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">رابط الصورة</label>
                    <input type="url" name="image_url" 
                           class="w-full border border-gray-300 rounded-lg p-3 focus:border-purple-500 focus:outline-none">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">المحتوى</label>
                    <textarea name="content" rows="5" required 
                              class="w-full border border-gray-300 rounded-lg p-3 focus:border-purple-500 focus:outline-none"></textarea>
                </div>
                
                <div class="flex justify-end space-x-3 space-x-reverse mt-6">
                    <button type="button" onclick="this.closest('.fixed').remove()" 
                            class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                        إلغاء
                    </button>
                    <button type="submit" 
                            class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                        إضافة النصيحة
                    </button>
                </div>
            </form>
        `);

        document.getElementById('addTipForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const tipData = Object.fromEntries(formData.entries());
            tipData.is_published = true;
            tipData.views = 0;
            tipData.author_id = 'admin';
            
            try {
                await fetch('tables/medical_tips', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(tipData)
                });
                modal.remove();
                this.loadDashboardData();
                this.showNotification('تم إضافة النصيحة بنجاح', 'success');
            } catch (error) {
                this.showNotification('حدث خطأ في الإضافة', 'error');
            }
        });
    }

    // Chat Management Functions
    async openConversation(conversationId) {
        const conversation = this.data.conversations.find(c => c.id === conversationId);
        if (!conversation) return;

        const user = this.data.users.find(u => u.id === conversation.user_id);
        const doctor = this.data.doctors.find(d => d.id === conversation.doctor_id);

        const modal = this.createModal(`محادثة: ${conversation.title}`, `
            <div class="max-h-96 overflow-y-auto mb-4 border rounded-lg">
                <div id="adminChatMessages" class="p-4 space-y-3">
                    <!-- Messages will load here -->
                </div>
            </div>
            
            <div class="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 class="font-semibold mb-2">معلومات المحادثة:</h4>
                <p><strong>المريض:</strong> ${user?.full_name || 'غير معروف'}</p>
                <p><strong>الطبيبة:</strong> ${doctor?.name || 'غير معروف'}</p>
                <p><strong>الحالة:</strong> ${conversation.status}</p>
                <p><strong>بدأت في:</strong> ${new Date(conversation.created_at).toLocaleString('ar-EG')}</p>
            </div>

            <div class="flex space-x-3 space-x-reverse">
                <button onclick="adminDashboard.replyAsAdmin('${conversationId}')" 
                        class="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700">
                    <i class="fas fa-reply mr-1"></i>
                    الرد كأدمن
                </button>
                <button onclick="adminDashboard.endConversationAsAdmin('${conversationId}')" 
                        class="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700">
                    إنهاء المحادثة
                </button>
            </div>
        `);

        // Load messages
        this.loadConversationMessages(conversationId, 'adminChatMessages');
    }

    async loadConversationMessages(conversationId, containerId) {
        try {
            const response = await fetch('tables/messages?limit=1000');
            const data = await response.json();
            const allMessages = data.data || [];
            
            const messages = allMessages
                .filter(msg => msg.conversation_id === conversationId)
                .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            const container = document.getElementById(containerId);
            if (!container) return;

            if (messages.length === 0) {
                container.innerHTML = '<p class="text-gray-500 text-center">لا توجد رسائل في هذه المحادثة</p>';
                return;
            }

            container.innerHTML = messages.map(message => {
                const senderName = message.sender_type === 'user' ? 'المريض' : 
                                 message.sender_type === 'doctor' ? 'الطبيبة' : 'الأدمن';
                const senderClass = message.sender_type === 'user' ? 'bg-blue-100' : 
                                  message.sender_type === 'doctor' ? 'bg-green-100' : 'bg-purple-100';
                
                return `
                    <div class="message ${senderClass} p-3 rounded-lg">
                        <div class="flex justify-between items-center mb-1">
                            <strong class="text-sm">${senderName}</strong>
                            <span class="text-xs text-gray-500">${new Date(message.timestamp).toLocaleString('ar-EG')}</span>
                        </div>
                        <p class="text-gray-800">${message.message}</p>
                    </div>
                `;
            }).join('');

            container.scrollTop = container.scrollHeight;
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    async replyAsAdmin(conversationId) {
        const conversation = this.data.conversations.find(c => c.id === conversationId);
        if (!conversation) return;

        const replyModal = this.createModal('الرد كأدمن', `
            <div class="mb-4">
                <p class="text-sm text-gray-600 mb-3">الرد على: ${conversation.title}</p>
                <textarea id="adminReplyMessage" rows="4" 
                          placeholder="اكتب ردك هنا..." 
                          class="w-full border border-gray-300 rounded-lg p-3 focus:border-purple-500 focus:outline-none"></textarea>
            </div>
            
            <div class="mb-4">
                <h4 class="font-semibold mb-2">قوالب الردود السريعة:</h4>
                <div class="grid grid-cols-1 gap-2">
                    <button onclick="document.getElementById('adminReplyMessage').value='شكراً لتواصلك معنا. تم مراجعة استشارتك وسنقوم بالرد عليك خلال 24 ساعة.'" 
                            class="text-right p-2 bg-gray-100 hover:bg-gray-200 rounded text-sm">
                        رد تأكيد استلام
                    </button>
                    <button onclick="document.getElementById('adminReplyMessage').value='بناءً على استشارتك، ننصحك بمراجعة طبيب مختص في أقرب وقت ممكن.'" 
                            class="text-right p-2 bg-gray-100 hover:bg-gray-200 rounded text-sm">
                        نصيحة بمراجعة طبيب
                    </button>
                    <button onclick="document.getElementById('adminReplyMessage').value='تمت مراجعة حالتك من قبل فريقنا الطبي. إليك التوصيات المناسبة لحالتك...'" 
                            class="text-right p-2 bg-gray-100 hover:bg-gray-200 rounded text-sm">
                        رد طبي متخصص
                    </button>
                </div>
            </div>

            <div class="flex justify-end space-x-3 space-x-reverse">
                <button onclick="this.closest('.fixed').remove()" 
                        class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                    إلغاء
                </button>
                <button onclick="adminDashboard.sendAdminReply('${conversationId}')" 
                        class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                    إرسال الرد
                </button>
            </div>
        `);
    }

    async sendAdminReply(conversationId) {
        const messageText = document.getElementById('adminReplyMessage').value.trim();
        
        if (!messageText) {
            this.showNotification('يرجى كتابة رسالة قبل الإرسال', 'warning');
            return;
        }

        try {
            const messageData = {
                conversation_id: conversationId,
                sender_id: 'admin',
                sender_type: 'admin',
                message: messageText,
                attachments: [],
                is_read: false,
                timestamp: new Date().toISOString()
            };

            const response = await fetch('tables/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(messageData)
            });

            if (response.ok) {
                // Update conversation last message time
                await fetch(`tables/conversations/${conversationId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        last_message_time: new Date().toISOString()
                    })
                });

                this.showNotification('تم إرسال الرد بنجاح', 'success');
                
                // Close modal and refresh data
                document.querySelectorAll('.fixed').forEach(modal => modal.remove());
                this.loadDashboardData();
            } else {
                throw new Error('فشل في إرسال الرسالة');
            }
        } catch (error) {
            console.error('Error sending admin reply:', error);
            this.showNotification('حدث خطأ في إرسال الرد', 'error');
        }
    }

    async endConversationAsAdmin(conversationId) {
        if (confirm('هل أنت متأكد من إنهاء هذه المحادثة؟')) {
            try {
                await fetch(`tables/conversations/${conversationId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'مغلقة' })
                });

                this.showNotification('تم إنهاء المحادثة', 'success');
                document.querySelectorAll('.fixed').forEach(modal => modal.remove());
                this.loadDashboardData();
            } catch (error) {
                this.showNotification('حدث خطأ في إنهاء المحادثة', 'error');
            }
        }
    }

    // Other functions
    editDoctor(doctorId) { 
        this.showNotification('ميزة تعديل الطبيبة قيد التطوير', 'info');
    }
    
    editTip(tipId) { 
        this.showNotification('ميزة تعديل النصيحة قيد التطوير', 'info');
    }
    
    toggleTipStatus(tipId) { 
        this.showNotification('ميزة تغيير حالة النصيحة قيد التطوير', 'info');
    }
    
    viewFullConsultation(consultationId) {
        const consultation = this.data.aiConsultations.find(c => c.id === consultationId);
        if (!consultation) return;

        const modal = this.createModal('تفاصيل الاستشارة الذكية', `
            <div class="space-y-4">
                <div>
                    <h4 class="font-semibold mb-2">الاستفسار:</h4>
                    <div class="bg-gray-50 p-3 rounded-lg">${consultation.query}</div>
                </div>
                
                <div>
                    <h4 class="font-semibold mb-2">رد الذكاء الاصطناعي:</h4>
                    <div class="bg-blue-50 p-3 rounded-lg">${consultation.ai_response}</div>
                </div>
                
                <div>
                    <h4 class="font-semibold mb-2">معلومات إضافية:</h4>
                    <p><strong>وقت الاستشارة:</strong> ${new Date(consultation.response_time).toLocaleString('ar-EG')}</p>
                    <p><strong>مستوى الثقة:</strong> ${(consultation.confidence_level * 100).toFixed(1)}%</p>
                    <p><strong>حالة المراجعة:</strong> ${consultation.is_reviewed ? 'تمت المراجعة' : 'لم تتم المراجعة'}</p>
                </div>

                <div class="flex justify-end">
                    ${!consultation.is_reviewed ? `
                        <button onclick="adminDashboard.markAsReviewed('${consultationId}')" 
                                class="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 mr-3">
                            تمييز كمراجعة
                        </button>
                    ` : ''}
                    <button onclick="this.closest('.fixed').remove()" 
                            class="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700">
                        إغلاق
                    </button>
                </div>
            </div>
        `);
    }
}

// Initialize Admin Dashboard
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
});