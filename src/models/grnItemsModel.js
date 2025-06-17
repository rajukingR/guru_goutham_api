export default (sequelize, DataTypes) => {
  const GRNItem = sequelize.define('GRNItem', {
    grn_item_id: {
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
      type: DataTypes.JSON,
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
  });


GRNItem.associate = (models) => {
  GRNItem.belongsTo(models.GRN, {
    foreignKey: 'grn_id',  // ✅ This matches the column in grn_items table
    as: 'grn'  // Optional: you can name this association if needed
  });
  
  GRNItem.belongsTo(models.ProductTemplete, {
    foreignKey: 'product_id',
    as: 'product'
  });
};


  return GRNItem;
};