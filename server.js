/**
 * Medical Platform Backend Server
 * خادم المنصة الطبية "دوائك المنزلي"
 * 
 * يوفر APIs لحفظ البيانات في ملفات JSON حقيقية
 * مع إمكانية الوصول من أي جهاز أو متصفح
 */

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const validator = require('validator');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const compression = require('compression');
const morgan = require('morgan');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET || 'medical-platform-secret-key-2024';

// Database paths
const DATA_DIR = path.join(__dirname, 'database');
const DB_FILES = {
    users: path.join(DATA_DIR, 'users.json'),
    doctors: path.join(DATA_DIR, 'doctors.json'),
    medical_tips: path.join(DATA_DIR, 'medical_tips.json'),
    conversations: path.join(DATA_DIR, 'conversations.json'),
    messages: path.join(DATA_DIR, 'messages.json'),
    sessions: path.join(DATA_DIR, 'sessions.json'),
    audit_log: path.join(DATA_DIR, 'audit_log.json'),
    settings: path.join(DATA_DIR, 'settings.json')
};

// ======================== MIDDLEWARE ========================

// Security middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:8080', 'http://127.0.0.1:5500', '*'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (Frontend)
app.use(express.static(path.join(__dirname), {
    setHeaders: (res, path) => {
        if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        } else if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/doctor', (req, res) => {
    res.sendFile(path.join(__dirname, 'doctor.html'));
});

app.get('/doctor-management', (req, res) => {
    res.sendFile(path.join(__dirname, 'doctor-management.html'));
});

app.get('/data-management', (req, res) => {
    res.sendFile(path.join(__dirname, 'data-management.html'));
});

// ======================== DATABASE FUNCTIONS ========================

/**
 * Initialize database files
 */
async function initializeDatabase() {
    try {
        // Create database directory if it doesn't exist
        await fs.mkdir(DATA_DIR, { recursive: true });
        
        // Initialize each database file with default data
        const defaultData = {
            users: [
                {
                    id: uuidv4(),
                    username: 'admin',
                    password: await bcrypt.hash('admin123', 12),
                    full_name: 'مدير النظام',
                    email: 'admin@medical-platform.com',
                    phone: '+966501234567',
                    age: 35,
                    gender: 'male',
                    user_type: 'admin',
                    is_active: true,
                    created_at: Date.now(),
                    updated_at: Date.now(),
                    last_login: null
                },
                {
                    id: uuidv4(),
                    username: 'dr.afrah',
                    password: await bcrypt.hash('doctor123', 12),
                    full_name: 'د. أفراح محمد',
                    email: 'dr.afrah@medical-platform.com',
                    phone: '+967771234567',
                    age: 32,
                    gender: 'female',
                    user_type: 'doctor',
                    is_active: true,
                    created_at: Date.now(),
                    updated_at: Date.now(),
                    last_login: null
                }
            ],
            doctors: [
                {
                    id: uuidv4(),
                    user_id: null, // Will be set after users are created
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
            medical_tips: [
                {
                    id: uuidv4(),
                    title: 'أهمية غسل اليدين',
                    content: 'غسل اليدين بالماء والصابون لمدة 20 ثانية على الأقل يقلل من انتشار الجراثيم والأمراض بنسبة تصل إلى 80%.',
                    category: 'وقاية',
                    author_id: null,
                    image_url: 'https://via.placeholder.com/400x200/10B981/FFFFFF?text=غسل+اليدين',
                    is_published: true,
                    views: 145,
                    likes: 23,
                    created_at: Date.now() - 86400000,
                    updated_at: Date.now() - 86400000
                },
                {
                    id: uuidv4(),
                    title: 'نصائح للنظام الغذائي المتوازن',
                    content: 'تناول 5 حصص من الخضار والفواكه يومياً، واشرب 8 أكواب من الماء، وقلل من السكريات والأملاح.',
                    category: 'تغذية',
                    author_id: null,
                    image_url: 'https://via.placeholder.com/400x200/059669/FFFFFF?text=تغذية+صحية',
                    is_published: true,
                    views: 89,
                    likes: 15,
                    created_at: Date.now() - 172800000,
                    updated_at: Date.now() - 172800000
                }
            ],
            conversations: [],
            messages: [],
            sessions: [],
            audit_log: [],
            settings: [
                {
                    id: uuidv4(),
                    key: 'platform_name',
                    value: 'دوائك المنزلي',
                    description: 'اسم المنصة الطبية',
                    is_encrypted: false,
                    updated_by: 'system',
                    updated_at: Date.now()
                }
            ]
        };

        // Create database files
        for (const [table, filePath] of Object.entries(DB_FILES)) {
            try {
                await fs.access(filePath);
                console.log(`✅ Database file exists: ${table}.json`);
            } catch (error) {
                // File doesn't exist, create it
                await fs.writeFile(filePath, JSON.stringify(defaultData[table] || [], null, 2));
                console.log(`📝 Created database file: ${table}.json`);
            }
        }

        // Link doctor user_id after users are created
        const users = await readDatabase('users');
        const doctors = await readDatabase('doctors');
        const doctorUser = users.find(u => u.username === 'dr.afrah');
        
        if (doctorUser && doctors.length > 0 && !doctors[0].user_id) {
            doctors[0].user_id = doctorUser.id;
            await writeDatabase('doctors', doctors);
            console.log('🔗 Linked doctor profile with user account');
        }

        console.log('🚀 Database initialized successfully');
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        throw error;
    }
}

/**
 * Read data from database file
 */
async function readDatabase(table) {
    try {
        const filePath = DB_FILES[table];
        if (!filePath) {
            throw new Error(`Table ${table} not found`);
        }
        
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${table}:`, error);
        return [];
    }
}

/**
 * Write data to database file
 */
async function writeDatabase(table, data) {
    try {
        const filePath = DB_FILES[table];
        if (!filePath) {
            throw new Error(`Table ${table} not found`);
        }
        
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        console.log(`💾 Saved data to ${table}.json`);
        return true;
    } catch (error) {
        console.error(`Error writing ${table}:`, error);
        return false;
    }
}

/**
 * Log audit events
 */
async function logAuditEvent(userId, action, tableName, recordId, oldValues, newValues, ipAddress, userAgent) {
    try {
        const auditLog = await readDatabase('audit_log');
        const event = {
            id: uuidv4(),
            user_id: userId || 'system',
            action,
            table_name: tableName,
            record_id: recordId,
            old_values: oldValues ? JSON.stringify(oldValues) : null,
            new_values: newValues ? JSON.stringify(newValues) : null,
            ip_address: ipAddress,
            user_agent: userAgent,
            created_at: Date.now()
        };
        
        auditLog.push(event);
        await writeDatabase('audit_log', auditLog);
    } catch (error) {
        console.error('Error logging audit event:', error);
    }
}

// ======================== AUTH MIDDLEWARE ========================

/**
 * JWT Authentication middleware
 */
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const users = await readDatabase('users');
        const user = users.find(u => u.id === decoded.userId && u.is_active);
        
        if (!user) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

/**
 * Admin authorization middleware
 */
const requireAdmin = (req, res, next) => {
    if (req.user && req.user.user_type === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Admin access required' });
    }
};

// ======================== AUTH ROUTES ========================

/**
 * User Registration
 */
app.post('/api/register', async (req, res) => {
    try {
        const { username, password, full_name, email, phone, age, gender } = req.body;

        // Validate required fields
        if (!username || !password || !full_name || !email || !phone || !age || !gender) {
            return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
        }

        // Validate email
        if (!validator.isEmail(email)) {
            return res.status(400).json({ error: 'البريد الإلكتروني غير صحيح' });
        }

        // Read existing users
        const users = await readDatabase('users');

        // Check if username exists
        if (users.find(u => u.username === username)) {
            return res.status(400).json({ error: 'اسم المستخدم موجود مسبقاً' });
        }

        // Check if email exists
        if (users.find(u => u.email === email)) {
            return res.status(400).json({ error: 'البريد الإلكتروني مسجل مسبقاً' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create new user
        const newUser = {
            id: uuidv4(),
            username,
            password: hashedPassword,
            full_name,
            email,
            phone,
            age: parseInt(age),
            gender,
            user_type: 'user',
            is_active: true,
            created_at: Date.now(),
            updated_at: Date.now(),
            last_login: null
        };

        // Add to users array
        users.push(newUser);
        await writeDatabase('users', users);

        // Log the registration
        await logAuditEvent(newUser.id, 'user_registered', 'users', newUser.id, null, newUser, req.ip, req.get('User-Agent'));

        // Remove password from response
        const { password: _, ...userResponse } = newUser;

        res.status(201).json({
            success: true,
            message: 'تم إنشاء الحساب بنجاح',
            user: userResponse
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'حدث خطأ في النظام' });
    }
});

/**
 * User Login
 */
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'اسم المستخدم وكلمة المرور مطلوبان' });
        }

        // Read users from database
        const users = await readDatabase('users');
        const user = users.find(u => u.username === username && u.is_active);

        if (!user) {
            return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
        }

        // Update last login
        user.last_login = Date.now();
        user.updated_at = Date.now();
        await writeDatabase('users', users);

        // Create JWT token
        const token = jwt.sign(
            { userId: user.id, username: user.username, userType: user.user_type },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Save session
        const sessions = await readDatabase('sessions');
        const session = {
            id: uuidv4(),
            user_id: user.id,
            token,
            ip_address: req.ip,
            user_agent: req.get('User-Agent'),
            created_at: Date.now(),
            expires_at: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
            is_active: true
        };
        sessions.push(session);
        await writeDatabase('sessions', sessions);

        // Log the login
        await logAuditEvent(user.id, 'user_login', 'sessions', session.id, null, session, req.ip, req.get('User-Agent'));

        // Remove password from response
        const { password: _, ...userResponse } = user;

        res.json({
            success: true,
            message: 'تم تسجيل الدخول بنجاح',
            user: userResponse,
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'حدث خطأ في النظام' });
    }
});

/**
 * User Logout
 */
app.post('/api/logout', authenticateToken, async (req, res) => {
    try {
        const sessions = await readDatabase('sessions');
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        // Deactivate session
        const session = sessions.find(s => s.token === token);
        if (session) {
            session.is_active = false;
            session.ended_at = Date.now();
            await writeDatabase('sessions', sessions);
        }

        res.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'حدث خطأ في النظام' });
    }
});

// ======================== DATA ROUTES ========================

/**
 * Generic GET route for tables
 */
app.get('/api/tables/:table', async (req, res) => {
    try {
        const { table } = req.params;
        const { page = 1, limit = 100, search, sort } = req.query;

        const data = await readDatabase(table);
        let filteredData = [...data];

        // Apply search filter
        if (search) {
            filteredData = filteredData.filter(item => {
                const searchFields = ['title', 'name', 'full_name', 'content', 'username', 'specialty'];
                return searchFields.some(field => 
                    item[field] && item[field].toString().toLowerCase().includes(search.toLowerCase())
                );
            });
        }

        // Apply sorting
        if (sort) {
            const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
            const sortDirection = sort.startsWith('-') ? -1 : 1;
            filteredData.sort((a, b) => {
                if (sortDirection === -1) {
                    return b[sortField] > a[sortField] ? 1 : -1;
                }
                return a[sortField] > b[sortField] ? 1 : -1;
            });
        }

        // Apply pagination
        const total = filteredData.length;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const paginatedData = filteredData.slice(offset, offset + parseInt(limit));

        res.json({
            data: paginatedData,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            table
        });

    } catch (error) {
        console.error('GET table error:', error);
        res.status(500).json({ error: 'حدث خطأ في قراءة البيانات' });
    }
});

/**
 * Generic GET single record
 */
app.get('/api/tables/:table/:id', async (req, res) => {
    try {
        const { table, id } = req.params;
        const data = await readDatabase(table);
        const record = data.find(item => item.id === id);

        if (!record) {
            return res.status(404).json({ error: 'السجل غير موجود' });
        }

        res.json(record);

    } catch (error) {
        console.error('GET record error:', error);
        res.status(500).json({ error: 'حدث خطأ في قراءة البيانات' });
    }
});

/**
 * Generic POST route for tables
 */
app.post('/api/tables/:table', async (req, res) => {
    try {
        const { table } = req.params;
        const data = await readDatabase(table);

        const newRecord = {
            id: uuidv4(),
            ...req.body,
            created_at: Date.now(),
            updated_at: Date.now()
        };

        data.push(newRecord);
        await writeDatabase(table, data);

        // Log the action
        await logAuditEvent(req.user?.id, 'create', table, newRecord.id, null, newRecord, req.ip, req.get('User-Agent'));

        res.status(201).json(newRecord);

    } catch (error) {
        console.error('POST table error:', error);
        res.status(500).json({ error: 'حدث خطأ في إنشاء السجل' });
    }
});

/**
 * Generic PUT/PATCH route for tables
 */
app.put('/api/tables/:table/:id', async (req, res) => {
    try {
        const { table, id } = req.params;
        const data = await readDatabase(table);
        const index = data.findIndex(item => item.id === id);

        if (index === -1) {
            return res.status(404).json({ error: 'السجل غير موجود' });
        }

        const oldRecord = { ...data[index] };
        const updatedRecord = {
            ...data[index],
            ...req.body,
            updated_at: Date.now()
        };

        data[index] = updatedRecord;
        await writeDatabase(table, data);

        // Log the action
        await logAuditEvent(req.user?.id, 'update', table, id, oldRecord, updatedRecord, req.ip, req.get('User-Agent'));

        res.json(updatedRecord);

    } catch (error) {
        console.error('PUT table error:', error);
        res.status(500).json({ error: 'حدث خطأ في تحديث السجل' });
    }
});

app.patch('/api/tables/:table/:id', async (req, res) => {
    try {
        const { table, id } = req.params;
        const data = await readDatabase(table);
        const index = data.findIndex(item => item.id === id);

        if (index === -1) {
            return res.status(404).json({ error: 'السجل غير موجود' });
        }

        const oldRecord = { ...data[index] };
        const updatedRecord = {
            ...data[index],
            ...req.body,
            updated_at: Date.now()
        };

        data[index] = updatedRecord;
        await writeDatabase(table, data);

        // Log the action
        await logAuditEvent(req.user?.id, 'update', table, id, oldRecord, updatedRecord, req.ip, req.get('User-Agent'));

        res.json(updatedRecord);

    } catch (error) {
        console.error('PATCH table error:', error);
        res.status(500).json({ error: 'حدث خطأ في تحديث السجل' });
    }
});

/**
 * Generic DELETE route for tables
 */
app.delete('/api/tables/:table/:id', async (req, res) => {
    try {
        const { table, id } = req.params;
        const data = await readDatabase(table);
        const index = data.findIndex(item => item.id === id);

        if (index === -1) {
            return res.status(404).json({ error: 'السجل غير موجود' });
        }

        const deletedRecord = data[index];
        data.splice(index, 1);
        await writeDatabase(table, data);

        // Log the action
        await logAuditEvent(req.user?.id, 'delete', table, id, deletedRecord, null, req.ip, req.get('User-Agent'));

        res.status(204).send();

    } catch (error) {
        console.error('DELETE table error:', error);
        res.status(500).json({ error: 'حدث خطأ في حذف السجل' });
    }
});

// ======================== ADMIN ROUTES ========================

/**
 * Get system statistics
 */
app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const stats = {};
        
        for (const table of Object.keys(DB_FILES)) {
            const data = await readDatabase(table);
            stats[table] = data.length;
        }

        stats.total_records = Object.values(stats).reduce((sum, count) => sum + count, 0);
        stats.server_uptime = process.uptime();
        stats.memory_usage = process.memoryUsage();

        res.json(stats);

    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'حدث خطأ في قراءة الإحصائيات' });
    }
});

/**
 * Export all data
 */
app.get('/api/admin/export', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const exportData = {
            platform: 'دوائك المنزلي',
            exported_at: Date.now(),
            exported_by: req.user.id,
            version: '1.0.0',
            data: {}
        };

        for (const [table, filePath] of Object.entries(DB_FILES)) {
            exportData.data[table] = await readDatabase(table);
        }

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=medical-platform-backup.json');
        res.json(exportData);

    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'حدث خطأ في تصدير البيانات' });
    }
});

// ======================== ERROR HANDLING ========================

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'المسار غير موجود' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'حدث خطأ داخلي في النظام' });
});

// ======================== SERVER STARTUP ========================

async function startServer() {
    try {
        // Initialize database
        await initializeDatabase();
        
        // Start server
        app.listen(PORT, () => {
            console.log('🚀 ===================================');
            console.log('🩺 Medical Platform Backend Server');
            console.log('🌐 منصة دوائك المنزلي');
            console.log('🚀 ===================================');
            console.log(`✅ Server running on port ${PORT}`);
            console.log(`🌐 Frontend: http://localhost:${PORT}`);
            console.log(`📡 API Base: http://localhost:${PORT}/api`);
            console.log('💾 Database: JSON files in /database folder');
            console.log('🔐 JWT Authentication enabled');
            console.log('📊 Audit logging enabled');
            console.log('🚀 ===================================');
        });
        
    } catch (error) {
        console.error('❌ Server startup failed:', error);
        process.exit(1);
    }
}

// Start the server
startServer();