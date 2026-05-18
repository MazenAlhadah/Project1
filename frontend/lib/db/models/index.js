const sequelize = require('../sequelize');
const User = require('./User');
const Book = require('./Book');
const Purchase = require('./Purchase');
const { PasswordResetToken, RefreshToken } = require('./Tokens');
const { Settings, Course } = require('./Settings');

// User → Purchase (طالب اشترى كتب)
User.hasMany(Purchase, { foreignKey: 'user_id', as: 'purchases' });
Purchase.belongsTo(User, { foreignKey: 'user_id', as: 'buyer' });

// Book → Purchase (الكتاب له مشتريات)
Book.hasMany(Purchase, { foreignKey: 'book_id', as: 'purchases' });
Purchase.belongsTo(Book, { foreignKey: 'book_id', as: 'book' });

// Employee confirmed purchase
User.hasMany(Purchase, { foreignKey: 'confirmed_by', as: 'confirmed_purchases' });
Purchase.belongsTo(User, { foreignKey: 'confirmed_by', as: 'confirmedBy' });

// User → Tokens
User.hasMany(PasswordResetToken, { foreignKey: 'user_id', as: 'resetTokens' });
PasswordResetToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'refreshTokens' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  User,
  Book,
  Purchase,
  PasswordResetToken,
  RefreshToken,
  Settings,
  Course,
};
