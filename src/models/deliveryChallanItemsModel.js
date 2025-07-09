export default (sequelize, DataTypes) => {
  const DeliveryChallanItem = sequelize.define('DeliveryChallanItem', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    challan_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.INTEGER,
    },
    product_name: {
      type: DataTypes.STRING,
    },
    quantity: {
      type: DataTypes.INTEGER,
    },
    unit_price: {
      type: DataTypes.DECIMAL(10, 2),
    },
    total_price: {
      type: DataTypes.DECIMAL(12, 2),
    },
    device_ids: {
      type: DataTypes.TEXT,
      get() {
        const rawValue = this.getDataValue('device_ids');
        try {
          return rawValue ? JSON.parse(rawValue) : [];
        } catch (err) {
          console.warn("Failed to parse device_ids:", rawValue);
          return [];
        }
      },
      set(value) {
        // 🛑 Prevent double encoding
        if (typeof value === "string") {
          try {
            // If it's already a stringified array, parse it first
            const parsed = JSON.parse(value);
            this.setDataValue('device_ids', JSON.stringify(parsed));
          } catch {
            this.setDataValue('device_ids', "[]"); // fallback to empty
          }
        } else {
          this.setDataValue('device_ids', JSON.stringify(value || []));
        }
      },
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
    tableName: 'delivery_challan_items',
    timestamps: false,
  });

  DeliveryChallanItem.associate = (models) => {
    DeliveryChallanItem.belongsTo(models.DeliveryChallan, {
      foreignKey: 'challan_id',
      as: 'challan',
    });

    DeliveryChallanItem.belongsTo(models.ProductTemplete, {
      foreignKey: 'product_id',
      as: 'product',
    });
  };

  return DeliveryChallanItem;
};