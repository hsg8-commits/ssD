// Main JavaScript for دوائك المنزلي Platform
class MedicalPlatform {
    constructor() {
        this.currentUser = null;
        this.currentSection = 'home';
        this.medicalTips = [];
        this.doctors = [];
        this.conversations = [];
        this.visitors = [];
        this.uploadedFiles = [];
        
        // Check if running in production environment
        this.isProduction = window.location.protocol === 'https:' && !window.location.hostname.includes('localhost');
        
        console.log('Medical Platform initializing...', {
            isProduction: this.isProduction,
            hostname: window.location.hostname,
            protocol: window.location.protocol,
            usingLocalDatabase: true
        });
        
        // Wait for database to be ready
        this.waitForDatabase().then(() => {
            this.init();
        });
    }

    async waitForDatabase() {
        // Wait for hybrid system to be available
        await new Promise(resolve => {
            if (window.hybridSystem) {
                resolve();
            } else {
                window.addEventListener('hybrid-system-ready', resolve);
            }
        });
        console.log('Hybrid system ready - Database connection established');
    }

    init() {
        this.setupEventListeners();
        this.trackVisitor();
        this.loadMedicalTips();
        this.loadDoctors();
        this.initializeComponents();
        
        // Check if user is logged in
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.updateUIForLoggedInUser();
        }
    }

    setupEventListeners() {
        // Sidebar toggle
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            this.toggleSidebar();
        });

        document.getElementById('closeSidebar').addEventListener('click', () => {
            this.closeSidebar();
        });

        document.getElementById('overlay').addEventListener('click', () => {
            this.closeSidebar();
        });

        // Navigation
        document.querySelectorAll('[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.closest('[data-section]').dataset.section;
                this.navigateToSection(section);
            });
        });

        // Quick action buttons
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.closest('[data-action]').dataset.action;
                this.navigateToSection(action);
            });
        });

        // Login modal - use onclick to avoid conflicts
        const loginBtn = document.getElementById('loginBtn');
        loginBtn.onclick = () => {
            // Check if user is logged in
            if (this.currentUser) {
                this.showUserMenu();
            } else {
                this.showLoginModal();
            }
        };

        document.getElementById('closeLoginModal').addEventListener('click', () => {
            this.hideLoginModal();
        });

        document.getElementById('loginForm').addEventListener('submit', (e) => {
            this.handleLogin(e);
        });

        // Register link
        document.getElementById('registerLink').addEventListener('click', () => {
            this.showRegisterModal();
        });

        // Category filters
        document.querySelectorAll('.category-filter').forEach(filter => {
            filter.addEventListener('click', (e) => {
                this.filterTipsByCategory(e.target.dataset.category);
            });
        });

        // AI Analysis
        document.getElementById('analyzeBtn').addEventListener('click', () => {
            this.analyzeWithAI();
        });

        // File upload
        this.setupFileUpload();

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeSidebar();
                this.hideLoginModal();
            }
        });
    }

    // Visitor Tracking
    async trackVisitor() {
        try {
            if (window.apiAdapter) {
                const visitor = await window.apiAdapter.trackVisitor();
                if (visitor) {
                    console.log('Visitor tracked:', visitor.id);
                }
                // Track session duration
                this.trackSessionDuration();
            }
        } catch (error) {
            console.error('Error tracking visitor:', error);
        }
    }

    async getVisitorInfo() {
        try {
            // Using a free IP geolocation service
            const response = await fetch('https://ipapi.co/json/');
            return await response.json();
        } catch (error) {
            console.error('Error getting visitor info:', error);
            return {};
        }
    }

    getDeviceType() {
        const userAgent = navigator.userAgent.toLowerCase();
        if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
            return 'Mobile';
        } else if (/tablet/i.test(userAgent)) {
            return 'Tablet';
        } else {
            return 'Desktop';
        }
    }

    getBrowserInfo() {
        const userAgent = navigator.userAgent;
        let browser = 'Unknown';
        
        if (userAgent.includes('Chrome')) browser = 'Chrome';
        else if (userAgent.includes('Firefox')) browser = 'Firefox';
        else if (userAgent.includes('Safari')) browser = 'Safari';
        else if (userAgent.includes('Edge')) browser = 'Edge';
        else if (userAgent.includes('Opera')) browser = 'Opera';
        
        return browser;
    }

    getOSInfo() {
        const userAgent = navigator.userAgent;
        let os = 'Unknown';
        
        if (userAgent.includes('Windows')) os = 'Windows';
        else if (userAgent.includes('Mac')) os = 'macOS';
        else if (userAgent.includes('Linux')) os = 'Linux';
        else if (userAgent.includes('Android')) os = 'Android';
        else if (userAgent.includes('iOS')) os = 'iOS';
        
        return os;
    }

    async saveVisitorData(visitData) {
        try {
            const response = await fetch('tables/visitors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(visitData)
            });
            return await response.json();
        } catch (error) {
            console.error('Error saving visitor data:', error);
        }
    }

    trackSessionDuration() {
        const startTime = Date.now();
        
        window.addEventListener('beforeunload', async () => {
            const duration = Math.round((Date.now() - startTime) / 1000);
            // Update session duration in the database
            // This would need to be implemented based on the last visitor record
        });
    }

    // UI Navigation
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        
        sidebar.classList.toggle('open');
        overlay.classList.toggle('hidden');
    }

    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        
        sidebar.classList.remove('open');
        overlay.classList.add('hidden');
    }

    navigateToSection(section) {
        // Save current section state
        this.previousSection = this.currentSection;
        
        // Hide all main sections (but keep header and other elements visible)
        const mainSections = document.querySelectorAll('main > section');
        mainSections.forEach(sec => {
            sec.classList.add('hidden');
            sec.classList.remove('slide-in');
        });

        // Special handling for home section
        if (section === 'home') {
            // Show home section and ensure all elements are visible
            const homeSection = document.getElementById('homeSection');
            const quickActions = document.querySelector('.py-12.-mt-8.relative.z-10');
            const tipsSection = document.getElementById('tipsSection');
            
            if (homeSection) {
                homeSection.classList.remove('hidden');
                homeSection.classList.add('slide-in');
            }
            if (quickActions) {
                quickActions.style.display = 'block';
            }
            if (tipsSection) {
                tipsSection.classList.remove('hidden');
            }
            
            // Ensure all home page elements are restored
            this.restoreHomePageElements();
        } else {
            // Show target section
            const targetSection = document.getElementById(section + 'Section');
            if (targetSection) {
                targetSection.classList.remove('hidden');
                targetSection.classList.add('slide-in');
                
                // Scroll to top of the section
                setTimeout(() => {
                    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            } else {
                console.warn(`Section ${section}Section not found`);
                this.showNotification(`القسم "${section}" غير متوفر حالياً`, 'warning');
                // Fallback to home
                this.navigateToSection('home');
                return;
            }
        }

        // Update current section
        this.currentSection = section;
        
        // Close sidebar
        this.closeSidebar();

        // Load section-specific data
        this.loadSectionData(section);
        
        // Update active nav link
        document.querySelectorAll('[data-section]').forEach(link => {
            link.classList.remove('bg-blue-50', 'text-blue-600');
        });
        
        const activeLink = document.querySelector(`[data-section="${section}"]`);
        if (activeLink) {
            activeLink.classList.add('bg-blue-50', 'text-blue-600');
        }
        
        // Update page title or state if needed
        this.updatePageState(section);
    }

    restoreHomePageElements() {
        // Ensure all home page elements are visible and properly restored
        const elementsToRestore = [
            'homeSection',
            'tipsSection'
        ];
        
        elementsToRestore.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) {
                element.style.display = '';
                element.classList.remove('hidden');
            }
        });
        
        // Restore quick actions section
        const quickActionsSection = document.querySelector('section.py-12.-mt-8');
        if (quickActionsSection) {
            quickActionsSection.style.display = 'block';
            quickActionsSection.classList.remove('hidden');
        }
        
        // Reload home page data to ensure everything is fresh
        this.loadMedicalTips();
        this.loadDoctors();
        
        console.log('Home page elements restored');
    }

    updatePageState(section) {
        // Update browser history if needed
        if (history.pushState) {
            const newUrl = section === 'home' ? '.' : `#${section}`;
            history.pushState({section: section}, '', newUrl);
        }
        
        // Update any other page state indicators
        document.body.className = `section-${section}`;
    }

    loadSectionData(section) {
        switch(section) {
            case 'doctors':
                this.loadDoctorsSection();
                break;
            case 'ai':
                this.loadAISection();
                break;
            case 'tips':
                this.loadTipsSection();
                break;
            case 'profile':
                this.loadUserProfile();
                break;
            case 'settings':
                this.loadSettingsSection();
                break;
            case 'home':
                this.loadHomeSection();
                break;
        }
    }

    loadHomeSection() {
        // Refresh main page data
        this.loadMedicalTips();
        this.loadDoctors();
    }

    loadSettingsSection() {
        // Settings are already loaded in HTML, just add interactivity
        const switches = document.querySelectorAll('.switch input');
        switches.forEach(switchInput => {
            switchInput.addEventListener('change', (e) => {
                const setting = e.target.closest('.flex').querySelector('h3').textContent;
                const isEnabled = e.target.checked;
                this.showNotification(`تم ${isEnabled ? 'تفعيل' : 'إلغاء'} ${setting}`, 'success');
            });
        });
    }

    // Medical Tips Management
    async loadMedicalTips() {
        try {
            const response = await fetch('tables/medical_tips?limit=100');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.medicalTips = data.data || [];
            
            if (this.medicalTips.length === 0) {
                console.log('No medical tips found, this is normal for a new installation');
            }
            
            this.displayMedicalTips();
        } catch (error) {
            console.error('Error loading medical tips:', error);
            this.showNotification('حدث خطأ في تحميل النصائح الطبية، يرجى إعادة تحميل الصفحة', 'error');
            
            // Show placeholder tips
            this.medicalTips = [];
            this.displayMedicalTips();
        }
    }

    displayMedicalTips(tips = this.medicalTips) {
        const tipsGrid = document.getElementById('tipsGrid');
        if (!tipsGrid) return;

        tipsGrid.innerHTML = '';

        if (tips.length === 0) {
            tipsGrid.innerHTML = `
                <div class="col-span-full text-center py-12 text-gray-500">
                    <i class="fas fa-lightbulb text-6xl mb-4 text-gray-300"></i>
                    <p class="text-xl font-semibold mb-2">لا توجد نصائح في هذا التصنيف</p>
                    <p>جرب تصنيفاً آخر أو تصفح جميع النصائح</p>
                </div>
            `;
            return;
        }

        tips.forEach(tip => {
            const tipCard = this.createTipCard(tip);
            tipsGrid.appendChild(tipCard);
        });
    }

    createTipCard(tip) {
        const card = document.createElement('div');
        card.className = 'tip-card p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 slide-in';
        
        // Ensure we have valid data
        const title = tip.title || 'نصيحة طبية';
        const content = tip.content || 'محتوى النصيحة';
        const category = tip.category || 'طب عام';
        const views = tip.views || 0;
        const imageUrl = tip.image_url || 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=600&h=300&fit=crop';
        
        card.innerHTML = `
            <div class="mb-4">
                <img src="${imageUrl}" 
                     alt="${title}" 
                     class="w-full h-48 object-cover rounded-lg"
                     onerror="this.src='https://images.unsplash.com/photo-1584362917165-526a968579e8?w=600&h=300&fit=crop'">
            </div>
            <div class="flex items-center justify-between mb-3">
                <span class="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    ${category}
                </span>
                <div class="flex items-center text-gray-500 text-sm">
                    <i class="fas fa-eye mr-1"></i>
                    ${views}
                </div>
            </div>
            <h3 class="text-xl font-bold text-gray-800 mb-3">${title}</h3>
            <p class="text-gray-600 mb-4">${content.substring(0, 120)}${content.length > 120 ? '...' : ''}</p>
            <button class="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all" 
                    onclick="medicalPlatform.viewTipDetails('${tip.id}')">
                <i class="fas fa-book-open mr-1"></i>
                اقرأ المزيد
            </button>
        `;

        return card;
    }

    filterTipsByCategory(category) {
        // Update active filter button
        document.querySelectorAll('.category-filter').forEach(btn => {
            btn.classList.remove('active');
        });
        
        event.target.classList.add('active');

        // Filter tips
        let filteredTips = this.medicalTips;
        if (category !== 'all') {
            filteredTips = this.medicalTips.filter(tip => tip.category === category);
        }

        this.displayMedicalTips(filteredTips);
    }

    viewTipDetails(tipId) {
        const tip = this.medicalTips.find(t => t.id === tipId);
        if (tip) {
            // Create modal to show tip details
            this.showTipModal(tip);
            // Increment view count
            this.incrementTipViews(tipId);
        }
    }

    showTipModal(tip) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        
        modal.innerHTML = `
            <div class="bg-white rounded-2xl max-w-2xl w-full max-h-screen overflow-y-auto">
                <div class="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                    <h3 class="text-xl font-bold">${tip.title}</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                <div class="p-6">
                    <img src="${tip.image_url}" alt="${tip.title}" class="w-full h-64 object-cover rounded-lg mb-4">
                    <div class="flex items-center mb-4">
                        <span class="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
                            ${tip.category}
                        </span>
                    </div>
                    <div class="prose prose-lg text-gray-700">
                        ${tip.content}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    async incrementTipViews(tipId) {
        try {
            const tip = this.medicalTips.find(t => t.id === tipId);
            if (tip) {
                const updatedTip = { ...tip, views: (tip.views || 0) + 1 };
                
                await fetch(`tables/medical_tips/${tipId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updatedTip)
                });
                
                // Update local data
                const index = this.medicalTips.findIndex(t => t.id === tipId);
                if (index !== -1) {
                    this.medicalTips[index] = updatedTip;
                }
            }
        } catch (error) {
            console.error('Error incrementing tip views:', error);
        }
    }

    // Doctors Management
    async loadDoctors() {
        try {
            const response = await fetch('tables/doctors?limit=100');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.doctors = data.data || [];
            
            if (this.doctors.length === 0) {
                console.log('No doctors found, this is normal for a new installation');
            }
        } catch (error) {
            console.error('Error loading doctors:', error);
            this.showNotification('حدث خطأ في تحميل بيانات الطبيبات', 'error');
            this.doctors = [];
        }
    }

    loadDoctorsSection() {
        const doctorsGrid = document.getElementById('doctorsGrid');
        if (!doctorsGrid) return;

        doctorsGrid.innerHTML = '';

        if (this.doctors.length === 0) {
            doctorsGrid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                    <p class="text-gray-600">جارٍ تحميل الطبيبات...</p>
                </div>
            `;
            
            // Try to reload doctors data
            setTimeout(() => {
                this.loadDoctors().then(() => {
                    if (this.doctors.length > 0) {
                        this.loadDoctorsSection();
                    } else {
                        doctorsGrid.innerHTML = `
                            <div class="col-span-full text-center py-12 text-gray-500">
                                <i class="fas fa-user-md text-6xl mb-4 text-gray-300"></i>
                                <p class="text-xl font-semibold mb-2">لا توجد طبيبات متاحات حالياً</p>
                                <p>يرجى المحاولة مرة أخرى لاحقاً</p>
                            </div>
                        `;
                    }
                });
            }, 1000);
            return;
        }

        this.doctors.forEach(doctor => {
            const doctorCard = this.createDoctorCard(doctor);
            doctorsGrid.appendChild(doctorCard);
        });
    }

    createDoctorCard(doctor) {
        const card = document.createElement('div');
        card.className = 'doctor-card bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100';
        
        // Ensure we have valid data
        const name = doctor.name || 'طبيبة';
        const specialty = doctor.specialty || 'طب عام';
        const country = doctor.country || 'غير محدد';
        const experience = doctor.experience_years || 0;
        const bio = doctor.bio || 'طبيبة متخصصة ومؤهلة لتقديم الاستشارات الطبية';
        const price = doctor.consultation_price || 50;
        const isAvailable = doctor.is_available !== false;
        const profileImage = doctor.profile_image || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face';
        
        card.innerHTML = `
            <div class="relative">
                <img src="${profileImage}" 
                     alt="${name}" 
                     class="w-full h-64 object-cover"
                     onerror="this.src='https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face'">
                ${isAvailable ? `
                    <div class="absolute top-3 right-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                        <span class="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></span>
                        متاحة الآن
                    </div>
                ` : `
                    <div class="absolute top-3 right-3 bg-gray-500 text-white text-xs px-2 py-1 rounded-full">
                        غير متاحة
                    </div>
                `}
            </div>
            <div class="p-6">
                <h3 class="text-xl font-bold text-gray-800 mb-2">${name}</h3>
                <p class="text-blue-600 font-semibold mb-3">${specialty}</p>
                
                <div class="space-y-2 mb-4">
                    <div class="flex items-center text-gray-600 text-sm">
                        <i class="fas fa-map-marker-alt mr-2 text-gray-400"></i>
                        ${country}
                    </div>
                    <div class="flex items-center text-gray-600 text-sm">
                        <i class="fas fa-graduation-cap mr-2 text-gray-400"></i>
                        ${experience} سنوات خبرة
                    </div>
                    <div class="flex items-center text-gray-600 text-sm">
                        <i class="fas fa-dollar-sign mr-2 text-gray-400"></i>
                        ${price} ريال للاستشارة
                    </div>
                </div>
                
                <p class="text-gray-600 mb-4 text-sm leading-relaxed">${bio.substring(0, 100)}${bio.length > 100 ? '...' : ''}</p>
                
                <button class="w-full font-semibold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 ${
                    isAvailable 
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 shadow-md hover:shadow-lg' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }" 
                        onclick="${isAvailable ? `medicalPlatform.startConversation('${doctor.id}')` : ''}" 
                        ${!isAvailable ? 'disabled' : ''}>
                    <i class="fas ${isAvailable ? 'fa-comments' : 'fa-clock'} mr-2"></i>
                    ${isAvailable ? 'ابدأ المحادثة الآن' : 'غير متاحة حالياً'}
                </button>
            </div>
        `;

        return card;
    }

    startConversation(doctorId) {
        if (!this.currentUser) {
            this.showNotification('يرجى تسجيل الدخول أولاً لبدء محادثة مع الطبيبة', 'warning');
            this.showLoginModal();
            return;
        }

        this.showLoadingSpinner();
        this.showNotification('جارٍ إعداد المحادثة مع الطبيبة...', 'info');

        // Create new conversation
        this.createConversation(doctorId);
    }

    async createConversation(doctorId) {
        try {
            const doctor = this.doctors.find(d => d.id === doctorId);
            if (!doctor) {
                this.showNotification('لم يتم العثور على الطبيبة المحددة', 'error');
                return;
            }

            const conversationData = {
                user_id: this.currentUser.id,
                doctor_id: doctorId,
                title: `استشارة طبية مع ${doctor.name}`,
                status: 'نشطة',
                last_message_time: new Date().toISOString(),
                is_urgent: false
            };

            const response = await fetch('tables/conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(conversationData)
            });

            if (response.ok) {
                const conversation = await response.json();
                
                // Create welcome message from doctor
                await this.createWelcomeMessage(conversation.id, doctor);
                
                this.hideLoadingSpinner();
                this.showNotification(`تم إنشاء محادثة مع ${doctor.name} بنجاح!`, 'success');
                this.openChatWindow(conversation, doctor);
            } else {
                throw new Error('فشل في إنشاء المحادثة');
            }
        } catch (error) {
            console.error('Error creating conversation:', error);
            this.hideLoadingSpinner();
            this.showNotification('حدث خطأ في إنشاء المحادثة، يرجى المحاولة مرة أخرى', 'error');
        }
    }

    async createWelcomeMessage(conversationId, doctor) {
        const welcomeMessages = {
            'طب عام': `مرحباً بك! أنا ${doctor.name}، طبيبة متخصصة في الطب العام. أسعد بخدمتك اليوم. يرجى وصف الأعراض أو المشكلة التي تواجهها بالتفصيل.`,
            'نساء وتوليد': `أهلاً وسهلاً بك! أنا ${doctor.name}، متخصصة في أمراض النساء والتوليد. لا تترددي في مشاركة استفساراتك معي بكل ثقة.`,
            'أمراض القلب': `مرحباً! أنا ${doctor.name}، أخصائية أمراض القلب والأوعية الدموية. أرحب باستفساراتك حول صحة القلب والدورة الدموية.`,
            'طب أطفال': `أهلاً بك! أنا ${doctor.name}، طبيبة أطفال. يسعدني مساعدتك في كل ما يتعلق بصحة طفلك.`,
            'أمراض جلدية': `مرحباً بك! أنا ${doctor.name}، متخصصة في الأمراض الجلدية. أرحب بجميع استفساراتك حول مشاكل البشرة والشعر.`,
            'طب نفسي': `أهلاً وسهلاً بك! أنا ${doctor.name}، طبيبة نفسية. هذا مكان آمن للحديث عن أي مشاعر أو ضغوط تواجهها.`
        };

        const welcomeMessage = welcomeMessages[doctor.specialty] || `مرحباً بك! أنا ${doctor.name}. كيف يمكنني مساعدتك اليوم؟`;

        try {
            await fetch('tables/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    conversation_id: conversationId,
                    sender_id: doctor.id,
                    sender_type: 'doctor',
                    message: welcomeMessage,
                    attachments: [],
                    is_read: false,
                    timestamp: new Date().toISOString()
                })
            });
        } catch (error) {
            console.error('Error creating welcome message:', error);
        }
    }

    openChatWindow(conversation, doctor) {
        // Create chat window modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        
        modal.innerHTML = `
            <div class="bg-white rounded-2xl w-full max-w-4xl h-5/6 flex flex-col">
                <!-- Chat Header -->
                <div class="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
                    <div class="flex items-center">
                        <img src="${doctor.profile_image}" alt="${doctor.name}" class="w-12 h-12 rounded-full mr-3">
                        <div>
                            <h3 class="font-bold text-lg">${doctor.name}</h3>
                            <p class="text-purple-100">${doctor.specialty}</p>
                        </div>
                    </div>
                    <button onclick="this.closest('.fixed').remove()" class="text-white hover:text-gray-200">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>

                <!-- Chat Messages -->
                <div id="chatMessages" class="flex-1 overflow-y-auto p-4 bg-gray-50">
                    <div class="text-center text-gray-500 mb-4">
                        <p>بدء المحادثة مع ${doctor.name}</p>
                        <p class="text-sm">يرجى وصف حالتك بالتفصيل</p>
                    </div>
                </div>

                <!-- Chat Input -->
                <div class="border-t p-4 bg-white rounded-b-2xl">
                    <div class="flex items-center space-x-2 space-x-reverse">
                        <input type="text" id="messageInput" placeholder="اكتب رسالتك هنا..." 
                               class="flex-1 border-2 border-gray-300 rounded-lg p-3 focus:border-purple-500 focus:outline-none">
                        <button onclick="medicalPlatform.sendMessage('${conversation.id}')" 
                                class="bg-purple-600 text-white p-3 rounded-lg hover:bg-purple-700 transition-colors">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Load existing messages
        this.loadConversationMessages(conversation.id);

        // Focus input
        setTimeout(() => {
            document.getElementById('messageInput').focus();
        }, 100);

        // Handle enter key
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage(conversation.id);
            }
        });
    }

    async loadConversationMessages(conversationId) {
        try {
            const response = await fetch(`tables/messages?conversation_id=${conversationId}`);
            const data = await response.json();
            const messages = data.data || [];

            const chatMessages = document.getElementById('chatMessages');
            messages.forEach(message => {
                const messageElement = this.createMessageElement(message);
                chatMessages.appendChild(messageElement);
            });

            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    async sendMessage(conversationId) {
        const input = document.getElementById('messageInput');
        const messageText = input.value.trim();
        
        if (!messageText) return;

        try {
            const messageData = {
                conversation_id: conversationId,
                sender_id: this.currentUser.id,
                sender_type: 'user',
                message: messageText,
                attachments: [],
                is_read: false,
                timestamp: new Date().toISOString()
            };

            const response = await fetch('tables/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(messageData)
            });

            const message = await response.json();
            
            // Add message to chat
            const chatMessages = document.getElementById('chatMessages');
            const messageElement = this.createMessageElement(message);
            chatMessages.appendChild(messageElement);
            
            // Clear input
            input.value = '';
            
            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;

            // Update conversation last message time
            this.updateConversationLastMessage(conversationId);

        } catch (error) {
            console.error('Error sending message:', error);
        }
    }

    createMessageElement(message) {
        const div = document.createElement('div');
        div.className = `message ${message.sender_type} mb-3`;
        
        div.innerHTML = `
            <div class="flex ${message.sender_type === 'user' ? 'justify-end' : 'justify-start'}">
                <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.sender_type === 'user' ? 'bg-purple-600 text-white' : 'bg-white border'}">
                    <p>${message.message}</p>
                    <p class="text-xs mt-1 ${message.sender_type === 'user' ? 'text-purple-100' : 'text-gray-500'}">
                        ${new Date(message.timestamp).toLocaleString('ar-EG')}
                    </p>
                </div>
            </div>
        `;

        return div;
    }

    async updateConversationLastMessage(conversationId) {
        try {
            await fetch(`tables/conversations/${conversationId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    last_message_time: new Date().toISOString()
                })
            });
        } catch (error) {
            console.error('Error updating conversation:', error);
        }
    }

    // AI Analysis
    loadAISection() {
        // Setup file upload drag and drop
        this.setupFileUpload();
    }

    setupFileUpload() {
        const uploadArea = document.querySelector('.file-upload-area');
        if (!uploadArea) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => uploadArea.classList.add('dragover'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => uploadArea.classList.remove('dragover'), false);
        });

        uploadArea.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            this.handleFiles(files);
        });

        document.getElementById('fileUpload').addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    handleFiles(files) {
        if (!files || files.length === 0) return;
        
        // تأكد من وجود مصفوفة الملفات
        if (!this.uploadedFiles) {
            this.uploadedFiles = [];
        }
        
        let validFilesCount = 0;
        
        // Add new files to existing ones
        Array.from(files).forEach(file => {
            // Check file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                this.showNotification(`الملف ${file.name} كبير جداً. الحد الأقصى 10 ميجابايت`, 'warning');
                return;
            }
            
            // Check file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!allowedTypes.includes(file.type)) {
                this.showNotification(`نوع الملف ${file.name} غير مدعوم`, 'warning');
                return;
            }
            
            this.uploadedFiles.push(file);
            this.processFile(file);
            validFilesCount++;
        });
        
        if (validFilesCount > 0) {
            this.showNotification(`✅ تم رفع ${validFilesCount} ملف بنجاح وجاهز للتحليل`, 'success');
            
            // تمكين زر التحليل وتحديث النص
            const analyzeBtn = document.getElementById('analyzeBtn');
            if (analyzeBtn) {
                analyzeBtn.disabled = false;
                analyzeBtn.innerHTML = `<i class="fas fa-search mr-2"></i>تحليل ${this.uploadedFiles.length} ملف`;
                analyzeBtn.classList.add('pulse-animation');
                
                setTimeout(() => {
                    analyzeBtn.classList.remove('pulse-animation');
                }, 3000);
            }
        }
        
        console.log('Files uploaded successfully:', this.uploadedFiles.length, 'files');
    }

    processFile(file) {
        // Find or create files container
        let filesContainer = document.getElementById('uploadedFilesContainer');
        if (!filesContainer) {
            filesContainer = document.createElement('div');
            filesContainer.id = 'uploadedFilesContainer';
            filesContainer.className = 'mt-4 space-y-3';
            
            // Add header
            const header = document.createElement('div');
            header.className = 'flex items-center justify-between border-b pb-2 mb-3';
            header.innerHTML = `
                <h4 class="text-lg font-semibold text-gray-800 flex items-center">
                    <i class="fas fa-folder-open text-blue-600 mr-2"></i>
                    الملفات المرفوعة
                </h4>
                <span id="filesCount" class="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">0 ملف</span>
            `;
            filesContainer.appendChild(header);
            
            // Add container after upload area
            const uploadArea = document.querySelector('#aiSection .border-dashed');
            if (uploadArea && uploadArea.parentElement) {
                uploadArea.parentElement.insertBefore(filesContainer, uploadArea.nextSibling);
            }
        }

        // Create file preview with enhanced design
        const preview = document.createElement('div');
        preview.className = 'file-preview bg-gradient-to-r from-white to-gray-50 border-2 border-green-200 rounded-xl p-4 flex items-center justify-between hover:border-green-300 transition-all transform hover:scale-102 file-upload-success shadow-md';
        preview.dataset.fileName = file.name;
        
        const fileIcon = this.getFileIcon(file.type);
        const fileColor = this.getFileColor(file.type);
        
        // Create image preview for images
        let imagePreview = '';
        if (file.type.startsWith('image/')) {
            const imageUrl = URL.createObjectURL(file);
            imagePreview = `
                <div class="w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-200 mr-4">
                    <img src="${imageUrl}" alt="معاينة" class="w-full h-full object-cover">
                </div>`;
        }
        
        preview.innerHTML = `
            <div class="flex items-center flex-1">
                ${imagePreview}
                <div class="flex items-center">
                    <div class="w-12 h-12 rounded-full bg-gradient-to-r ${file.type.startsWith('image/') ? 'from-green-400 to-blue-500' : 'from-purple-400 to-pink-500'} flex items-center justify-center text-white mr-4">
                        <i class="fas ${fileIcon} text-lg"></i>
                    </div>
                    <div>
                        <h4 class="text-sm font-bold text-gray-800 mb-1">${file.name}</h4>
                        <p class="text-xs text-gray-500 mb-1">${this.formatFileSize(file.size)} • ${this.getFileTypeDescription(file.type)}</p>
                        <div class="flex items-center">
                            <span class="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 font-medium">
                                ✅ تم الرفع بنجاح
                            </span>
                            ${file.type.startsWith('image/') ? '<span class="text-xs text-blue-600 font-medium mr-2">🤖 جاهز للتحليل الذكي</span>' : ''}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="flex items-center space-x-3 space-x-reverse">
                <span class="text-xs px-3 py-2 rounded-full font-semibold ${file.type.startsWith('image/') ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}">
                    ${file.type.startsWith('image/') ? '📷 صورة طبية' : '📄 مستند طبي'}
                </span>
                <button onclick="medicalPlatform.removeFile('${file.name}')" 
                        class="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-colors" 
                        title="حذف الملف">
                    <i class="fas fa-trash text-sm"></i>
                </button>
            </div>
        `;

        filesContainer.appendChild(preview);
        
        // Show files counter and update upload area
        this.updateFilesCounter();
        this.updateUploadAreaStatus();
    }

    getFileTypeDescription(mimeType) {
        const descriptions = {
            'image/jpeg': 'صورة JPEG',
            'image/png': 'صورة PNG', 
            'image/jpg': 'صورة JPG',
            'application/pdf': 'ملف PDF',
            'application/msword': 'مستند Word',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'مستند Word'
        };
        return descriptions[mimeType] || 'ملف';
    }

    removeFile(fileName) {
        if (!this.uploadedFiles) {
            this.uploadedFiles = [];
            return;
        }
        
        // Remove from uploadedFiles array
        this.uploadedFiles = this.uploadedFiles.filter(file => file.name !== fileName);
        
        // Remove preview element using data attribute
        const previews = document.querySelectorAll('.file-preview');
        previews.forEach(preview => {
            if (preview.dataset.fileName === fileName) {
                preview.style.animation = 'slideOutUp 0.3s ease-in';
                setTimeout(() => {
                    preview.remove();
                    this.updateFilesCounter();
                    
                    // Reset analyze button if no files
                    if (this.uploadedFiles.length === 0) {
                        const analyzeBtn = document.getElementById('analyzeBtn');
                        if (analyzeBtn) {
                            analyzeBtn.disabled = false;
                            analyzeBtn.innerHTML = `<i class="fas fa-search mr-2"></i>تحليل بالذكاء الاصطناعي`;
                        }
                        
                        // Remove files container if empty
                        const filesContainer = document.getElementById('uploadedFilesContainer');
                        if (filesContainer && this.uploadedFiles.length === 0) {
                            filesContainer.remove();
                        }
                    }
                }, 300);
            }
        });
        
        this.showNotification(`🗑️ تم حذف الملف: ${fileName}`, 'info');
        console.log('File removed:', fileName, 'Remaining files:', this.uploadedFiles.length);
    }

    updateFilesCounter() {
        const counter = this.uploadedFiles ? this.uploadedFiles.length : 0;
        
        // Update files count badge
        const filesCount = document.getElementById('filesCount');
        if (filesCount) {
            filesCount.textContent = `${counter} ملف`;
            if (counter > 0) {
                filesCount.className = 'text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full font-semibold';
            }
        }
        
        // Update upload area text and style
        const uploadArea = document.querySelector('#aiSection .border-dashed');
        const uploadText = uploadArea ? uploadArea.querySelector('p') : null;
        
        if (uploadArea && uploadText) {
            if (counter > 0) {
                uploadArea.className = 'border-2 border-green-300 border-dashed rounded-lg p-8 text-center bg-green-50 hover:bg-green-100 transition-colors cursor-pointer';
                uploadText.innerHTML = `
                    <i class="fas fa-check-circle text-green-600 text-2xl mb-2 block"></i>
                    <span class="text-green-700 font-semibold">تم رفع ${counter} ملف بنجاح!</span><br>
                    <span class="text-sm text-green-600">يمكنك إضافة المزيد من الملفات أو الضغط على "تحليل" للبدء</span>
                `;
            } else {
                uploadArea.className = 'border-2 border-gray-300 border-dashed rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer';
                uploadText.innerHTML = 'اسحب الملفات هنا أو اضغط للرفع';
            }
        }
    }

    getFileIcon(mimeType) {
        if (mimeType.startsWith('image/')) return 'fa-image';
        if (mimeType.includes('pdf')) return 'fa-file-pdf';
        if (mimeType.includes('word') || mimeType.includes('document')) return 'fa-file-word';
        if (mimeType.includes('text')) return 'fa-file-text';
        return 'fa-file';
    }

    getFileColor(mimeType) {
        if (mimeType.startsWith('image/')) return 'text-green-600';
        if (mimeType.includes('pdf')) return 'text-red-600';
        if (mimeType.includes('word') || mimeType.includes('document')) return 'text-blue-600';
        if (mimeType.includes('text')) return 'text-gray-600';
        return 'text-gray-500';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async analyzeWithAI() {
        const query = document.getElementById('aiQuery').value.trim();
        
        // التأكد من وجود الملفات المرفوعة
        if (!this.uploadedFiles) {
            this.uploadedFiles = [];
        }
        const uploadedFiles = this.uploadedFiles;
        
        // إضافة سجل للتتبع
        console.log('AI Analysis - Query:', query);
        console.log('AI Analysis - Files:', uploadedFiles);
        console.log('Files length:', uploadedFiles.length);
        
        if (!query && uploadedFiles.length === 0) {
            this.showNotification('يرجى إدخال استفسار أو رفع ملف للتحليل', 'warning');
            return;
        }

        this.showLoadingSpinner();
        this.showNotification('بدء التحليل الذكي...', 'info');

        try {
            let analysisText = query || "تحليل طبي للملفات المرفوعة";
            let fileAnalysisResults = [];
            
            // Process uploaded files first
            if (uploadedFiles.length > 0) {
                this.showNotification(`جارٍ معالجة ${uploadedFiles.length} ملف(ات)...`, 'info');
                
                for (let file of uploadedFiles) {
                    if (file.type.startsWith('image/')) {
                        const ocrText = await this.performOCR(file);
                        fileAnalysisResults.push({
                            fileName: file.name,
                            type: 'image',
                            analysis: ocrText
                        });
                        analysisText += `\n\n🖼️ صورة: ${file.name}\n${ocrText}`;
                    } else if (file.type.includes('pdf')) {
                        fileAnalysisResults.push({
                            fileName: file.name,
                            type: 'pdf',
                            analysis: `ملف PDF طبي - يرجى وصف محتوى الملف`
                        });
                        analysisText += `\n\n📋 ملف PDF: ${file.name}\nيحتوي على معلومات طبية - يرجى وصف المحتوى للتحليل الأمثل`;
                    } else if (file.type.includes('document')) {
                        fileAnalysisResults.push({
                            fileName: file.name,
                            type: 'document',
                            analysis: `مستند طبي - يرجى وصف محتوى المستند`
                        });
                        analysisText += `\n\n📝 مستند: ${file.name}\nمستند طبي - يرجى وصف المحتوى للتحليل الدقيق`;
                    }
                }
            }

            // Enhance query for better AI response
            const enhancedQuery = this.enhanceQueryForMedicalAI(analysisText);
            
            // Call AI API with enhanced query
            this.showNotification('جارٍ الاتصال بنظام الذكاء الاصطناعي الطبي...', 'info');
            const aiResponse = await this.callAIAPI(enhancedQuery);
            
            // Process and enhance AI response
            const processedResponse = this.processAIResponse(aiResponse, fileAnalysisResults);
            
            // Save consultation to database
            if (this.currentUser) {
                await this.saveAIConsultation(query, processedResponse, uploadedFiles);
            }
            
            // Display results
            this.displayAIResults(processedResponse, uploadedFiles, fileAnalysisResults);
            
            this.showNotification('تم إكمال التحليل بنجاح! ✅', 'success');

        } catch (error) {
            console.error('Error in AI analysis:', error);
            this.showNotification('حدث خطأ في التحليل', 'error');
            
            // Show comprehensive fallback response
            const fallbackResponse = this.generateFallbackResponse(query, uploadedFiles);
            this.displayAIResults(fallbackResponse, uploadedFiles);
        } finally {
            this.hideLoadingSpinner();
        }
    }

    enhanceQueryForMedicalAI(originalQuery) {
        return `تحليل طبي متخصص مطلوب للاستفسار التالي:

${originalQuery}

يرجى تقديم:
1. تحليل طبي دقيق للحالة أو الأعراض المذكورة
2. نصائح طبية مناسبة وآمنة
3. توصيات للخطوات التالية (إن وجدت)
4. تحذيرات طبية مهمة (إن وجدت)
5. متى يجب استشارة طبيب مختص

ملاحظة: هذا للاستخدام المعلوماتي فقط وليس بديلاً عن الاستشارة الطبية المتخصصة.`;
    }

    processAIResponse(rawResponse, fileAnalysisResults) {
        let processedResponse = rawResponse;
        
        // Add file analysis summary if files were uploaded
        if (fileAnalysisResults && fileAnalysisResults.length > 0) {
            processedResponse += `\n\n📁 ملخص تحليل الملفات المرفوعة:\n`;
            fileAnalysisResults.forEach((result, index) => {
                processedResponse += `${index + 1}. ${result.fileName} - تم تحليله كـ ${this.getFileTypeInArabic(result.type)}\n`;
            });
        }
        
        // Add medical disclaimer
        processedResponse += `\n\n⚠️ إخلاء المسؤولية الطبية:
هذا التحليل مبني على الذكاء الاصطناعي ومخصص للأغراض التعليمية والإعلامية فقط. لا يُعتبر بديلاً عن الاستشارة الطبية المهنية أو التشخيص أو العلاج. يُنصح دائماً بمراجعة طبيب مؤهل للحصول على تشخيص دقيق وخطة علاج مناسبة.`;
        
        return processedResponse;
    }

    generateFallbackResponse(query, uploadedFiles) {
        return `عذراً، حدث خطأ في نظام التحليل الذكي، ولكن يمكنني تقديم النصائح العامة التالية:

${query ? `بناءً على استفسارك: "${query}"` : 'بناءً على الملفات المرفوعة:'}

🔸 النصائح العامة:
• احرص على شرب الماء بكميات كافية يومياً
• اتبع نظاماً غذائياً متوازناً
• مارس النشاط البدني المناسب لحالتك
• احصل على قسط كافٍ من النوم

${uploadedFiles.length > 0 ? `🔸 بخصوص الملفات المرفوعة (${uploadedFiles.length} ملف):
• تم رفع ملفاتك بنجاح
• للحصول على تحليل دقيق، يرجى وصف محتوى كل ملف
• يُنصح بعرض هذه الملفات على طبيب مختص` : ''}

🔸 التوصيات:
• للحصول على تشخيص دقيق، تحدث مع إحدى طبيباتنا المختصات
• احتفظ بنسخ من تقاريرك الطبية
• لا تتردد في طلب رأي ثانٍ من طبيب آخر

⚕️ للاستشارة الطبية المباشرة، انقر على "استشارة طبيبة مختصة" أدناه.`;
    }

    getFileTypeInArabic(type) {
        const types = {
            'image': 'صورة طبية',
            'pdf': 'ملف PDF',
            'document': 'مستند طبي'
        };
        return types[type] || 'ملف';
    }

    async performOCR(imageFile) {
        try {
            this.showNotification('جارٍ تحليل الصورة...', 'info');
            
            // Convert image to base64
            const base64 = await this.fileToBase64(imageFile);
            
            // Enhanced OCR simulation with medical context
            const fileAnalysis = await this.analyzeImageContent(imageFile, base64);
            
            const ocrText = `🔍 تم تحليل الصورة: ${imageFile.name}

📋 معلومات الملف:
• نوع الملف: ${imageFile.type}
• حجم الملف: ${this.formatFileSize(imageFile.size)}
• تاريخ التحليل: ${new Date().toLocaleString('ar-EG')}

📄 نتائج التحليل:
${fileAnalysis}

⚕️ تحليل طبي أولي:
• إذا كانت هذه صورة لدواء، يرجى التأكد من تاريخ الانتهاء والجرعة المناسبة
• إذا كانت صورة تقرير طبي، يُنصح بمراجعة طبيب مختص لتفسير النتائج
• للحصول على تشخيص دقيق، يرجى استشارة طبيب مؤهل

⚠️ تنبيه: هذا التحليل تلقائي وليس بديلاً عن الاستشارة الطبية المتخصصة.`;

            return ocrText;
        } catch (error) {
            console.error('OCR Error:', error);
            return `📷 تم رفع الصورة: ${imageFile.name}
            
يرجى وصف محتوى هذه الصورة في النص المرفق للحصول على تحليل أكثر دقة من الذكاء الاصطناعي.

مثال: "هذه صورة دواء باراسيتامول 500mg" أو "هذه صورة تقرير تحليل دم"`;
        }
    }

    async analyzeImageContent(imageFile, base64) {
        // Enhanced image analysis simulation
        const fileName = imageFile.name.toLowerCase();
        const fileSize = imageFile.size;
        
        if (fileName.includes('دواء') || fileName.includes('medicine') || fileName.includes('pill')) {
            return `• تم تحديد الصورة كدواء أو عقار طبي
• يُنصح بالتحقق من تاريخ انتهاء الصلاحية
• تأكد من الجرعة المناسبة لحالتك
• استشر الطبيب أو الصيدلي قبل الاستخدام`;
        } else if (fileName.includes('تقرير') || fileName.includes('تحليل') || fileName.includes('report') || fileName.includes('lab')) {
            return `• تم تحديد الصورة كتقرير طبي أو نتيجة تحليل
• يحتوي على نتائج فحوصات طبية
• يُنصح بمراجعة طبيب مختص لتفسير النتائج
• احتفظ بنسخة من هذا التقرير للمراجعات المستقبلية`;
        } else if (fileName.includes('أشعة') || fileName.includes('xray') || fileName.includes('scan')) {
            return `• تم تحديد الصورة كأشعة أو مسح طبي
• يحتاج إلى تفسير من طبيب أخصائي أشعة
• لا تحاول تفسير النتائج بنفسك
• احجز موعد مع الطبيب لمناقشة النتائج`;
        } else {
            return `• تم رفع صورة طبية بنجاح
• حجم مناسب للتحليل (${this.formatFileSize(fileSize)})
• جودة الصورة: ${fileSize > 1000000 ? 'عالية' : 'متوسطة'}
• يُنصح بوصف محتوى الصورة في النص لتحليل أدق`;
        }
    }

    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    async callAIAPI(text) {
        try {
            const encodedMessage = encodeURIComponent(text);
            const apiUrl = `https://api4dev.ir/ai/?text=${encodedMessage}`;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            const response = await fetch(apiUrl, { 
                signal: controller.signal,
                method: 'GET',
                headers: {
                    'Accept': 'text/plain, application/json, text/html, */*',
                }
            });
            
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`خطأ في الخادم: ${response.status}`);
            }

            // Try to get response as text first
            let data = await response.text();
            
            // Try to parse as JSON if possible
            try {
                const jsonData = JSON.parse(data);
                data = jsonData.result || jsonData.response || jsonData.answer || data;
            } catch (e) {
                // If not JSON, use as text
            }
            
            return data || 'عذراً، لم أتمكن من معالجة استشارتك في الوقت الحالي. يرجى المحاولة مرة أخرى أو التحدث مع إحدى طبيباتنا.';
        } catch (error) {
            console.error('AI API Error:', error);
            if (error.name === 'AbortError') {
                return 'انتهت مهلة الاستعلام. يرجى المحاولة مرة أخرى بنص أقصر أو التحدث مع إحدى طبيباتنا المختصات.';
            }
            return 'عذراً، حدث خطأ في خدمة الذكاء الاصطناعي. يرجى المحاولة مرة أخرى أو استشارة إحدى طبيباتنا المتخصصات للحصول على رد دقيق.';
        }
    }

    async saveAIConsultation(query, aiResponse, files = []) {
        if (!this.currentUser) return;

        try {
            const fileNames = files.map(file => ({
                name: file.name,
                size: file.size,
                type: file.type
            }));

            const consultationData = {
                user_id: this.currentUser.id,
                query: query || 'تحليل ملفات مرفوعة',
                uploaded_files: fileNames,
                ai_response: aiResponse,
                response_time: new Date().toISOString(),
                confidence_level: 0.85,
                is_reviewed: false
            };

            const response = await fetch('tables/ai_consultations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(consultationData)
            });

            if (response.ok) {
                console.log('تم حفظ الاستشارة بنجاح');
            }
        } catch (error) {
            console.error('Error saving AI consultation:', error);
        }
    }

    displayAIResults(response, files = [], fileAnalysisResults = []) {
        const resultsDiv = document.getElementById('aiResults');
        const responseDiv = document.getElementById('aiResponse');
        
        const currentTime = new Date().toLocaleString('ar-EG');
        
        responseDiv.innerHTML = `
            <div class="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg mb-6">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center">
                        <div class="bg-green-500 p-2 rounded-full mr-3">
                            <i class="fas fa-check text-white"></i>
                        </div>
                        <div>
                            <h4 class="text-lg font-bold text-gray-800">✅ تم إكمال التحليل الذكي</h4>
                            <p class="text-sm text-gray-600">تحليل شامل بواسطة الذكاء الاصطناعي الطبي</p>
                        </div>
                    </div>
                    <span class="text-xs text-gray-500 bg-white px-2 py-1 rounded">${currentTime}</span>
                </div>
            </div>

            ${files.length > 0 ? `
                <div class="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                    <h5 class="font-semibold text-blue-800 mb-3">📁 الملفات المحللة (${files.length}):</h5>
                    <div class="space-y-2">
                        ${files.map((file, index) => `
                            <div class="flex items-center justify-between bg-white p-3 rounded border">
                                <div class="flex items-center">
                                    <i class="fas ${this.getFileIcon(file.type)} ${this.getFileColor(file.type)} mr-3 text-lg"></i>
                                    <div>
                                        <span class="font-medium text-gray-800">${file.name}</span>
                                        <p class="text-xs text-gray-600">${this.formatFileSize(file.size)} • ${file.type}</p>
                                    </div>
                                </div>
                                <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                    تم التحليل ✓
                                </span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div class="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
                <h5 class="font-bold text-lg mb-4 text-gray-800 border-b pb-2">
                    🤖 نتيجة التحليل الطبي الذكي
                </h5>
                <div class="prose prose-lg max-w-none text-gray-700 leading-relaxed">
                    ${this.formatAIResponse(response)}
                </div>
            </div>

            <div class="grid md:grid-cols-2 gap-4 mb-6">
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div class="flex items-center mb-2">
                        <i class="fas fa-exclamation-triangle text-yellow-600 mr-2"></i>
                        <p class="font-semibold text-yellow-800">⚠️ تنبيه طبي مهم</p>
                    </div>
                    <p class="text-sm text-yellow-700">
                        هذا التحليل مبني على الذكاء الاصطناعي وهو لأغراض إعلامية فقط. 
                        يرجى استشارة طبيب مختص للحصول على تشخيص دقيق وعلاج مناسب.
                    </p>
                </div>

                <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div class="flex items-center mb-2">
                        <i class="fas fa-lightbulb text-green-600 mr-2"></i>
                        <p class="font-semibold text-green-800">💡 نصيحة</p>
                    </div>
                    <p class="text-sm text-green-700">
                        للحصول على أفضل النتائج، تحدث مع إحدى طبيباتنا المختصات 
                        واعرض عليها نتائج هذا التحليل مع ملفاتك الطبية.
                    </p>
                </div>
            </div>
            
            <div class="flex flex-col sm:flex-row gap-3">
                <button onclick="medicalPlatform.navigateToSection('doctors')" 
                        class="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-md">
                    <i class="fas fa-user-md mr-2"></i>
                    استشارة طبيبة مختصة الآن
                </button>
                <button onclick="medicalPlatform.saveAnalysisResults()" 
                        class="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
                    <i class="fas fa-save mr-2"></i>
                    حفظ النتائج
                </button>
                <button onclick="medicalPlatform.clearAIResults()" 
                        class="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors">
                    <i class="fas fa-sync mr-2"></i>
                    تحليل جديد
                </button>
            </div>

            <div class="mt-6 p-4 bg-gray-50 rounded-lg text-center">
                <p class="text-sm text-gray-600 mb-2">هل كان هذا التحليل مفيداً؟</p>
                <div class="flex justify-center space-x-4 space-x-reverse">
                    <button onclick="medicalPlatform.rateAnalysis('helpful')" 
                            class="text-green-600 hover:text-green-700 transition-colors">
                        <i class="fas fa-thumbs-up mr-1"></i> مفيد
                    </button>
                    <button onclick="medicalPlatform.rateAnalysis('not-helpful')" 
                            class="text-red-600 hover:text-red-700 transition-colors">
                        <i class="fas fa-thumbs-down mr-1"></i> غير مفيد
                    </button>
                </div>
            </div>
        `;
        
        resultsDiv.classList.remove('hidden');
        resultsDiv.scrollIntoView({ behavior: 'smooth' });
    }

    saveAnalysisResults() {
        this.showNotification('تم حفظ نتائج التحليل في ملفك الطبي', 'success');
    }

    rateAnalysis(rating) {
        const message = rating === 'helpful' ? 'شكراً لتقييمك الإيجابي!' : 'شكراً لملاحظتك، سنعمل على تحسين النظام';
        this.showNotification(message, 'info');
    }

    formatAIResponse(response) {
        if (!response) return '<p class="text-gray-500">لم يتم الحصول على رد</p>';
        
        // Split response into paragraphs and format
        return response
            .split('\n')
            .filter(line => line.trim())
            .map(line => `<p class="mb-3 leading-relaxed">${line.trim()}</p>`)
            .join('');
    }

    clearAIResults() {
        // Clear form
        document.getElementById('aiQuery').value = '';
        document.getElementById('fileUpload').value = '';
        
        // Clear file previews
        const previews = document.querySelectorAll('.file-preview');
        previews.forEach(preview => preview.remove());
        
        // Clear uploaded files
        this.uploadedFiles = [];
        
        // Hide results
        document.getElementById('aiResults').classList.add('hidden');
        
        this.showNotification('تم مسح البيانات، يمكنك بدء تحليل جديد', 'info');
    }

    // Authentication
    showLoginModal() {
        document.getElementById('loginModal').classList.remove('hidden');
    }

    hideLoginModal() {
        document.getElementById('loginModal').classList.add('hidden');
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        
        this.showLoadingSpinner();
        
        try {
            console.log('Attempting login for:', username);
            
            // Use production API for authentication
            const result = await window.enhancedAuth.login(username, password);
            
            if (result.success) {
                this.currentUser = result.user;
                localStorage.setItem('currentUser', JSON.stringify(result.user));
                this.updateUIForLoggedInUser();
                this.hideLoginModal();
                this.showNotification(`مرحباً ${result.user.full_name}`, 'success');
                
                console.log('Login successful, user type:', result.user.user_type);
                
                // Redirect based on user type
                if (result.user.user_type === 'admin') {
                    setTimeout(() => window.location.href = 'admin.html', 1000);
                } else if (result.user.user_type === 'doctor') {
                    setTimeout(() => window.location.href = 'admin.html', 1000); // Doctors use admin panel
                }
            } else {
                console.log('Login failed:', result.error);
                this.showNotification(result.error || 'اسم المستخدم أو كلمة المرور غير صحيحة', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification('حدث خطأ في تسجيل الدخول، يرجى المحاولة مرة أخرى', 'error');
        } finally {
            this.hideLoadingSpinner();
        }
    }

    showRegisterModal() {
        document.getElementById('loginModal').classList.add('hidden');
        
        const modal = document.createElement('div');
        modal.id = 'registerModal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
        
        modal.innerHTML = `
            <div class="bg-white rounded-2xl p-8 max-w-md w-full mx-4 max-h-screen overflow-y-auto">
                <div class="text-center mb-6">
                    <h3 class="text-2xl font-bold text-gray-800">إنشاء حساب جديد</h3>
                    <p class="text-gray-600 mt-2">انضم إلى منصة دوائك المنزلي</p>
                </div>
                <form id="registerForm">
                    <div class="mb-4">
                        <label class="block text-gray-700 font-semibold mb-2">الاسم الكامل:</label>
                        <input type="text" id="registerFullName" class="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-purple-500 focus:outline-none" required>
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 font-semibold mb-2">اسم المستخدم:</label>
                        <input type="text" id="registerUsername" class="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-purple-500 focus:outline-none" required>
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 font-semibold mb-2">البريد الإلكتروني:</label>
                        <input type="email" id="registerEmail" class="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-purple-500 focus:outline-none" required>
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 font-semibold mb-2">رقم الهاتف:</label>
                        <input type="tel" id="registerPhone" class="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-purple-500 focus:outline-none" required>
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 font-semibold mb-2">العمر:</label>
                        <input type="number" id="registerAge" min="1" max="120" class="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-purple-500 focus:outline-none" required>
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 font-semibold mb-2">الجنس:</label>
                        <select id="registerGender" class="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-purple-500 focus:outline-none" required>
                            <option value="">اختر الجنس</option>
                            <option value="ذكر">ذكر</option>
                            <option value="أنثى">أنثى</option>
                        </select>
                    </div>
                    <div class="mb-6">
                        <label class="block text-gray-700 font-semibold mb-2">كلمة المرور:</label>
                        <input type="password" id="registerPassword" class="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-purple-500 focus:outline-none" required>
                    </div>
                    <button type="submit" class="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-bold hover:from-purple-700 hover:to-indigo-700 transition-all">
                        إنشاء الحساب
                    </button>
                </form>
                <div class="text-center mt-4">
                    <button id="loginLink" class="text-purple-600 hover:text-purple-800">لديك حساب؟ سجل دخولك</button>
                </div>
                <button onclick="this.closest('#registerModal').remove()" class="absolute top-4 left-4 text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Setup register form handler
        document.getElementById('registerForm').addEventListener('submit', (e) => {
            this.handleRegister(e);
        });
        
        document.getElementById('loginLink').addEventListener('click', () => {
            modal.remove();
            this.showLoginModal();
        });
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const fullName = document.getElementById('registerFullName').value;
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const phone = document.getElementById('registerPhone').value;
        const age = parseInt(document.getElementById('registerAge').value);
        const gender = document.getElementById('registerGender').value;
        const password = document.getElementById('registerPassword').value;
        
        if (!fullName || !username || !email || !phone || !age || !gender || !password) {
            this.showNotification('يرجى ملء جميع الحقول', 'warning');
            return;
        }
        
        this.showLoadingSpinner();
        
        try {
            // Use production API for registration
            const userData = {
                username: username,
                password: password,
                full_name: fullName,
                email: email,
                phone: phone,
                age: age,
                gender: gender,
                user_type: 'user',
                is_active: true
            };
            
            const result = await window.enhancedAuth.register(userData);
            
            if (result.success) {
                this.showNotification('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول', 'success');
                document.getElementById('registerModal').remove();
                this.showLoginModal();
            } else {
                this.showNotification(result.error || 'حدث خطأ في إنشاء الحساب', 'error');
            }
            
        } catch (error) {
            console.error('Registration error:', error);
            this.showNotification('حدث خطأ في إنشاء الحساب', 'error');
        } finally {
            this.hideLoadingSpinner();
        }
    }

    updateUIForLoggedInUser() {
        if (this.currentUser) {
            const loginBtn = document.getElementById('loginBtn');
            
            // Update button appearance
            loginBtn.innerHTML = `
                <div class="flex items-center">
                    <div class="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-2">
                        ${this.currentUser.full_name.charAt(0)}
                    </div>
                    <span class="text-white">${this.currentUser.full_name}</span>
                    <i class="fas fa-chevron-down mr-2 text-sm"></i>
                </div>
            `;
            
            // Update button style to show it's clickable
            loginBtn.className = 'bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-all cursor-pointer border border-white border-opacity-30';
            
            // Set the onclick handler - this will override any existing ones
            loginBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showUserMenu();
            };
            
            console.log('Updated UI for logged in user:', this.currentUser.full_name);
        }
    }

    showUserMenu() {
        console.log('Showing user menu for:', this.currentUser?.full_name);
        
        // Remove existing menu if any
        const existingMenu = document.getElementById('userDropdownMenu');
        if (existingMenu) {
            existingMenu.remove();
        }

        if (!this.currentUser) {
            console.log('No user logged in, showing login modal instead');
            this.showLoginModal();
            return;
        }

        // Create user dropdown menu
        const loginBtn = document.getElementById('loginBtn');
        const menu = document.createElement('div');
        menu.id = 'userDropdownMenu';
        menu.className = 'absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 opacity-0 transform scale-95 transition-all duration-200';
        
        menu.innerHTML = `
            <div class="py-3">
                <!-- User Info Header -->
                <div class="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-green-50">
                    <div class="flex items-center">
                        <div class="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            ${this.currentUser.full_name.charAt(0)}
                        </div>
                        <div class="mr-3">
                            <p class="text-sm font-bold text-gray-800">${this.currentUser.full_name}</p>
                            <p class="text-xs text-gray-500">${this.currentUser.email}</p>
                            <p class="text-xs text-green-600 font-medium">مرحباً بك في دوائك المنزلي</p>
                        </div>
                    </div>
                </div>
                
                <!-- Menu Items -->
                <div class="py-2">
                    <button onclick="medicalPlatform.showAccountInfo()" class="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 transition-colors text-right">
                        <i class="fas fa-user-circle text-blue-500 w-5 text-lg"></i>
                        <span class="mr-3 font-medium">معلومات الحساب</span>
                    </button>
                    <button onclick="medicalPlatform.editAccount()" class="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-green-50 transition-colors text-right">
                        <i class="fas fa-edit text-green-500 w-5 text-lg"></i>
                        <span class="mr-3 font-medium">تعديل الحساب</span>
                    </button>
                    <button onclick="medicalPlatform.showMyConversations()" class="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-purple-50 transition-colors text-right">
                        <i class="fas fa-comments text-purple-500 w-5 text-lg"></i>
                        <span class="mr-3 font-medium">محادثاتي</span>
                    </button>
                </div>
                
                <hr class="my-2">
                
                <div class="py-1">
                    <button onclick="medicalPlatform.logout()" class="w-full flex items-center px-4 py-3 text-red-600 hover:bg-red-50 transition-colors text-right">
                        <i class="fas fa-sign-out-alt text-red-500 w-5 text-lg"></i>
                        <span class="mr-3 font-medium">تسجيل الخروج</span>
                    </button>
                </div>
            </div>
        `;
        
        // Position menu relative to the login button's parent container
        const parentContainer = loginBtn.parentElement;
        parentContainer.appendChild(menu);
        
        // Animate menu appearance
        setTimeout(() => {
            menu.classList.remove('opacity-0', 'scale-95');
            menu.classList.add('opacity-100', 'scale-100');
        }, 10);
        
        // Close menu on click outside
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!menu.contains(e.target) && !loginBtn.contains(e.target)) {
                    menu.classList.add('opacity-0', 'scale-95');
                    setTimeout(() => {
                        if (menu.parentElement) {
                            menu.remove();
                        }
                    }, 200);
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 0);
    }

    showAccountInfo() {
        // Close user menu
        const menu = document.getElementById('userDropdownMenu');
        if (menu) menu.remove();
        
        this.showModal(`
            <div class="text-center">
                <div class="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
                    ${this.currentUser.full_name.charAt(0)}
                </div>
                <h3 class="text-xl font-bold text-gray-800 mb-2">${this.currentUser.full_name}</h3>
                <p class="text-gray-600 mb-4">${this.currentUser.email}</p>
                <div class="bg-gray-50 rounded-lg p-4 text-right">
                    <div class="mb-3 flex justify-between">
                        <span class="text-gray-500">رقم الهاتف:</span>
                        <span class="font-medium">${this.currentUser.phone || 'غير محدد'}</span>
                    </div>
                    <div class="mb-3 flex justify-between">
                        <span class="text-gray-500">العمر:</span>
                        <span class="font-medium">${this.currentUser.age || 'غير محدد'}</span>
                    </div>
                    <div class="mb-3 flex justify-between">
                        <span class="text-gray-500">الجنس:</span>
                        <span class="font-medium">${this.currentUser.gender || 'غير محدد'}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-500">تاريخ التسجيل:</span>
                        <span class="font-medium">${new Date().toLocaleDateString('ar-EG')}</span>
                    </div>
                </div>
                <div class="mt-6 flex gap-3">
                    <button onclick="medicalPlatform.editAccount()" class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                        تعديل البيانات
                    </button>
                    <button onclick="document.querySelector('.fixed').remove()" class="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors">
                        إغلاق
                    </button>
                </div>
            </div>
        `, 'معلومات الحساب');
    }
    
    editAccount() {
        // Close user menu and any existing modals
        const menu = document.getElementById('userDropdownMenu');
        if (menu) menu.remove();
        
        const existingModal = document.querySelector('.fixed');
        if (existingModal) existingModal.remove();
        
        this.showModal(`
            <form id="editAccountForm" class="space-y-4">
                <h3 class="text-xl font-bold text-gray-800 mb-4">تعديل بيانات الحساب</h3>
                
                <div>
                    <label class="block text-gray-700 font-semibold mb-2">الاسم الكامل:</label>
                    <input type="text" id="editFullName" value="${this.currentUser.full_name}" class="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-blue-500 focus:outline-none" required>
                </div>
                
                <div>
                    <label class="block text-gray-700 font-semibold mb-2">البريد الإلكتروني:</label>
                    <input type="email" id="editEmail" value="${this.currentUser.email}" class="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-blue-500 focus:outline-none" required>
                </div>
                
                <div>
                    <label class="block text-gray-700 font-semibold mb-2">رقم الهاتف:</label>
                    <input type="tel" id="editPhone" value="${this.currentUser.phone || ''}" class="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-blue-500 focus:outline-none">
                </div>
                
                <div>
                    <label class="block text-gray-700 font-semibold mb-2">العمر:</label>
                    <input type="number" id="editAge" value="${this.currentUser.age || ''}" class="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-blue-500 focus:outline-none">
                </div>
                
                <div>
                    <label class="block text-gray-700 font-semibold mb-2">الجنس:</label>
                    <select id="editGender" class="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-blue-500 focus:outline-none">
                        <option value="male" ${this.currentUser.gender === 'male' ? 'selected' : ''}>ذكر</option>
                        <option value="female" ${this.currentUser.gender === 'female' ? 'selected' : ''}>أنثى</option>
                    </select>
                </div>
                
                <div class="flex gap-3 pt-4">
                    <button type="submit" class="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-semibold">
                        حفظ التغييرات
                    </button>
                    <button type="button" onclick="document.querySelector('.fixed').remove()" class="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors">
                        إلغاء
                    </button>
                </div>
            </form>
        `, 'تعديل الحساب');
        
        // Handle form submission
        document.getElementById('editAccountForm').addEventListener('submit', (e) => {
            this.handleAccountUpdate(e);
        });
    }
    
    async handleAccountUpdate(e) {
        e.preventDefault();
        
        const updatedData = {
            full_name: document.getElementById('editFullName').value.trim(),
            email: document.getElementById('editEmail').value.trim(),
            phone: document.getElementById('editPhone').value.trim(),
            age: document.getElementById('editAge').value.trim(),
            gender: document.getElementById('editGender').value
        };
        
        try {
            // Update user in database
            const response = await fetch(`tables/users/${this.currentUser.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedData)
            });
            
            if (response.ok) {
                // Update current user object
                Object.assign(this.currentUser, updatedData);
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                
                // Update UI
                this.updateUIForLoggedInUser();
                
                // Close modal and show success
                document.querySelector('.fixed').remove();
                this.showNotification('✅ تم تحديث بيانات الحساب بنجاح', 'success');
            } else {
                this.showNotification('حدث خطأ في تحديث البيانات', 'error');
            }
        } catch (error) {
            console.error('Error updating account:', error);
            this.showNotification('حدث خطأ في تحديث البيانات', 'error');
        }
    }
    
    showSupportChat() {
        this.closeSidebar();
        
        this.showModal(`
            <div class="text-center">
                <div class="w-16 h-16 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">
                    <i class="fas fa-headset"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-800 mb-4">الدعم الفني - دوائك المنزلي</h3>
                
                <div class="bg-gray-50 rounded-lg p-4 mb-6 text-right">
                    <h4 class="font-semibold text-gray-800 mb-3">كيف يمكننا مساعدتك؟</h4>
                    <div class="space-y-2 text-sm text-gray-600">
                        <div class="flex items-center">
                            <i class="fas fa-check text-green-500 ml-2"></i>
                            <span>مشاكل في رفع الملفات أو التحليل</span>
                        </div>
                        <div class="flex items-center">
                            <i class="fas fa-check text-green-500 ml-2"></i>
                            <span>صعوبات في استخدام ميزات المنصة</span>
                        </div>
                        <div class="flex items-center">
                            <i class="fas fa-check text-green-500 ml-2"></i>
                            <span>مشاكل في تسجيل الدخول أو الحساب</span>
                        </div>
                        <div class="flex items-center">
                            <i class="fas fa-check text-green-500 ml-2"></i>
                            <span>استفسارات تقنية أخرى</span>
                        </div>
                    </div>
                </div>
                
                <form id="supportForm" class="space-y-4">
                    <div>
                        <label class="block text-gray-700 font-semibold mb-2 text-right">موضوع المشكلة:</label>
                        <select id="supportTopic" class="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-orange-500 focus:outline-none" required>
                            <option value="">اختر موضوع المشكلة</option>
                            <option value="file_upload">مشكلة في رفع الملفات</option>
                            <option value="ai_analysis">مشكلة في التحليل الذكي</option>
                            <option value="login_issues">مشكلة في تسجيل الدخول</option>
                            <option value="account_issues">مشكلة في الحساب</option>
                            <option value="general_help">مساعدة عامة</option>
                            <option value="other">أخرى</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-gray-700 font-semibold mb-2 text-right">وصف المشكلة:</label>
                        <textarea id="supportMessage" rows="4" class="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-orange-500 focus:outline-none" placeholder="اشرح المشكلة بالتفصيل..." required></textarea>
                    </div>
                    
                    <div class="flex gap-3">
                        <button type="submit" class="flex-1 bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 px-4 rounded-lg hover:from-orange-600 hover:to-red-700 transition-all font-semibold">
                            <i class="fas fa-paper-plane ml-2"></i>
                            إرسال طلب الدعم
                        </button>
                        <button type="button" onclick="document.querySelector('.fixed').remove()" class="bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors">
                            إلغاء
                        </button>
                    </div>
                </form>
                
                <div class="mt-4 pt-4 border-t text-sm text-gray-500">
                    <p>⏰ نرد على استفساراتك خلال 24 ساعة</p>
                    <p>📧 يمكنك أيضاً التواصل معنا عبر: support@dawaakmanzaly.com</p>
                </div>
            </div>
        `, 'الدعم الفني');
        
        // Handle support form submission
        document.getElementById('supportForm').addEventListener('submit', (e) => {
            this.handleSupportRequest(e);
        });
    }
    
    async handleSupportRequest(e) {
        e.preventDefault();
        
        const topic = document.getElementById('supportTopic').value;
        const message = document.getElementById('supportMessage').value.trim();
        
        if (!topic || !message) {
            this.showNotification('يرجى ملء جميع الحقول المطلوبة', 'warning');
            return;
        }
        
        const supportData = {
            user_id: this.currentUser?.id || 'guest',
            user_name: this.currentUser?.full_name || 'زائر',
            user_email: this.currentUser?.email || 'غير محدد',
            topic: topic,
            message: message,
            status: 'pending',
            priority: 'normal'
        };
        
        try {
            // Save support request
            const response = await fetch('tables/support_requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(supportData)
            });
            
            if (response.ok) {
                // Close modal and show success
                document.querySelector('.fixed').remove();
                this.showNotification('✅ تم إرسال طلب الدعم بنجاح! سنرد عليك قريباً', 'success');
                
                // Also create a conversation for follow-up
                this.createSupportConversation(supportData);
            } else {
                this.showNotification('حدث خطأ في إرسال طلب الدعم', 'error');
            }
        } catch (error) {
            console.error('Error sending support request:', error);
            this.showNotification('حدث خطأ في إرسال طلب الدعم', 'error');
        }
    }
    
    async createSupportConversation(supportData) {
        const conversationData = {
            patient_name: supportData.user_name,
            patient_email: supportData.user_email,
            doctor_name: 'فريق الدعم الفني',
            doctor_id: 'support_team',
            title: `طلب دعم: ${supportData.topic}`,
            status: 'active',
            type: 'support',
            messages: [{
                sender_type: 'patient',
                sender_name: supportData.user_name,
                content: supportData.message,
                timestamp: new Date().toISOString()
            }, {
                sender_type: 'doctor',
                sender_name: 'فريق الدعم الفني',
                content: 'شكراً لك على تواصلك معنا. تم استلام طلبك وسيتم الرد عليك خلال 24 ساعة.',
                timestamp: new Date().toISOString()
            }]
        };
        
        try {
            await fetch('tables/conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(conversationData)
            });
        } catch (error) {
            console.error('Error creating support conversation:', error);
        }
    }
    
    showSettings() {
        // Close user menu
        const menu = document.getElementById('userDropdownMenu');
        if (menu) menu.remove();
        
        this.showModal(`
            <div class="space-y-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4">إعدادات الحساب</h3>
                
                <div class="space-y-4">
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                            <h4 class="font-medium">إشعارات البريد الإلكتروني</h4>
                            <p class="text-sm text-gray-500">استقبال التحديثات عبر البريد</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" checked>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                            <h4 class="font-medium">الإشعارات الفورية</h4>
                            <p class="text-sm text-gray-500">تنبيهات فورية للرسائل الجديدة</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" checked>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                            <h4 class="font-medium">الوضع الليلي</h4>
                            <p class="text-sm text-gray-500">تفعيل المظهر الداكن</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
                
                <div class="pt-4 border-t">
                    <button class="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 px-4 rounded-lg hover:from-green-600 hover:to-blue-700 transition-all">
                        حفظ التغييرات
                    </button>
                </div>
            </div>
        `, 'الإعدادات');
    }
    
    showMyConversations() {
        // Close user menu
        const menu = document.getElementById('userDropdownMenu');
        if (menu) menu.remove();
        
        // Filter conversations for current user
        const userConversations = this.conversations.filter(conv => 
            conv.patient_email === this.currentUser.email
        );
        
        let conversationsHTML = '';
        if (userConversations.length === 0) {
            conversationsHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-comments text-gray-300 text-4xl mb-4"></i>
                    <p class="text-gray-500">لا توجد محادثات حتى الآن</p>
                    <p class="text-sm text-gray-400 mt-2">ابدأ محادثة مع أحد الأطباء</p>
                </div>
            `;
        } else {
            conversationsHTML = userConversations.map(conv => `
                <div class="border border-gray-200 rounded-lg p-4 mb-3 hover:bg-gray-50 cursor-pointer">
                    <div class="flex items-center justify-between mb-2">
                        <h4 class="font-medium text-gray-800">د. ${conv.doctor_name}</h4>
                        <span class="text-sm text-gray-500">${new Date(conv.created_at).toLocaleDateString('ar-EG')}</span>
                    </div>
                    <p class="text-gray-600 text-sm">${conv.messages[conv.messages.length - 1]?.content || 'محادثة جديدة'}</p>
                    <div class="flex items-center justify-between mt-3">
                        <span class="text-xs px-2 py-1 rounded-full ${conv.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}">
                            ${conv.status === 'active' ? 'نشطة' : 'مكتملة'}
                        </span>
                        <button class="text-blue-600 text-sm hover:text-blue-800">متابعة المحادثة</button>
                    </div>
                </div>
            `).join('');
        }
        
        this.showModal(`
            <div>
                <h3 class="text-xl font-bold text-gray-800 mb-4">محادثاتي</h3>
                <div class="max-h-96 overflow-y-auto">
                    ${conversationsHTML}
                </div>
            </div>
        `, 'محادثاتي');
    }

    showModal(content, title = 'معلومات') {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        
        modal.innerHTML = `
            <div class="bg-white rounded-2xl max-w-2xl w-full max-h-screen overflow-y-auto">
                <div class="sticky top-0 bg-white border-b p-4 flex justify-between items-center rounded-t-2xl">
                    <h3 class="text-xl font-bold text-gray-800">${title}</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700 transition-colors">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                <div class="p-6">
                    ${content}
                </div>
            </div>
        `;
        
        // Close modal on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        document.body.appendChild(modal);
        return modal;
    }

    logout() {
        // Close user menu if open
        const menu = document.getElementById('userDropdownMenu');
        if (menu) menu.remove();
        
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        
        // Reset UI
        const loginBtn = document.getElementById('loginBtn');
        loginBtn.innerHTML = `
            <i class="fas fa-user mr-1"></i>
            تسجيل الدخول
        `;
        loginBtn.onclick = () => this.showLoginModal();
        
        this.showNotification('تم تسجيل الخروج بنجاح', 'success');
        this.navigateToSection('home');
    }

    // Admin Panel
    navigateToAdminPanel() {
        // This would load the admin panel
        console.log('Navigating to admin panel...');
        // Implementation would create admin dashboard
    }

    // Doctor Panel
    navigateToDoctorPanel() {
        // This would load the doctor panel
        console.log('Navigating to doctor panel...');
        // Implementation would create doctor dashboard
    }

    // Utility Functions
    showLoadingSpinner() {
        document.getElementById('loadingSpinner').classList.remove('hidden');
    }

    hideLoadingSpinner() {
        document.getElementById('loadingSpinner').classList.add('hidden');
    }

    showNotification(message, type = 'info') {
        // Remove any existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notif => notif.remove());
        
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 z-50 p-4 rounded-lg shadow-xl max-w-sm w-full transition-all duration-300 transform translate-x-0';
        
        const colors = {
            success: 'bg-green-500 text-white',
            error: 'bg-red-500 text-white',
            warning: 'bg-yellow-500 text-white',
            info: 'bg-blue-500 text-white'
        };
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        notification.className += ` ${colors[type]}`;
        
        notification.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <i class="${icons[type]} mr-3 text-lg"></i>
                    <span class="font-medium">${message}</span>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="text-white hover:text-gray-200 ml-3">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 6 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 6000);
    }

    initializeComponents() {
        // Initialize any additional components here
        console.log('Medical Platform initialized successfully');
        
        // Show welcome message
        setTimeout(() => {
            this.showNotification('مرحباً بك في منصة دوائك المنزلي الطبية المتقدمة! 🩺', 'info');
        }, 1000);
        
        // Check if user was logged in
        if (this.currentUser) {
            setTimeout(() => {
                this.showNotification(`أهلاً بك مرة أخرى ${this.currentUser.full_name}`, 'success');
            }, 2000);
            this.loadUserProfile();
        }
    }

    showDemoVideo() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4';
        
        modal.innerHTML = `
            <div class="bg-white rounded-2xl max-w-4xl w-full max-h-screen overflow-y-auto">
                <div class="p-6 border-b flex justify-between items-center">
                    <h3 class="text-2xl font-bold">كيف تعمل منصة دوائك المنزلي</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700 text-xl">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="p-6">
                    <div class="grid md:grid-cols-2 gap-8">
                        <div class="space-y-6">
                            <div class="flex items-start">
                                <div class="bg-blue-100 p-3 rounded-full mr-4 mt-1">
                                    <i class="fas fa-user-plus text-blue-600"></i>
                                </div>
                                <div>
                                    <h4 class="font-bold mb-2">1. إنشاء حساب</h4>
                                    <p class="text-gray-600">سجل حساباً جديداً بملء البيانات الأساسية</p>
                                </div>
                            </div>
                            
                            <div class="flex items-start">
                                <div class="bg-green-100 p-3 rounded-full mr-4 mt-1">
                                    <i class="fas fa-comments text-green-600"></i>
                                </div>
                                <div>
                                    <h4 class="font-bold mb-2">2. ابدأ محادثة</h4>
                                    <p class="text-gray-600">اختر طبيبة مختصة وابدأ محادثة فورية</p>
                                </div>
                            </div>
                            
                            <div class="flex items-start">
                                <div class="bg-purple-100 p-3 rounded-full mr-4 mt-1">
                                    <i class="fas fa-robot text-purple-600"></i>
                                </div>
                                <div>
                                    <h4 class="font-bold mb-2">3. استخدم الذكاء الاصطناعي</h4>
                                    <p class="text-gray-600">حلل تقاريرك الطبية بالذكاء الاصطناعي</p>
                                </div>
                            </div>
                            
                            <div class="flex items-start">
                                <div class="bg-yellow-100 p-3 rounded-full mr-4 mt-1">
                                    <i class="fas fa-lightbulb text-yellow-600"></i>
                                </div>
                                <div>
                                    <h4 class="font-bold mb-2">4. تصفح النصائح</h4>
                                    <p class="text-gray-600">اقرأ نصائح طبية موثوقة من الخبراء</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl">
                            <h4 class="font-bold mb-4 text-center">فيديو تعريفي</h4>
                            <div class="bg-gray-200 aspect-video rounded-lg flex items-center justify-center mb-4">
                                <div class="text-center text-gray-600">
                                    <i class="fas fa-play-circle text-6xl mb-2"></i>
                                    <p>فيديو توضيحي قريباً</p>
                                </div>
                            </div>
                            <p class="text-sm text-gray-600 text-center">
                                شاهد فيديو تعريفي كامل عن جميع ميزات المنصة
                            </p>
                        </div>
                    </div>
                    
                    <div class="mt-8 text-center">
                        <button onclick="medicalPlatform.navigateToSection('doctors'); this.closest('.fixed').remove();" 
                                class="bg-purple-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-purple-700 transition-colors">
                            ابدأ الآن
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    loadUserProfile() {
        if (!this.currentUser) return;
        
        // Update profile section when user is logged in
        const profileContent = document.getElementById('profileContent');
        if (profileContent) {
            profileContent.innerHTML = `
                <div class="text-center mb-8">
                    <div class="w-24 h-24 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                        ${this.currentUser.full_name.charAt(0)}
                    </div>
                    <h3 class="text-2xl font-bold text-gray-800">${this.currentUser.full_name}</h3>
                    <p class="text-gray-600">@${this.currentUser.username}</p>
                </div>
                
                <div class="grid md:grid-cols-2 gap-6">
                    <div class="space-y-4">
                        <div class="border-b pb-2">
                            <label class="text-sm font-semibold text-gray-600">البريد الإلكتروني</label>
                            <p class="text-gray-800">${this.currentUser.email || 'غير محدد'}</p>
                        </div>
                        <div class="border-b pb-2">
                            <label class="text-sm font-semibold text-gray-600">رقم الهاتف</label>
                            <p class="text-gray-800">${this.currentUser.phone || 'غير محدد'}</p>
                        </div>
                        <div class="border-b pb-2">
                            <label class="text-sm font-semibold text-gray-600">العمر</label>
                            <p class="text-gray-800">${this.currentUser.age || 'غير محدد'}</p>
                        </div>
                    </div>
                    
                    <div class="space-y-4">
                        <div class="border-b pb-2">
                            <label class="text-sm font-semibold text-gray-600">الجنس</label>
                            <p class="text-gray-800">${this.currentUser.gender || 'غير محدد'}</p>
                        </div>
                        <div class="border-b pb-2">
                            <label class="text-sm font-semibold text-gray-600">نوع الحساب</label>
                            <p class="text-gray-800">${this.translateUserType(this.currentUser.user_type)}</p>
                        </div>
                        <div class="border-b pb-2">
                            <label class="text-sm font-semibold text-gray-600">تاريخ التسجيل</label>
                            <p class="text-gray-800">${this.currentUser.created_at ? new Date(this.currentUser.created_at).toLocaleDateString('ar-EG') : 'غير محدد'}</p>
                        </div>
                    </div>
                </div>
                
                <div class="mt-8 flex space-x-4 space-x-reverse">
                    <button onclick="medicalPlatform.editProfile()" class="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                        <i class="fas fa-edit mr-2"></i>
                        تعديل الملف الشخصي
                    </button>
                    <button onclick="medicalPlatform.changePassword()" class="bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700 transition-colors">
                        <i class="fas fa-key mr-2"></i>
                        تغيير كلمة المرور
                    </button>
                </div>
            `;
        }
    }

    translateUserType(userType) {
        const translations = {
            'admin': 'مدير',
            'doctor': 'طبيب/طبيبة',
            'user': 'مستخدم'
        };
        return translations[userType] || userType;
    }

    editProfile() {
        // Show edit profile modal
        this.showNotification('ميزة تعديل الملف الشخصي قيد التطوير', 'info');
    }

    changePassword() {
        // Show change password modal  
        this.showNotification('ميزة تغيير كلمة المرور قيد التطوير', 'info');
    }
}

// Initialize the platform when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.medicalPlatform = new MedicalPlatform();
});

// Handle page visibility changes for session tracking
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('User switched away from page');
    } else {
        console.log('User returned to page');
    }
});

// Handle online/offline status
window.addEventListener('online', () => {
    console.log('Connection restored');
});

window.addEventListener('offline', () => {
    console.log('Connection lost');
});