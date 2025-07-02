export default (sequelize, DataTypes) => {
  const QuotationItem = sequelize.define('QuotationItem', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    quotation_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quotation_quantity: {
      type: DataTypes.INTEGER,
    },
    product_name: {
      type: DataTypes.STRING,
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
    tableName: 'quotation_items',
    timestamps: false,
  });


  // Define association
  QuotationItem.associate = (models) => {
    QuotationItem.belongsTo(models.Quotation, {
      foreignKey: 'quotation_id',
      as: 'quotation',
    });
    QuotationItem.hasMany(models.GoodsReceiptItem, {
  foreignKey: 'product_id',
  sourceKey: 'product_id',
  as: 'goodsReceiptItems',
});

  };


  return QuotationItem;
};