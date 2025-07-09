export default (sequelize, DataTypes) => {
  const DispatchOrderItem = sequelize.define('DispatchOrderItem', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    dispatch_order_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    product_id: {
      type: DataTypes.INTEGER
    },
    product_name: {
      type: DataTypes.STRING(255)
    },
    quantity: {
      type: DataTypes.INTEGER
    },
    total_price: {
      type: DataTypes.DECIMAL(10, 2)
    },
    device_ids: {
      type: DataTypes.JSON
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'dispatch_order_items',
    timestamps: false
  });

    DispatchOrderItem.associate = (models) => {
    DispatchOrderItem.belongsTo(models.DispatchOrder, {
      foreignKey: 'dispatch_order_id',
      as: 'dispatchOrder'
    });
  };
  
  return DispatchOrderItem;
};
