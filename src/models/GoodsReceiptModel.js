export default (sequelize, DataTypes) => {
  const GoodsReceipt = sequelize.define('GoodsReceipt', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    goods_receipt_id: { type: DataTypes.STRING, allowNull: false, unique: true },
    vendor_invoice_number: { type: DataTypes.STRING },
    purchase_order_id: { type: DataTypes.STRING, allowNull: false },
    supplier_id: { type: DataTypes.INTEGER, allowNull: false },
    purchase_order_status: { type: DataTypes.STRING, defaultValue: 'Pending' },
    goods_receipt_date: { type: DataTypes.DATEONLY, allowNull: false },
    purchase_type: { type: DataTypes.STRING },
    goods_receipt_status: {
      type: DataTypes.ENUM('Scheduled', 'Partial Delivery', 'Delivered'),
      defaultValue: 'Scheduled',
    },
    description: { type: DataTypes.TEXT },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'goods_receipts',
    timestamps: false,
  });

  return GoodsReceipt;
};
