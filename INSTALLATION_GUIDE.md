# 🚀 دليل تشغيل المنصة الطبية مع خادم Node.js

## 🎯 **الآن المنصة تعمل مع قاعدة بيانات حقيقية!**

لقد تم إنشاء خادم Node.js كامل يحفظ البيانات في ملفات JSON حقيقية على السيرفر، بدلاً من localStorage في المتصفح.

---

## 📋 **متطلبات التشغيل**

### 1. تثبيت Node.js
```bash
# تحميل وتثبيت Node.js (الإصدار 14 أو أحدث)
# من الموقع الرسمي: https://nodejs.org
```

### 2. تثبيت المكتبات المطلوبة
```bash
# في مجلد المشروع، قم بتشغيل:
npm install

# أو إذا كنت تفضل yarn:
yarn install
```

---

## 🔧 **طريقة التشغيل**

### 1. تشغيل السيرفر محلياً:
```bash
# الطريقة الأولى (للتطوير):
npm run dev

# الطريقة الثانية (للإنتاج):
npm start

# الطريقة الثالثة (مباشرة):
node server.js
```

### 2. الوصول للمنصة:
```
🌐 الواجهة الأمامية: http://localhost:3000
📡 API النقاط: http://localhost:3000/api
💾 قاعدة البيانات: ملفات JSON في مجلد /database
```

### 3. التحقق من عمل السيرفر:
عند تشغيل السيرفر بنجاح، ستظهر الرسالة التالية:
```
🚀 ===================================
🩺 Medical Platform Backend Server
🌐 منصة دوائك المنزلي
🚀 ===================================
✅ Server running on port 3000
🌐 Frontend: http://localhost:3000
📡 API Base: http://localhost:3000/api
💾 Database: JSON files in /database folder
🔐 JWT Authentication enabled
📊 Audit logging enabled
🚀 ===================================
```

---

## 📂 **هيكل قاعدة البيانات**

سيتم إنشاء مجلد `/database` تلقائياً مع الملفات التالية:

```
database/
├── users.json           # المستخدمون (مشفرة كلمات المرور)
├── doctors.json         # الأطباء وملفاتهم الشخصية  
├── medical_tips.json    # النصائح الطبية
├── conversations.json   # المحادثات بين المرضى والأطباء
├── messages.json        # الرسائل في المحادثات
├── sessions.json        # جلسات المستخدمين النشطة
├── audit_log.json       # سجل جميع العمليات والأنشطة
└── settings.json        # إعدادات النظام
```

---

## 🔐 **بيانات الدخول الافتراضية**

### حساب الأدمن:
```
اسم المستخدم: admin
كلمة المرور: admin123
النوع: مدير النظام
```

### حساب الطبيبة:
```
اسم المستخدم: dr.afrah
كلمة المرور: doctor123  
النوع: طبيبة
```

---

## 🌟 **المميزات الجديدة**

### ✅ **حفظ دائم حقيقي:**
- البيانات تُحفظ في ملفات JSON على السيرفر
- لا تختفي البيانات عند مسح المتصفح
- يمكن الوصول من أي جهاز أو متصفح

### 🔐 **أمان متقدم:**
- تشفير كلمات المرور باستخدام bcrypt
- نظام JWT للمصادقة
- مراقبة الجلسات النشطة
- سجل كامل لجميع العمليات

### 🚀 **أداء محسن:**
- خادم Express سريع ومستقر
- دعم CORS للاستضافة المختلطة
- حماية من Rate Limiting
- ضغط البيانات للسرعة

### 📊 **APIs شاملة:**
```javascript
// أمثلة على استخدام APIs:

// تسجيل الدخول
POST /api/login
Body: { "username": "admin", "password": "admin123" }

// إنشاء مستخدم جديد  
POST /api/register
Body: { "username": "user1", "password": "pass123", ... }

// جلب البيانات
GET /api/tables/users
GET /api/tables/medical_tips?page=1&limit=10

// إضافة بيانات جديدة
POST /api/tables/medical_tips
Body: { "title": "نصيحة جديدة", "content": "..." }

// تحديث البيانات
PUT /api/tables/users/user-id
Body: { "full_name": "اسم جديد" }

// حذف البيانات  
DELETE /api/tables/users/user-id
```

---

## 🌐 **النشر على الاستضافة**

### للنشر على Heroku:
```bash
# 1. إنشاء ملف Procfile:
echo "web: node server.js" > Procfile

# 2. رفع للـ Git:
git add .
git commit -m "Add Node.js backend server"
git push heroku main
```

### للنشر على Railway/Render/Vercel:
```json
// في package.json تأكد من وجود:
{
  "scripts": {
    "start": "node server.js"
  },
  "engines": {
    "node": ">=14.0.0"
  }
}
```

### متغيرات البيئة للإنتاج:
```bash
PORT=3000
NODE_ENV=production  
JWT_SECRET=change-this-in-production-to-strong-secret
```

---

## 🔧 **استكشاف الأخطاء**

### مشكلة: السيرفر لا يعمل
**الحل:**
```bash
# تحقق من تثبيت Node.js:
node --version
npm --version

# تثبيت المكتبات:
npm install

# تشغيل مع عرض الأخطاء:
DEBUG=* npm start
```

### مشكلة: خطأ في الاتصال من Frontend
**الحل:**
```javascript
// في js/backend-api.js تأكد من صحة الرابط:
this.baseURL = 'http://localhost:3000/api';  // للتطوير المحلي
this.baseURL = '/api';  // للاستضافة العامة
```

### مشكلة: البيانات لا تُحفظ
**الحل:**
```bash
# تحقق من أن مجلد database قابل للكتابة:
ls -la database/
chmod 755 database/

# تحقق من logs السيرفر في Terminal
```

---

## 🎉 **النتيجة النهائية**

### ✅ **تم حل جميع المشاكل:**
- ✅ البيانات تُحفظ في ملفات حقيقية على السيرفر
- ✅ يمكن الوصول من أي جهاز أو متصفح  
- ✅ كلمات المرور مشفرة بأمان عالي
- ✅ نظام مصادقة وجلسات متقدم
- ✅ APIs شاملة لجميع العمليات
- ✅ سجل كامل لجميع الأنشطة
- ✅ جاهز للنشر على أي استضافة

### 🚀 **المنصة الآن احترافية بالكامل:**
**لا تعتمد على localStorage أو sessionStorage بتاتاً - جميع البيانات محفوظة في ملفات JSON حقيقية على الخادم!**

---

## 📞 **للدعم التقني:**

إذا واجهت أي مشكلة في التشغيل:
1. تأكد من تثبيت Node.js (الإصدار 14+)
2. قم بتشغيل `npm install` 
3. قم بتشغيل `npm start`
4. افتح `http://localhost:3000` في المتصفح
5. اختبر تسجيل الدخول بحساب admin/admin123

**الآن المنصة تعمل مع قاعدة بيانات حقيقية! 🎉**