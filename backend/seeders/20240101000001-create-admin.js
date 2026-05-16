const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    const password_hash = await bcrypt.hash('Admin@2024!', 12);
    await queryInterface.bulkInsert('users', [{
      id: require('uuid').v4(),
      first_name: 'مدير',
      second_name: 'النظام',
      third_name: 'الرئيسي',
      fourth_name: 'للمنصة',
      national_id: null,
      email: 'admin@platform.com',
      password_hash,
      role: 'admin',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    }]);

    // إعدادات افتراضية
    await queryInterface.bulkInsert('settings', [{
      id: 1,
      whatsapp_number: '201234567890',
      support_phone: '01234567890',
      support_email: 'support@platform.com',
      platform_name: 'منصة معادلات الهندسة',
      updated_at: new Date(),
    }]);
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { role: 'admin' });
    await queryInterface.bulkDelete('settings', { id: 1 });
  },
};
