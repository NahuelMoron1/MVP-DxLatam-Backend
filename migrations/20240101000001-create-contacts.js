'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Contacts', {
      id: { type: Sequelize.STRING(36), primaryKey: true, allowNull: false },
      first_name: { type: Sequelize.STRING, allowNull: false },
      last_name: { type: Sequelize.STRING, allowNull: false },
      phone: { type: Sequelize.STRING(50), allowNull: false },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      country: { type: Sequelize.STRING(100), allowNull: false },
      city: { type: Sequelize.STRING(100), allowNull: false },
      status: {
        type: Sequelize.ENUM('ACTIVE', 'INACTIVE'),
        allowNull: false,
        defaultValue: 'ACTIVE',
      },
      attributes: { type: Sequelize.JSON, allowNull: true },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.addIndex('Contacts', ['country'], { name: 'idx_contacts_country' });
    await queryInterface.addIndex('Contacts', ['status'], { name: 'idx_contacts_status' });
    await queryInterface.addIndex('Contacts', ['created_at'], { name: 'idx_contacts_created' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Contacts');
  },
};
