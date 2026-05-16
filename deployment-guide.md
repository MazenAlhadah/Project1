# دليل النشر على VPS — منصة معادلات الهندسة

## المتطلبات الأساسية

- **Ubuntu 22.04 LTS** على VPS (DigitalOcean / Hetzner)
- **Docker + Docker Compose** v2
- **دومين** مُشار إلى IP السيرفر
- **SSL** عبر Let's Encrypt

---

## 1. إعداد السيرفر

```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# تثبيت Docker Compose v2
sudo apt install docker-compose-plugin -y
docker compose version

# تثبيت Certbot لـ SSL
sudo apt install certbot -y
```

---

## 2. رفع المشروع

```bash
# على الجهاز المحلي — ضغط المشروع
zip -r engineering-platform.zip engineering-platform/ --exclude "*/node_modules/*" --exclude "*/.next/*"

# رفعه على السيرفر
scp engineering-platform.zip root@YOUR_VPS_IP:/opt/
ssh root@YOUR_VPS_IP

# فك الضغط
cd /opt && unzip engineering-platform.zip
cd engineering-platform
```

---

## 3. إعداد متغيرات البيئة

```bash
# انسخ ملف المتغيرات
cp .env.example .env
nano .env
```

عدّل القيم التالية:
```env
DB_PASSWORD=كلمة_سر_قوية_جداً
JWT_ACCESS_SECRET=سلسلة_عشوائية_طويلة_جداً_32_حرف_على_الأقل
JWT_REFRESH_SECRET=سلسلة_أخرى_مختلفة_32_حرف_على_الأقل
CLOUDINARY_CLOUD_NAME=اسم_الـcloud_name_من_cloudinary
CLOUDINARY_API_KEY=مفتاح_cloudinary
CLOUDINARY_API_SECRET=سر_cloudinary
GMAIL_USER=ايميلك@gmail.com
GMAIL_APP_PASSWORD=xxxx_xxxx_xxxx_xxxx
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
```

---

## 4. الحصول على SSL Certificate

```bash
# أوقف أي شيء يشغل البورت 80
sudo systemctl stop nginx 2>/dev/null || true

# اطلب الشهادة
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# الشهادات ستكون في
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

---

## 5. إعداد Nginx

```bash
# انسخ شهادات SSL لمجلد المشروع
mkdir -p nginx/ssl
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/

# عدّل nginx.conf لاستبدال yourdomain.com بدومينك الفعلي
sed -i 's/yourdomain.com/YOUR_ACTUAL_DOMAIN/g' nginx/nginx.conf
```

---

## 6. تشغيل المشروع

```bash
# بناء وتشغيل كل الخدمات (production)
docker compose --profile production up -d --build

# مراقبة السجلات
docker compose logs -f backend
docker compose logs -f frontend

# التحقق من الحالة
docker compose ps
```

---

## 7. تهيئة قاعدة البيانات

```bash
# إضافة أول أدمن
docker compose exec backend npm run seed:admin

# التحقق من الاتصال
docker compose exec backend node -e "require('./src/config/database').authenticate().then(() => console.log('✅ Connected'))"
```

**بيانات الأدمن الأولي:**
- Email: `admin@platform.com`
- Password: `Admin@2024!`
- **⚠️ غير كلمة السر فوراً بعد أول دخول!**

---

## 8. تجديد SSL تلقائياً

```bash
# إضافة cron job
sudo crontab -e

# أضف هذا السطر
0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/yourdomain.com/*.pem /opt/engineering-platform/nginx/ssl/ && docker compose -f /opt/engineering-platform/docker-compose.yml --profile production restart nginx
```

---

## 9. النسخ الاحتياطي

```bash
# نسخ احتياطي لقاعدة البيانات
docker compose exec postgres pg_dump -U engadmin engineering_platform > backup_$(date +%Y%m%d).sql

# جدولة نسخ احتياطي يومي
sudo crontab -e
# أضف:
0 2 * * * docker compose -f /opt/engineering-platform/docker-compose.yml exec -T postgres pg_dump -U engadmin engineering_platform > /backups/db_$(date +\%Y\%m\%d).sql
```

---

## 10. أوامر مفيدة

```bash
# إعادة تشغيل خدمة محددة
docker compose restart backend

# تحديث المشروع
git pull origin main  # أو رفع ملفات جديدة
docker compose --profile production up -d --build

# الدخول لقاعدة البيانات
docker compose exec postgres psql -U engadmin -d engineering_platform

# فحص السجلات
docker compose logs --tail=100 -f backend
```

---

## التحقق من النشر

| الاختبار | العنوان |
|----------|---------|
| الصحة | `https://yourdomain.com/health` |
| API Docs | `https://yourdomain.com/api/docs` |
| الواجهة | `https://yourdomain.com/login` |

---

## تشغيل محلي بدون Docker

```bash
# Backend
cd backend
npm install
# أنشئ .env من .env.example وعدّل القيم
npm run dev

# Frontend (في terminal آخر)
cd frontend
npm install
npm run dev

# تشغيل PostgreSQL محلياً
# إنشاء database باسم engineering_platform
```
