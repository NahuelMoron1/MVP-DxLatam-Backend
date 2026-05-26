import { DataTypes } from "sequelize";
import db from "../../db/connection";

const CanvasNode = db.define(
  "CanvasNodes",
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

    type: {
      type: DataTypes.ENUM("segment", "sms"),
      allowNull: false,
    },

    x: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },

    y: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },

    // para guardar filtros del segment o mensaje del sms
    config: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
    },

    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",

    indexes: [{ fields: ["campaign_id"] }, { fields: ["type"] }],
  },
);

export default CanvasNode;
