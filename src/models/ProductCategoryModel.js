export default (sequelize, DataTypes) => {
  const ProductCategory = sequelize.define('ProductCategory', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    category_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    category_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    hsn_code: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    category_type: {
      type: DataTypes.ENUM('Standalone', 'Other'),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.TINYINT(1),
      defaultValue: 1,
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
    tableName: 'product_categories',
    timestamps: false,
  });

  return ProductCategory;
};
