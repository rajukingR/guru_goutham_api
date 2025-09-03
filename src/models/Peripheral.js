export default (sequelize, DataTypes) => {
  const Peripheral = sequelize.define('Peripheral', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    challan_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // ✅ make it optional
    },
    parent_product_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // ✅ make it optional
    },
    approved_date: {
      type: DataTypes.DATE, // ✅ matches MySQL DATE column
      allowNull: true,
    },


    product_name: {
      type: DataTypes.STRING,
    },
    parent_asset_id: {
      type: DataTypes.STRING(100),
    },
    ram: {
      type: DataTypes.STRING(100),
    },
    storage: {
      type: DataTypes.STRING(100),
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
    tableName: 'peripherals',
    timestamps: false,
  });

  Peripheral.associate = (models) => {
    // ✅ Peripheral belongs to DeliveryChallan
    Peripheral.belongsTo(models.DeliveryChallan, {
      foreignKey: 'challan_id',
      as: 'delivery_challan',
    });

    // ✅ Peripheral has many PeripheralItems
    Peripheral.hasMany(models.PeripheralItem, {
      foreignKey: 'peripheral_id',
      as: 'items',
      onDelete: 'CASCADE',
    });
  };

  return Peripheral;
};