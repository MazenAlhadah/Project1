require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const YAML = require('yamljs');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const { sequelize } = require('./models');
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const purchaseRoutes = require('./routes/purchases');
const userRoutes = require('./routes/users');
const settingsRoutes = require('./routes/settings');
const courseRoutes = require('./routes/courses');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));

// CORS
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Swagger docs
try {
  const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customSiteTitle: 'منصة معادلات الهندسة - API Docs',
    customCss: `
      .swagger-ui .topbar { background-color: #1a1f3c; }
      body { font-family: 'Cairo', sans-serif; }
    `,
  }));
} catch (e) {
  console.log('Swagger docs not loaded:', e.message);
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/courses', courseRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'المسار غير موجود' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'حدث خطأ في الخادم',
  });
});

// Start server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ اتصال قاعدة البيانات ناجح');
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('✅ تزامن قاعدة البيانات ناجح');
    app.listen(PORT, () => {
      console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
      console.log(`📖 Swagger docs: http://localhost:${PORT}/api/docs`);
    });
  } catch (error) {
    console.error('❌ فشل بدء الخادم:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
