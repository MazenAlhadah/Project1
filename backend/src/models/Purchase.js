const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Purchase = sequelize.define('Purchase', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE',
  },
  book_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'books', key: 'id' },
    onDelete: 'CASCADE',
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'rejected'),
    defaultValue: 'pending',
    allowNull: false,
  },
  requested_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  confirmed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  confirmed_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'users', key: 'id' },
  },
}, {
  tableName: 'purchases',
  timestamps: false,
});

module.exports = Purchase;
