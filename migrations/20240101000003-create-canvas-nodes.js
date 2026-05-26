'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('CanvasNodes', {
      id: { type: Sequelize.STRING(36), primaryKey: true, allowNull: false },
      campaign_id: {
        type: Sequelize.STRING(36),
        allowNull: false,
        references: { model: 'Campaigns', key: 'id' },
        onDelete: 'CASCADE',
      },
      type: {
        type: Sequelize.ENUM('segment', 'sms'),
        allowNull: false,
      },
      x: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 0 },
      y: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 0 },
      config: { type: Sequelize.JSON, allowNull: false, defaultValue: {} },
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
    });

    await queryInterface.addIndex('CanvasNodes', ['campaign_id'], { name: 'idx_canvas_nodes_campaign' });
    await queryInterface.addIndex('CanvasNodes', ['type'], { name: 'idx_canvas_nodes_type' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('CanvasNodes');
  },
};
