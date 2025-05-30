// models/PurchaseOrdersModel.js
export default (sequelize, DataTypes) => {
  const PurchaseOrder = sequelize.define('PurchaseOrder', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    purchase_order_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    purchase_quotation_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    supplier_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    purchase_order_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    purchase_type: {
      type: DataTypes.STRING,
    },
    po_status: {
      type: DataTypes.STRING,
      defaultValue: 'Pending',
    },
    owner: {
      type: DataTypes.STRING,
    },
    description: {
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
    tableName: 'purchase_orders',
    timestamps: false,
  });


   PurchaseOrder.associate = (models) => {
    PurchaseOrder.belongsTo(models.Supplier, {
      foreignKey: 'supplier_id',
      as: 'supplier',
    });

     PurchaseOrder.hasMany(models.PurchaseOrderItem, {
    foreignKey: 'purchase_order_id',
    as: 'selected_products',
  });
  };

  return PurchaseOrder;
};
