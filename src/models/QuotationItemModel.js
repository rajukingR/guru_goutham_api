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
    requested_quantity: {
      type: DataTypes.INTEGER,
    },
    quotation_quantity: {
      type: DataTypes.INTEGER,
    },
    rental_price_per_piece: {
      type: DataTypes.DECIMAL(10, 2),
    },
    remark: {
      type: DataTypes.TEXT,
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

  return QuotationItem;
};
