// models/Brand.js

export default (sequelize, DataTypes) => {
  const Brand = sequelize.define('Brand', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    brand_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    brand_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    brand_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    active_status: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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
    tableName: 'brands',
    timestamps: false,
    underscored: true,
  });

  return Brand;
};
