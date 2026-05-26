import Campaign from "./Campaign";
import CanvasEdge from "./CanvasEdge";
import CanvasNode from "./CanvasNode";

Campaign.hasMany(CanvasNode, {
  foreignKey: "campaign_id",
  as: "nodes",
});

CanvasNode.belongsTo(Campaign, {
  foreignKey: "campaign_id",
});

Campaign.hasMany(CanvasEdge, {
  foreignKey: "campaign_id",
  as: "edges",
});

CanvasEdge.belongsTo(Campaign, {
  foreignKey: "campaign_id",
});
