const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Book = sequelize.define('Book', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: { notEmpty: true },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: { min: 0 },
  },
  cover_image_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  cover_image_public_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  file_url: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Cloudinary authenticated URL - لا يُعطى للطالب مباشرة',
  },
  file_public_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Cloudinary public_id لتوليد signed URL',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'books',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Book;
