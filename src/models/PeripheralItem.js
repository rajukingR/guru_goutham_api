export default (sequelize, DataTypes) => {
  const PeripheralItem = sequelize.define('PeripheralItem', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    peripheral_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    asset_id: {
      type: DataTypes.STRING(100),
    },
    device_id: {
      type: DataTypes.STRING(100),
    },
    product_category: {
      type: DataTypes.STRING(100),
    },
    brand: {
      type: DataTypes.STRING,
    },
    model: {
      type: DataTypes.STRING,
    },
    specifications: {
      type: DataTypes.STRING,
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    purchase_price: {
      type: DataTypes.DECIMAL(12, 2),
    },
     rent_price_per_month: {
      type: DataTypes.DECIMAL(12, 2),
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'peripheral_items',
    timestamps: false,
  });

  PeripheralItem.associate = (models) => {
    // ✅ PeripheralItem belongs to Peripheral
    PeripheralItem.belongsTo(models.Peripheral, {
      foreignKey: 'peripheral_id',
      as: 'peripheral',
    });

    // ✅ PeripheralItem belongs to ProductTemplete
    PeripheralItem.belongsTo(models.ProductTemplete, {
      foreignKey: 'product_id',
      as: 'product',
    });
  };

  return PeripheralItem;
};
