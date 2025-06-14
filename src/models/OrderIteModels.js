export default (sequelize, DataTypes) => {
  const OrderItem = sequelize.define(
    'OrderItem',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      order_id: DataTypes.INTEGER,
      product_id: DataTypes.INTEGER,
      requested_quantity: DataTypes.INTEGER,
      product_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      device_ids: {
        type: DataTypes.TEXT,
        get() {
          const rawValue = this.getDataValue('device_ids');
          return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
          this.setDataValue('device_ids', JSON.stringify(value));
        },
      },
    },
    {
      tableName: 'order_products',
      timestamps: false,
    }
  );

  OrderItem.associate = (models) => {
    OrderItem.belongsTo(models.Order, { foreignKey: 'order_id' });
  };

  return OrderItem;
};
