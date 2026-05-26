'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Campaigns', {
      id: { type: Sequelize.STRING(36), primaryKey: true, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      status: {
        type: Sequelize.ENUM('draft', 'active'),
        allowNull: false,
        defaultValue: 'draft',
      },
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

    await queryInterface.addIndex('Campaigns', ['status'], { name: 'idx_campaign_status' });
    await queryInterface.addIndex('Campaigns', ['created_at'], { name: 'idx_campaign_created' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Campaigns');
  },
};
