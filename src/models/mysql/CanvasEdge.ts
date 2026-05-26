import { DataTypes } from "sequelize";
import db from "../../db/connection";

const CanvasEdge = db.define(
  "CanvasEdges",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },

    campaign_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    source_node_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    target_node_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: false,

    indexes: [
      { fields: ["campaign_id"] },
      { fields: ["source_node_id"] },
      { fields: ["target_node_id"] },
    ],
  },
);

export default CanvasEdge;
