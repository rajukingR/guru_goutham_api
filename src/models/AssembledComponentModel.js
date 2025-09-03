export default (sequelize, DataTypes) => {
    const AssembledComponent = sequelize.define("AssembledComponent", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        assembled_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        component_type: {
            type: DataTypes.STRING,
            allowNull: false
        },
        type: {
            type: DataTypes.STRING
        },
        brand: {
            type: DataTypes.STRING
        },
        model: {
            type: DataTypes.STRING
        },
        size: {
            type: DataTypes.STRING
        },
        frequency_band: {
            type: DataTypes.STRING
        },
        wifi_standard: {
            type: DataTypes.STRING
        },
        wattage: {
            type: DataTypes.STRING
        },
        asset_id: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        }
    }, {
        tableName: "assembled_components",
        timestamps: true, // Enable createdAt and updatedAt
        underscored: true // Use created_at, updated_at
    });

    AssembledComponent.associate = (models) => {
        AssembledComponent.belongsTo(models.AssembledAsset, {
            foreignKey: "assembled_id",
            as: "assembledAsset"
        });
    };

    return AssembledComponent;
};