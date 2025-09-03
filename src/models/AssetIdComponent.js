export default (sequelize, DataTypes) => {
    const AssetIdComponent = sequelize.define("AssetIdComponent", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        asset_modification_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        asset_id: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        component_type: {
            type: DataTypes.STRING(50), // ram / storage / processor etc.
            allowNull: false,
        },
        type: {
            type: DataTypes.STRING(100), // e.g. DDR3
        },
        brand: {
            type: DataTypes.STRING(100),
        },
        model: {
            type: DataTypes.STRING(100),
        },
        size: {
            type: DataTypes.STRING(50), // e.g. 16GB
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
        tableName: "asset_id_components",
        timestamps: false,
        underscored: true,
    });

    AssetIdComponent.associate = (models) => {
        AssetIdComponent.belongsTo(models.AssetId, {
  foreignKey: "asset_modification_id",
  as: "asset"
});

    };

    return AssetIdComponent;
};
