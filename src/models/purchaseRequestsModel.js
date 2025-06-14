export default (sequelize, DataTypes) => {
  const PurchaseRequest = sequelize.define('PurchaseRequest', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    purchase_request_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    purchase_request_date: {
      type: DataTypes.DATEONLY,
    },
    purchase_type: {
      type: DataTypes.STRING(50),
    },
    purchase_request_status: {
      type: DataTypes.STRING(50),
    },
    owner: {
      type: DataTypes.STRING(100),
    },
    supplier_id: {
      type: DataTypes.INTEGER,
    },
    description: {
      type: DataTypes.TEXT,
    },

    selected_products: {
      type: DataTypes.JSON,
    },
    total_requested_quantity: {
      type: DataTypes.INTEGER,
      allowNull: true, // Optional, default is true when not specified
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
    tableName: 'purchase_requests',
    timestamps: false,
  });

  PurchaseRequest.associate = models => {
    PurchaseRequest.hasMany(models.PurchaseRequestItem, {
      foreignKey: 'purchase_request_id',
      as: 'items',
    });

    // A purchase request belongs to a supplier
    PurchaseRequest.belongsTo(models.Supplier, {
      foreignKey: 'supplier_id',
      as: 'supplier',
    });
  };

  return PurchaseRequest;
};