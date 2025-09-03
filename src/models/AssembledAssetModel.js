export default (sequelize, DataTypes) => {
  const AssembledAsset = sequelize.define("AssembledAsset", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    assembled_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    parent_asset_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    product_image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  }, {
    tableName: "assembled_assets",
    timestamps: true,              // Enable automatic createdAt and updatedAt
    underscored: true              // Use snake_case (created_at, updated_at)
  });

  AssembledAsset.associate = (models) => {
    AssembledAsset.hasMany(models.AssembledComponent, {
      foreignKey: "assembled_id",
      as: "components",
      onDelete: "CASCADE"
    });
  };

  return AssembledAsset;
};
