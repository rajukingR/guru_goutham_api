export default (sequelize, DataTypes) => {
  const OrderItem = sequelize.define('OrderItem', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    order_id: DataTypes.INTEGER,
    product_id: DataTypes.INTEGER,
    requested_quantity: DataTypes.INTEGER,
    product_name: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'order_products',
    timestamps: false,
  });

 OrderItem.associate = models => {
    OrderItem.belongsTo(models.Order, {
      foreignKey: 'order_id',
      as: 'order'
    });
    OrderItem.belongsTo(models.ProductTemplete, {
  foreignKey: 'product_id',
  as: 'product'
});

  };

  return OrderItem;
};
