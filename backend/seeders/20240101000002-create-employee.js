const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    const password_hash = await bcrypt.hash('Employee@2024!', 12);
    await queryInterface.bulkInsert('users', [{
      id: require('uuid').v4(),
      first_name: 'محمد',
      second_name: 'الموظف',
      third_name: '-',
      fourth_name: '-',
      national_id: null,
      email: 'employee@platform.com',
      password_hash,
      role: 'employee',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    }]);
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { email: 'employee@platform.com' });
  },
};
