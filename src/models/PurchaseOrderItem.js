export default (sequelize, DataTypes) => {
  const PurchaseOrderItem = sequelize.define('PurchaseOrderItem', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    purchase_order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    product_id: DataTypes.INTEGER,
    quantity: DataTypes.INTEGER,
  }, {
    tableName: 'purchase_order_items',
    timestamps: false,
    underscored: true,
  });

  PurchaseOrderItem.associate = (models) => {
    PurchaseOrderItem.belongsTo(models.PurchaseOrder, {
      foreignKey: 'purchase_order_id',
      as: 'purchase_order',
    });
     PurchaseOrderItem.belongsTo(models.Product, {
      foreignKey: 'product_id',
      as: 'product' // optional
    });
  };

  return PurchaseOrderItem;
};
