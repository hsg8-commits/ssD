// Doctor Dashboard JavaScript for دوائك المنزلي
class DoctorDashboard {
    constructor() {
        this.currentDoctor = null;
        this.selectedConversation = null;
        this.conversations = [];
        this.patients = [];
        this.isOnline = true;
        
        this.init();
    }

    init() {
        // Get current doctor from localStorage or mock data
        this.currentDoctor = {
            id: 'dr.afrah',
            name: 'د. أفراح محمد',
            specialty: 'طب عام',
            country: 'اليمن',
            profile_image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=50&h=50&fit=crop&crop=face'
        };

        this.setupEventListeners();
        this.loadDashboardData();
        this.startAutoRefresh();
    }

    setupEventListeners() {
        // Status toggle
        document.getElementById('statusToggle').addEventListener('click', () => {
            this.toggleOnlineStatus();
        });

        // Send message
        document.getElementById('sendBtn').addEventListener('click', () => {
            this.sendMessage();
        });

        // Message input enter key
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Quick templates
        document.querySelectorAll('.quick-template').forEach(template => {
            template.addEventListener('click', (e) => {
                const templateText = e.currentTarget.dataset.template;
                this.insertTemplate(templateText);
            });
        });

        // Attachment button
        document.getElementById('attachmentBtn').addEventListener('click', () => {
            this.showAttachmentOptions();
        });
    }

    async loadDashboardData() {
        try {
            // Load all conversations (since we need to filter client-side for now)
            const conversationsResponse = await fetch('tables/conversations?limit=1000');
            const conversationsData = await conversationsResponse.json();
            
            // Filter conversations for this doctor
            this.conversations = (conversationsData.data || []).filter(conv => 
                conv.doctor_id === this.currentDoctor.id || conv.doctor_id === this.currentDoctor.user_id
            );

            // Load users data
            const usersResponse = await fetch('tables/users');
            const usersData = await usersResponse.json();
            this.patients = usersData.data || [];

            this.updateStats();
            this.displayConversations();
            
            // If no conversations, create some sample ones for testing
            if (this.conversations.length === 0) {
                await this.createSampleConversations();
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    async createSampleConversations() {
        try {
            // Create sample conversations for testing
            const sampleConversations = [
                {
                    user_id: 'user_sample_1',
                    doctor_id: this.currentDoctor.id,
                    title: 'استشارة حول الصداع المستمر',
                    status: 'نشطة',
                    last_message_time: new Date().toISOString(),
                    is_urgent: false
                },
                {
                    user_id: 'user_sample_2', 
                    doctor_id: this.currentDoctor.id,
                    title: 'أسئلة حول التغذية الصحية',
                    status: 'نشطة',
                    last_message_time: new Date(Date.now() - 3600000).toISOString(),
                    is_urgent: true
                }
            ];

            // Create sample users
            const sampleUsers = [
                {
                    id: 'user_sample_1',
                    full_name: 'أحمد محمد',
                    age: 35,
                    gender: 'ذكر',
                    phone: '966501234567',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'user_sample_2',
                    full_name: 'فاطمة علي',
                    age: 28,
                    gender: 'أنثى',  
                    phone: '966507654321',
                    created_at: new Date().toISOString()
                }
            ];

            // Add to database
            for (const conversation of sampleConversations) {
                await fetch('tables/conversations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(conversation)
                });
            }

            for (const user of sampleUsers) {
                await fetch('tables/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...user,
                        username: user.id,
                        password: 'user123',
                        user_type: 'user',
                        is_active: true
                    })
                });
            }

            // Reload data
            setTimeout(() => {
                this.loadDashboardData();
            }, 1000);

        } catch (error) {
            console.error('Error creating sample conversations:', error);
        }
    }

    updateStats() {
        // Active chats
        const activeChats = this.conversations.filter(conv => conv.status === 'نشطة').length;
        document.getElementById('activeChats').textContent = activeChats;

        // Today's consultations
        const today = new Date().toISOString().split('T')[0];
        const todayConsultations = this.conversations.filter(conv => 
            conv.created_at && conv.created_at.startsWith(today)
        ).length;
        document.getElementById('todayConsultations').textContent = todayConsultations;

        // New patients (patients with first conversation today)
        const newPatients = this.conversations.filter(conv => {
            const patient = this.patients.find(p => p.id === conv.user_id);
            return patient && patient.created_at && patient.created_at.startsWith(today);
        }).length;
        document.getElementById('newPatients').textContent = newPatients;
    }

    displayConversations() {
        const conversationsList = document.getElementById('conversationsList');
        
        if (this.conversations.length === 0) {
            conversationsList.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <i class="fas fa-comments text-4xl mb-3"></i>
                    <p>لا توجد محادثات بعد</p>
                    <p class="text-sm">ستظهر المحادثات الجديدة هنا</p>
                </div>
            `;
            return;
        }

        // Sort conversations by last message time
        const sortedConversations = this.conversations.sort((a, b) => 
            new Date(b.last_message_time) - new Date(a.last_message_time)
        );

        conversationsList.innerHTML = sortedConversations.map(conversation => {
            const patient = this.patients.find(p => p.id === conversation.user_id);
            const lastMessageTime = new Date(conversation.last_message_time).toLocaleString('ar-EG', {
                hour: '2-digit',
                minute: '2-digit',
                day: 'numeric',
                month: 'short'
            });

            return `
                <div class="conversation-item border-2 border-gray-200 rounded-lg p-3 cursor-pointer hover:border-purple-500 transition-colors ${conversation.id === this.selectedConversation?.id ? 'border-purple-500 bg-purple-50' : ''}"
                     onclick="doctorDashboard.selectConversation('${conversation.id}')">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center space-x-3 space-x-reverse">
                            <div class="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                                ${patient?.full_name?.charAt(0) || 'م'}
                            </div>
                            <div>
                                <h4 class="font-semibold text-gray-800 text-sm">${patient?.full_name || 'مريض جديد'}</h4>
                                <p class="text-xs text-gray-500">${conversation.title}</p>
                            </div>
                        </div>
                        <div class="text-left">
                            <p class="text-xs text-gray-500">${lastMessageTime}</p>
                            ${conversation.is_urgent ? '<i class="fas fa-exclamation-triangle text-red-500 text-sm"></i>' : ''}
                        </div>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="px-2 py-1 rounded-full text-xs ${this.getStatusColor(conversation.status)}">
                            ${conversation.status}
                        </span>
                        <div class="flex items-center text-xs text-gray-500">
                            <i class="fas fa-clock ml-1"></i>
                            <span>آخر رسالة منذ ${this.getTimeAgo(conversation.last_message_time)}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    async selectConversation(conversationId) {
        this.selectedConversation = this.conversations.find(conv => conv.id === conversationId);
        if (!this.selectedConversation) return;

        const patient = this.patients.find(p => p.id === this.selectedConversation.user_id);

        // Update UI
        this.updateChatHeader(patient);
        this.displayPatientInfo(patient);
        await this.loadConversationMessages(conversationId);
        
        // Show chat input
        document.getElementById('chatInput').classList.remove('hidden');
        
        // Update conversation selection in list
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.remove('border-purple-500', 'bg-purple-50');
        });
        event.target.closest('.conversation-item').classList.add('border-purple-500', 'bg-purple-50');
    }

    updateChatHeader(patient) {
        const chatHeader = document.getElementById('chatHeader');
        chatHeader.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3 space-x-reverse">
                    <div class="w-12 h-12 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        ${patient?.full_name?.charAt(0) || 'م'}
                    </div>
                    <div>
                        <h3 class="font-bold text-gray-800">${patient?.full_name || 'مريض جديد'}</h3>
                        <p class="text-sm text-gray-600">${patient?.age ? `العمر: ${patient.age} سنة` : ''} ${patient?.gender ? `- ${patient.gender}` : ''}</p>
                    </div>
                </div>
                <div class="flex items-center space-x-2 space-x-reverse">
                    ${this.selectedConversation.is_urgent ? '<span class="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold"><i class="fas fa-exclamation-triangle ml-1"></i>حالة طارئة</span>' : ''}
                    <button onclick="doctorDashboard.markAsUrgent()" class="text-gray-500 hover:text-red-600">
                        <i class="fas fa-flag"></i>
                    </button>
                    <button onclick="doctorDashboard.endConversation()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
    }

    displayPatientInfo(patient) {
        const patientInfoPanel = document.getElementById('patientInfoPanel');
        patientInfoPanel.classList.remove('hidden');

        // Basic info
        const basicInfo = document.getElementById('patientBasicInfo');
        basicInfo.innerHTML = `
            <div class="flex justify-between">
                <span class="text-gray-600">الاسم:</span>
                <span class="font-medium">${patient?.full_name || 'غير محدد'}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600">العمر:</span>
                <span class="font-medium">${patient?.age || 'غير محدد'}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600">الجنس:</span>
                <span class="font-medium">${patient?.gender || 'غير محدد'}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600">الهاتف:</span>
                <span class="font-medium">${patient?.phone || 'غير محدد'}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600">تاريخ التسجيل:</span>
                <span class="font-medium">${patient?.created_at ? new Date(patient.created_at).toLocaleDateString('ar-EG') : 'غير محدد'}</span>
            </div>
        `;

        // Consultation history
        const consultationHistory = document.getElementById('consultationHistory');
        const patientConversations = this.conversations.filter(conv => conv.user_id === patient?.id);
        
        if (patientConversations.length <= 1) {
            consultationHistory.innerHTML = '<p class="text-gray-500">مريض جديد - لا يوجد تاريخ استشارات سابقة</p>';
        } else {
            consultationHistory.innerHTML = patientConversations.map(conv => `
                <div class="flex justify-between items-center py-1">
                    <span class="text-gray-600">${new Date(conv.created_at).toLocaleDateString('ar-EG')}</span>
                    <span class="px-2 py-1 rounded-full text-xs ${this.getStatusColor(conv.status)}">${conv.status}</span>
                </div>
            `).join('');
        }
    }

    async loadConversationMessages(conversationId) {
        try {
            // Load messages from database
            const response = await fetch(`tables/messages?limit=1000`);
            const data = await response.json();
            
            // Filter messages for this conversation
            const allMessages = data.data || [];
            const messages = allMessages.filter(msg => msg.conversation_id === conversationId);

            const chatMessages = document.getElementById('chatMessages');
            chatMessages.innerHTML = '';

            if (messages.length === 0) {
                // Create sample messages for testing
                await this.createSampleMessages(conversationId);
                
                chatMessages.innerHTML = `
                    <div class="text-center text-gray-500 py-8">
                        <i class="fas fa-comment-dots text-3xl mb-3"></i>
                        <p>بدء محادثة جديدة</p>
                        <p class="text-sm">تم تحميل المحادثة، يمكنك البدء بالرد</p>
                    </div>
                `;
                
                // Reload messages after creating samples
                setTimeout(() => this.loadConversationMessages(conversationId), 500);
                return;
            }

            // Sort messages by timestamp
            messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            messages.forEach(message => {
                const messageElement = this.createMessageElement(message);
                chatMessages.appendChild(messageElement);
            });

            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;

            // Mark messages as read
            this.markMessagesAsRead(conversationId);

        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    async createSampleMessages(conversationId) {
        try {
            const conversation = this.conversations.find(c => c.id === conversationId);
            if (!conversation) return;

            const sampleMessages = [
                {
                    conversation_id: conversationId,
                    sender_id: conversation.user_id,
                    sender_type: 'user',
                    message: 'السلام عليكم دكتورة، أعاني من صداع مستمر منذ 3 أيام وأريد استشارتك',
                    attachments: [],
                    is_read: false,
                    timestamp: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
                }
            ];

            for (const message of sampleMessages) {
                await fetch('tables/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(message)
                });
            }
        } catch (error) {
            console.error('Error creating sample messages:', error);
        }
    }

    createMessageElement(message) {
        const div = document.createElement('div');
        const isDoctor = message.sender_type === 'doctor' || message.sender_type === 'admin';
        
        div.className = `message mb-4`;
        
        div.innerHTML = `
            <div class="flex ${isDoctor ? 'justify-end' : 'justify-start'}">
                <div class="max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${isDoctor ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200 text-gray-800'}">
                    <p class="text-sm">${message.message}</p>
                    <div class="flex items-center justify-between mt-2">
                        <p class="text-xs ${isDoctor ? 'text-purple-100' : 'text-gray-500'}">
                            ${new Date(message.timestamp).toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        ${isDoctor ? `<i class="fas fa-check text-xs ${message.is_read ? 'text-purple-200' : 'text-purple-300'}"></i>` : ''}
                    </div>
                </div>
            </div>
        `;

        return div;
    }

    async sendMessage() {
        const input = document.getElementById('messageInput');
        const messageText = input.value.trim();
        
        if (!messageText || !this.selectedConversation) return;

        try {
            const messageData = {
                conversation_id: this.selectedConversation.id,
                sender_id: this.currentDoctor.id,
                sender_type: 'doctor',
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
            await this.updateConversationLastMessage(this.selectedConversation.id);

            // Show notification
            this.showNotification('تم إرسال الرسالة', 'success');

        } catch (error) {
            console.error('Error sending message:', error);
            this.showNotification('حدث خطأ في إرسال الرسالة', 'error');
        }
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
            
            // Update local data
            const conversation = this.conversations.find(conv => conv.id === conversationId);
            if (conversation) {
                conversation.last_message_time = new Date().toISOString();
            }
            
            // Refresh conversations list
            this.displayConversations();
        } catch (error) {
            console.error('Error updating conversation:', error);
        }
    }

    async markMessagesAsRead(conversationId) {
        try {
            // Get unread messages for this conversation
            const response = await fetch(`tables/messages?conversation_id=${conversationId}&is_read=false`);
            const data = await response.json();
            const unreadMessages = data.data || [];

            // Mark each message as read
            for (const message of unreadMessages) {
                if (message.sender_type !== 'doctor') { // Only mark patient messages as read
                    await fetch(`tables/messages/${message.id}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ is_read: true })
                    });
                }
            }
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    }

    insertTemplate(templateText) {
        const input = document.getElementById('messageInput');
        const currentText = input.value;
        const newText = currentText ? `${currentText}\n\n${templateText}` : templateText;
        input.value = newText;
        input.focus();
        
        // Animate template selection
        event.target.closest('.quick-template').classList.add('bg-purple-100');
        setTimeout(() => {
            event.target.closest('.quick-template').classList.remove('bg-purple-100');
        }, 300);
    }

    async toggleOnlineStatus() {
        this.isOnline = !this.isOnline;
        const statusBtn = document.getElementById('statusToggle');
        
        if (this.isOnline) {
            statusBtn.className = 'flex items-center bg-green-500 text-white px-3 py-1 rounded-full hover:bg-green-600 transition-colors';
            statusBtn.innerHTML = '<span class="online-badge w-2 h-2 bg-white rounded-full ml-2"></span>متاحة';
        } else {
            statusBtn.className = 'flex items-center bg-gray-500 text-white px-3 py-1 rounded-full hover:bg-gray-600 transition-colors';
            statusBtn.innerHTML = '<span class="w-2 h-2 bg-white rounded-full ml-2"></span>غير متاحة';
        }

        // Update doctor status in database
        try {
            await fetch(`tables/doctors/${this.currentDoctor.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ is_available: this.isOnline })
            });
            
            this.showNotification(`تم تغيير الحالة إلى ${this.isOnline ? 'متاحة' : 'غير متاحة'}`, 'success');
        } catch (error) {
            console.error('Error updating status:', error);
        }
    }

    async markAsUrgent() {
        if (!this.selectedConversation) return;

        try {
            const newUrgentStatus = !this.selectedConversation.is_urgent;
            
            await fetch(`tables/conversations/${this.selectedConversation.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ is_urgent: newUrgentStatus })
            });

            this.selectedConversation.is_urgent = newUrgentStatus;
            
            // Update UI
            const patient = this.patients.find(p => p.id === this.selectedConversation.user_id);
            this.updateChatHeader(patient);
            this.displayConversations();
            
            this.showNotification(`تم ${newUrgentStatus ? 'تمييز' : 'إلغاء تمييز'} المحادثة كحالة طارئة`, 'success');
        } catch (error) {
            console.error('Error updating urgent status:', error);
        }
    }

    async endConversation() {
        if (!this.selectedConversation) return;

        if (confirm('هل أنت متأكدة من إنهاء هذه المحادثة؟')) {
            try {
                await fetch(`tables/conversations/${this.selectedConversation.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status: 'منتهية' })
                });

                this.selectedConversation.status = 'منتهية';
                this.displayConversations();
                this.showNotification('تم إنهاء المحادثة', 'success');
                
                // Clear chat window
                document.getElementById('chatMessages').innerHTML = '';
                document.getElementById('chatInput').classList.add('hidden');
                document.getElementById('patientInfoPanel').classList.add('hidden');
                
            } catch (error) {
                console.error('Error ending conversation:', error);
            }
        }
    }

    showAttachmentOptions() {
        // Create attachment modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        
        modal.innerHTML = `
            <div class="bg-white rounded-2xl p-6 max-w-md w-full">
                <h3 class="text-lg font-bold mb-4">إرفاق ملف</h3>
                <div class="grid grid-cols-2 gap-4">
                    <button class="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 transition-colors">
                        <i class="fas fa-prescription-bottle-alt text-3xl text-blue-600 mb-2"></i>
                        <span class="text-sm font-semibold">وصفة طبية</span>
                    </button>
                    <button class="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 transition-colors">
                        <i class="fas fa-file-medical text-3xl text-green-600 mb-2"></i>
                        <span class="text-sm font-semibold">تقرير طبي</span>
                    </button>
                    <button class="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 transition-colors">
                        <i class="fas fa-image text-3xl text-purple-600 mb-2"></i>
                        <span class="text-sm font-semibold">صورة</span>
                    </button>
                    <button class="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 transition-colors">
                        <i class="fas fa-file-pdf text-3xl text-red-600 mb-2"></i>
                        <span class="text-sm font-semibold">ملف PDF</span>
                    </button>
                </div>
                <div class="flex justify-end mt-4">
                    <button onclick="this.closest('.fixed').remove()" 
                            class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                        إلغاء
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    startAutoRefresh() {
        // Refresh conversations every 30 seconds
        setInterval(() => {
            this.loadDashboardData();
        }, 30000);

        // Refresh current conversation messages every 10 seconds
        setInterval(() => {
            if (this.selectedConversation) {
                this.loadConversationMessages(this.selectedConversation.id);
            }
        }, 10000);
    }

    // Utility functions
    getStatusColor(status) {
        const colors = {
            'نشطة': 'bg-green-100 text-green-800',
            'منتهية': 'bg-gray-100 text-gray-600',
            'مغلقة': 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-600';
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const messageTime = new Date(timestamp);
        const diffMs = now - messageTime;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'الآن';
        if (diffMins < 60) return `${diffMins} دقيقة`;
        if (diffHours < 24) return `${diffHours} ساعة`;
        return `${diffDays} يوم`;
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
}

// Initialize Doctor Dashboard
document.addEventListener('DOMContentLoaded', () => {
    window.doctorDashboard = new DoctorDashboard();
});