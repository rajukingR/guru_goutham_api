export default (sequelize, DataTypes) => {
  const PurchaseRequestItem = sequelize.define('PurchaseRequestItem', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    purchase_request_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  }, {
    tableName: 'purchase_request_items',
    timestamps: false,
  });

  PurchaseRequestItem.associate = models => {
    // Each item belongs to one purchase request
    PurchaseRequestItem.belongsTo(models.PurchaseRequest, {
      foreignKey: 'purchase_request_id',
      as: 'purchaseRequest',
    });

    // Each item has one product
    PurchaseRequestItem.belongsTo(models.ProductTemplete, {
      foreignKey: 'product_id',
      as: 'product',
    });
  };

  return PurchaseRequestItem;
};
