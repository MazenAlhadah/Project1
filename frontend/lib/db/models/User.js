const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize').default || require('../sequelize');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  first_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: { notEmpty: true },
  },
  second_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: { notEmpty: true },
  },
  third_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: { notEmpty: true },
  },
  fourth_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: { notEmpty: true },
  },
  national_id: {
    type: DataTypes.STRING(14),
    allowNull: true,
    unique: true,
    validate: {
      len: [14, 14],
      isNumeric: true,
    },
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true,
    validate: { isEmail: true },
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  id_card_image_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  id_card_public_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  role: {
    type: DataTypes.ENUM('student', 'employee', 'admin'),
    defaultValue: 'student',
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'active', 'rejected'),
    defaultValue: 'pending',
    allowNull: false,
  },
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = User;
