// Patient Chat System - دوائك المنزلي
class PatientChat {
    constructor() {
        this.currentUser = null;
        this.currentConversation = null;
        this.messages = [];
        this.doctorInfo = {
            id: 'dr_afrah',
            name: 'د. أفراح محمد',
            specialty: 'طب عام',
            experience: '8 سنوات',
            country: 'اليمن',
            avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=50&h=50&fit=crop&crop=face',
            isOnline: true
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadUserData();
        this.connectToChat();
        console.log('Patient Chat System initialized');
    }

    setupEventListeners() {
        // Message form
        const messageForm = document.getElementById('messageForm');
        if (messageForm) {
            messageForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.sendMessage();
            });
        }

        // Character counter
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.addEventListener('input', this.updateCharCount);
            messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        // File input
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.handleFileUpload(e.target.files);
            });
        }
    }

    loadUserData() {
        // Try to get user from localStorage or create guest user
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
        } else {
            this.currentUser = {
                id: 'guest_' + Date.now(),
                full_name: 'زائر',
                email: 'guest@example.com',
                type: 'guest'
            };
        }
        console.log('User loaded:', this.currentUser.full_name);
    }

    async connectToChat() {
        try {
            // Check for existing conversation
            await this.loadExistingConversation();
            
            // If no conversation exists, create one
            if (!this.currentConversation) {
                await this.createNewConversation();
            }

            // Load messages
            await this.loadMessages();
            
        } catch (error) {
            console.error('Error connecting to chat:', error);
            this.showNotification('خطأ في الاتصال بالخادم', 'error');
        }
    }

    async loadExistingConversation() {
        try {
            const response = await fetch(`tables/conversations?patient_email=${this.currentUser.email}&limit=1`);
            if (response.ok) {
                const data = await response.json();
                if (data.data && data.data.length > 0) {
                    this.currentConversation = data.data[0];
                    console.log('Existing conversation loaded:', this.currentConversation.id);
                }
            }
        } catch (error) {
            console.error('Error loading existing conversation:', error);
        }
    }

    async createNewConversation() {
        const conversationData = {
            patient_name: this.currentUser.full_name,
            patient_email: this.currentUser.email,
            doctor_name: this.doctorInfo.name,
            doctor_id: this.doctorInfo.id,
            title: `استشارة طبية - ${this.currentUser.full_name}`,
            status: 'active',
            type: 'medical_consultation',
            messages: []
        };

        try {
            const response = await fetch('tables/conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(conversationData)
            });

            if (response.ok) {
                this.currentConversation = await response.json();
                console.log('New conversation created:', this.currentConversation.id);
            } else {
                throw new Error('Failed to create conversation');
            }
        } catch (error) {
            console.error('Error creating conversation:', error);
            this.showNotification('فشل في إنشاء المحادثة', 'error');
        }
    }

    async loadMessages() {
        if (!this.currentConversation) return;

        try {
            const response = await fetch(`tables/messages?conversation_id=${this.currentConversation.id}&limit=100`);
            if (response.ok) {
                const data = await response.json();
                this.messages = data.data || [];
                this.displayMessages();
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    displayMessages() {
        const container = document.getElementById('messagesContainer');
        if (!container) return;

        // Keep the initial doctor message
        const initialMessage = container.querySelector('.flex');
        
        // Clear other messages but keep the initial one
        const messages = container.querySelectorAll('.flex:not(:first-child)');
        messages.forEach(msg => msg.remove());

        // Add loaded messages
        this.messages.forEach(message => {
            this.addMessageToUI(message);
        });

        // Scroll to bottom
        this.scrollToBottom();
    }

    addMessageToUI(message) {
        const container = document.getElementById('messagesContainer');
        if (!container) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = 'flex items-start space-x-3 space-x-reverse message';

        const isPatient = message.sender_type === 'patient' || message.sender_name === this.currentUser.full_name;
        
        if (isPatient) {
            // Patient message (right side)
            messageDiv.innerHTML = `
                <div class="flex items-start space-x-3 space-x-reverse flex-row-reverse w-full">
                    <div class="w-10 h-10 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        ${this.currentUser.full_name.charAt(0)}
                    </div>
                    <div class="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg rounded-tl-none p-3 max-w-xs">
                        <p>${message.content}</p>
                        <span class="text-xs text-blue-100 mt-2 block">${this.formatTime(message.timestamp)}</span>
                    </div>
                </div>
            `;
        } else {
            // Doctor message (left side)
            messageDiv.innerHTML = `
                <div class="w-10 h-10 bg-gradient-to-r from-pink-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    د
                </div>
                <div class="bg-gray-100 rounded-lg rounded-tr-none p-3 max-w-xs">
                    <p class="text-gray-800">${message.content}</p>
                    <span class="text-xs text-gray-500 mt-2 block">${this.formatTime(message.timestamp)}</span>
                </div>
            `;
        }

        container.appendChild(messageDiv);
    }

    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        
        if (!messageInput || !messageInput.value.trim()) return;

        const messageContent = messageInput.value.trim();
        
        // Disable input and button
        messageInput.disabled = true;
        sendButton.disabled = true;

        try {
            // Create message object
            const messageData = {
                conversation_id: this.currentConversation.id,
                sender_id: this.currentUser.id,
                sender_type: 'patient',
                sender_name: this.currentUser.full_name,
                content: messageContent,
                timestamp: new Date().toISOString(),
                is_read: false
            };

            // Add to UI immediately
            this.addMessageToUI(messageData);
            
            // Clear input
            messageInput.value = '';
            this.updateCharCount();
            
            // Scroll to bottom
            this.scrollToBottom();

            // Send to server
            const response = await fetch('tables/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(messageData)
            });

            if (response.ok) {
                const savedMessage = await response.json();
                this.messages.push(savedMessage);
                
                // Show typing indicator
                this.showTypingIndicator();
                
                // Simulate doctor response after delay
                setTimeout(() => {
                    this.generateDoctorResponse(messageContent);
                }, 2000 + Math.random() * 3000);
                
                this.showNotification('تم إرسال الرسالة', 'success');
            } else {
                throw new Error('Failed to send message');
            }

        } catch (error) {
            console.error('Error sending message:', error);
            this.showNotification('فشل في إرسال الرسالة', 'error');
        } finally {
            // Re-enable input and button
            messageInput.disabled = false;
            sendButton.disabled = false;
            messageInput.focus();
        }
    }

    async generateDoctorResponse(patientMessage) {
        this.hideTypingIndicator();
        
        // Generate contextual response based on patient message
        let response = this.getDoctorResponse(patientMessage);
        
        const messageData = {
            conversation_id: this.currentConversation.id,
            sender_id: this.doctorInfo.id,
            sender_type: 'doctor',
            sender_name: this.doctorInfo.name,
            content: response,
            timestamp: new Date().toISOString(),
            is_read: false
        };

        try {
            // Add to UI
            this.addMessageToUI(messageData);
            this.scrollToBottom();

            // Save to server
            const serverResponse = await fetch('tables/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(messageData)
            });

            if (serverResponse.ok) {
                const savedMessage = await serverResponse.json();
                this.messages.push(savedMessage);
            }

        } catch (error) {
            console.error('Error generating doctor response:', error);
        }
    }

    getDoctorResponse(patientMessage) {
        const msg = patientMessage.toLowerCase();
        
        // Symptom-based responses
        if (msg.includes('صداع') || msg.includes('رأس')) {
            return 'أفهم أنك تعاني من صداع. هل يمكنك وصف شدة الألم من 1-10؟ ومتى بدأ؟ هل تناولت أي مسكنات؟';
        }
        
        if (msg.includes('حرارة') || msg.includes('حمى')) {
            return 'ارتفاع درجة الحرارة مؤشر مهم. هل قست درجة حرارتك؟ وما هي الأعراض الأخرى المصاحبة؟ من المهم الراحة وشرب السوائل.';
        }
        
        if (msg.includes('معدة') || msg.includes('بطن')) {
            return 'آلام المعدة لها أسباب متعددة. هل الألم مستمر أم متقطع؟ هل هناك غثيان أو قيء؟ متى كانت آخر وجبة تناولتها؟';
        }
        
        if (msg.includes('دواء') || msg.includes('علاج')) {
            return 'بخصوص الأدوية، من المهم معرفة اسم الدواء والجرعة. هل تتناول أي أدوية أخرى؟ هل لديك أي حساسية معروفة؟';
        }
        
        if (msg.includes('شكر') || msg.includes('الله يعطيك')) {
            return 'العفو، أنا هنا لمساعدتك. لا تتردد في السؤال عن أي شيء آخر. صحتك تهمني 🌸';
        }
        
        // Default responses
        const responses = [
            'شكراً لك على التواصل. يمكنك إعطائي تفاصيل أكثر عن حالتك لأتمكن من مساعدتك بشكل أفضل؟',
            'أفهم قلقك. هل يمكنك وصف الأعراض بالتفصيل ومتى بدأت؟',
            'هذه معلومات مفيدة. هل هناك أعراض أخرى مصاحبة؟ وهل تتناول أي أدوية حالياً؟',
            'أقدر ثقتك بي. دعني أساعدك - هل الأعراض جديدة أم مستمرة منذ فترة؟',
            'من المهم فهم حالتك جيداً. هل يمكنك إخباري عن أي ظروف خاصة أو تاريخ مرضي؟'
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    sendQuickMessage(message) {
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.value = message;
            this.sendMessage();
        }
    }

    startQuickConsultation(type) {
        const messages = {
            general: 'مرحباً دكتورة، أريد استشارة طبية عامة',
            symptoms: 'دكتورة، أعاني من بعض الأعراض وأريد استشارتك',
            medication: 'دكتورة، لدي استفسار حول دواء معين'
        };

        this.sendQuickMessage(messages[type] || messages.general);
        
        // Hide welcome message
        const welcomeMsg = document.getElementById('welcomeMessage');
        if (welcomeMsg) {
            welcomeMsg.style.display = 'none';
        }
    }

    showTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.classList.remove('hidden');
            this.scrollToBottom();
        }
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.classList.add('hidden');
        }
    }

    attachFile() {
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.click();
        }
    }

    handleFileUpload(files) {
        if (files.length === 0) return;

        Array.from(files).forEach(file => {
            // Validate file
            if (file.size > 10 * 1024 * 1024) {
                this.showNotification('حجم الملف كبير جداً (الحد الأقصى 10 ميجابايت)', 'warning');
                return;
            }

            // Create file message
            const fileName = file.name;
            const fileSize = this.formatFileSize(file.size);
            const fileMessage = `📎 تم إرفاق ملف: ${fileName} (${fileSize})`;
            
            this.sendQuickMessage(fileMessage);
        });
    }

    useVoiceInput() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.showNotification('متصفحك لا يدعم التعرف على الصوت', 'warning');
            return;
        }

        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = 'ar-SA';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            this.showNotification('استمع... تحدث الآن', 'info');
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const messageInput = document.getElementById('messageInput');
            if (messageInput) {
                messageInput.value = transcript;
                this.updateCharCount();
            }
        };

        recognition.onerror = (event) => {
            this.showNotification('خطأ في التعرف على الصوت', 'error');
        };

        recognition.start();
    }

    toggleEmojiPicker() {
        // Simple emoji picker
        const emojis = ['😊', '😷', '🤒', '😰', '😴', '💊', '🏥', '❤️', '👍', '🙏'];
        const messageInput = document.getElementById('messageInput');
        
        if (messageInput) {
            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
            messageInput.value += randomEmoji;
            this.updateCharCount();
        }
    }

    showDoctorInfo() {
        const modal = this.createModal('معلومات الطبيبة', `
            <div class="text-center">
                <img src="${this.doctorInfo.avatar}" alt="Doctor" class="w-24 h-24 rounded-full mx-auto mb-4">
                <h3 class="text-xl font-bold mb-2">${this.doctorInfo.name}</h3>
                <div class="space-y-2 text-gray-600">
                    <p><i class="fas fa-stethoscope mr-2"></i> ${this.doctorInfo.specialty}</p>
                    <p><i class="fas fa-calendar-alt mr-2"></i> ${this.doctorInfo.experience} خبرة</p>
                    <p><i class="fas fa-map-marker-alt mr-2"></i> ${this.doctorInfo.country}</p>
                    <div class="flex items-center justify-center mt-4">
                        <span class="w-3 h-3 bg-green-400 rounded-full ml-2 animate-pulse"></span>
                        <span class="text-green-600 font-medium">متاحة الآن</span>
                    </div>
                </div>
            </div>
        `);
    }

    showEmergencyHelp() {
        const modal = this.createModal('مساعدة طارئة', `
            <div class="text-center">
                <div class="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-exclamation-triangle text-white text-2xl"></i>
                </div>
                <h3 class="text-xl font-bold text-red-600 mb-4">حالة طوارئ؟</h3>
                <p class="text-gray-600 mb-6">إذا كانت حالتك تستدعي تدخلاً طبياً فورياً، يرجى الاتصال بخدمات الطوارئ</p>
                <div class="space-y-3">
                    <a href="tel:911" class="block bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors">
                        <i class="fas fa-phone mr-2"></i> اتصال طوارئ: 911
                    </a>
                    <button onclick="patientChat.sendQuickMessage('هذه حالة طوارئ، أحتاج مساعدة فورية')" class="block w-full bg-orange-500 text-white py-3 px-6 rounded-lg hover:bg-orange-600 transition-colors">
                        <i class="fas fa-comment mr-2"></i> إبلاغ الطبيبة بالطوارئ
                    </button>
                </div>
            </div>
        `, true);
    }

    createModal(title, content, emergency = false) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        
        modal.innerHTML = `
            <div class="bg-white rounded-2xl max-w-md w-full max-h-screen overflow-y-auto">
                <div class="sticky top-0 bg-white border-b p-4 flex justify-between items-center rounded-t-2xl">
                    <h3 class="text-xl font-bold ${emergency ? 'text-red-600' : 'text-gray-800'}">${title}</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                <div class="p-6">
                    ${content}
                </div>
            </div>
        `;
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        document.body.appendChild(modal);
        return modal;
    }

    updateCharCount() {
        const messageInput = document.getElementById('messageInput');
        const charCount = document.getElementById('charCount');
        
        if (messageInput && charCount) {
            const length = messageInput.value.length;
            charCount.textContent = `${length}/500`;
            
            if (length > 450) {
                charCount.style.color = '#ef4444';
            } else if (length > 350) {
                charCount.style.color = '#f59e0b';
            } else {
                charCount.style.color = '#6b7280';
            }
        }
    }

    scrollToBottom() {
        const container = document.getElementById('messagesContainer');
        if (container) {
            setTimeout(() => {
                container.scrollTop = container.scrollHeight;
            }, 100);
        }
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'الآن';
        if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
        if (diffMins < 1440) return `منذ ${Math.floor(diffMins / 60)} ساعة`;
        return date.toLocaleDateString('ar-EG');
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 بايت';
        const k = 1024;
        const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm text-white font-medium`;
        
        switch (type) {
            case 'success':
                notification.className += ' bg-green-500';
                break;
            case 'error':
                notification.className += ' bg-red-500';
                break;
            case 'warning':
                notification.className += ' bg-yellow-500';
                break;
            default:
                notification.className += ' bg-blue-500';
        }
        
        notification.innerHTML = `
            <div class="flex items-center justify-between">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="mr-2 text-white hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.patientChat = new PatientChat();
});