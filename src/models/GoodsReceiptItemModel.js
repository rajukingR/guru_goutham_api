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
    asset_ids: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const raw = this.getDataValue('asset_ids');
        return raw ? JSON.parse(raw) : [];
      },
      set(value) {
        this.setDataValue('asset_ids', JSON.stringify(value));
      }
    }
  }, {
    tableName: 'goods_receipt_items',
    timestamps: false,
  });

  GoodsReceiptItem.associate = (models) => {
    GoodsReceiptItem.belongsTo(models.GoodsReceipt, {
      foreignKey: 'goods_receipt_id',
      targetKey: 'id',
    });
  };

  return GoodsReceiptItem;
};
