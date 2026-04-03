export default (sequelize, DataTypes) => {
  const Supplier = sequelize.define(
    'Supplier',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      supplier_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },


      supplier_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      supplier_owner: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      gst_number: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },

      introduced_by: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // ✅ JSON COLUMNS
      address: {
        type: DataTypes.JSON,
        allowNull: true,
      },

      bank: {
        type: DataTypes.JSON,
        allowNull: true,
      },

      contacts: {
        type: DataTypes.JSON,
        allowNull: true,
      },

      // ✅ TIMESTAMPS
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },

      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'suppliers',

      // ✅ Enable timestamps with custom column names
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  // ✅ ASSOCIATION
  Supplier.associate = models => {
    Supplier.hasMany(models.PurchaseQuotation, {
      foreignKey: 'supplier_id',
      as: 'quotations',
    });
  };

  return Supplier;
};
