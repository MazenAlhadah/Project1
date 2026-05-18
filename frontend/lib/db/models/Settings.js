const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize').default || require('../sequelize');

const Settings = sequelize.define('Settings', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    defaultValue: 1,
  },
  whatsapp_number: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: '',
  },
  support_phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  support_email: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  platform_name: {
    type: DataTypes.STRING(255),
    defaultValue: 'منصة معادلات الهندسة',
  },
}, {
  tableName: 'settings',
  timestamps: true,
  updatedAt: 'updated_at',
  createdAt: false,
});

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  cover_image_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  cover_image_public_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  coming_soon: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'courses',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = { Settings, Course };
