export default (sequelize, DataTypes) => {
  const PurchaseQuotation = sequelize.define('PurchaseQuotation', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    purchase_quotation_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    purchase_request_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    supplier_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    purchase_quotation_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    purchase_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    po_quotation_status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Pending',
    },
    owner: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    selected_products: {
      type: DataTypes.JSON,
      allowNull: true,
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
    tableName: 'purchase_quotations',
    timestamps: false,
  });

PurchaseQuotation.associate = (models) => {
  PurchaseQuotation.belongsTo(models.Supplier, {
    foreignKey: 'supplier_id',
    as: 'supplier', // <-- Must match with controller include
  });
};


  return PurchaseQuotation;
};
