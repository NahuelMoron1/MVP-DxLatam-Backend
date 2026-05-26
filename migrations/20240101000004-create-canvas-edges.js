'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('CanvasEdges', {
      id: { type: Sequelize.STRING(36), primaryKey: true, allowNull: false },
      campaign_id: {
        type: Sequelize.STRING(36),
        allowNull: false,
        references: { model: 'Campaigns', key: 'id' },
        onDelete: 'CASCADE',
      },
      source_node_id: {
        type: Sequelize.STRING(36),
        allowNull: false,
        references: { model: 'CanvasNodes', key: 'id' },
        onDelete: 'CASCADE',
      },
      target_node_id: {
        type: Sequelize.STRING(36),
        allowNull: false,
        references: { model: 'CanvasNodes', key: 'id' },
        onDelete: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('CanvasEdges', ['campaign_id'], { name: 'idx_canvas_edges_campaign' });
    await queryInterface.addIndex('CanvasEdges', ['source_node_id'], { name: 'idx_canvas_edges_source' });
    await queryInterface.addIndex('CanvasEdges', ['target_node_id'], { name: 'idx_canvas_edges_target' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('CanvasEdges');
  },
};
