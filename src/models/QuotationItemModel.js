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
    // Price Details
    purchase_price: {
      type: DataTypes.DECIMAL(10, 2),
    },
    offer_purchase_price: {
      type: DataTypes.DECIMAL(10, 2),
    },
    // Price Details
    rent_price_per_month: {
      type: DataTypes.DECIMAL(10, 2),
    },
    offer_rent_price_per_month: {
      type: DataTypes.DECIMAL(10, 2),
    },
    device_ids: {
        type: DataTypes.JSON,
        defaultValue: [],
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
    QuotationItem.belongsTo(models.ProductTemplete, {
      foreignKey: 'product_id',
      as: 'product',
    });
    QuotationItem.hasMany(models.GoodsReceiptItem, {
      foreignKey: 'product_id',
      sourceKey: 'product_id',
      as: 'goodsReceiptItems',
    });

  };


  return QuotationItem;
};