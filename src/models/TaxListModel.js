// src/models/TaxListModel.js

export default (sequelize, DataTypes) => {
  const TaxList = sequelize.define('TaxList', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    tax_code: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    tax_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'tax_list',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return TaxList;
};
