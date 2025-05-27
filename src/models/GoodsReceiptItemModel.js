export default (sequelize, DataTypes) => {
  const GoodsReceiptItem = sequelize.define('GoodsReceiptItem', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    goods_receipt_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    product_name: {
      type: DataTypes.STRING
    },
    quantity: {
      type: DataTypes.INTEGER
    },
    price_per_unit: {
      type: DataTypes.DECIMAL(10, 2)
    },
    gst_percentage: {
      type: DataTypes.DECIMAL(5, 2)
    },
    total_price: {
      type: DataTypes.DECIMAL(12, 2)
    },
  }, {
    tableName: 'goods_receipt_items',
    timestamps: false,
  });

  return GoodsReceiptItem;
};