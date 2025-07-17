export default (sequelize, DataTypes) => {
  const GRNItem = sequelize.define('GRNItem', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    grn_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    product_name: {
      type: DataTypes.STRING,
    },
    device_ids: {
      type: DataTypes.TEXT,
      get() {
        const rawValue = this.getDataValue('device_ids');

        if (!rawValue) return [];

        // If already an array
        if (Array.isArray(rawValue)) {
          return rawValue.map((id) => String(id).trim());
        }

        // If it's a string
        if (typeof rawValue === 'string') {
          try {
            const parsed = JSON.parse(rawValue);
            if (Array.isArray(parsed)) {
              return parsed.map((id) => String(id).trim());
            }
            return rawValue.split(',').map((id) => id.trim());
          } catch {
            return rawValue.split(',').map((id) => id.trim());
          }
        }

        return [];
      },
      set(value) {
        this.setDataValue(
          'device_ids',
          Array.isArray(value) ? JSON.stringify(value) : value
        );
      }
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
  }, {
    tableName: 'grn_items',
    timestamps: false,
    underscored: true,
  });

  GRNItem.associate = (models) => {
    GRNItem.belongsTo(models.GRN, {
      foreignKey: 'grn_id',
      as: 'grn',
    });

    GRNItem.belongsTo(models.ProductTemplete, {
      foreignKey: 'product_id',
      as: 'product',
    });
  };

  return GRNItem;
};
