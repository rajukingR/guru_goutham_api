export default (sequelize, DataTypes) => {
    const AssetId = sequelize.define('AssetId', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        invoice_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        asset_id: {
            type: DataTypes.STRING, // Note: Should be DataTypes.STRING (typo in your original code)
            allowNull: false
        },
        product_name: {
            type: DataTypes.STRING
        },
        ram: {
            type: DataTypes.STRING
        },
        storage: {
            type: DataTypes.STRING
        },
        new_ram: {
            type: DataTypes.STRING
        },
        new_storage: {
            type: DataTypes.STRING
        },
        processor: {
            type: DataTypes.STRING
        },
        os: {
            type: DataTypes.STRING
        },
        graphics: {
            type: DataTypes.STRING
        },
        disk_type: {
            type: DataTypes.STRING
        },
        brand: {
            type: DataTypes.STRING
        },
        model: {
            type: DataTypes.STRING
        },
        grade: {
            type: DataTypes.STRING
        },
        screen_size: {
            type: DataTypes.STRING
        },
        resolution: {
            type: DataTypes.STRING
        },
        brightness: {
            type: DataTypes.STRING
        },
        power_consumption: {
            type: DataTypes.STRING
        },
        display_device: {
            type: DataTypes.STRING
        },
        audio_output: {
            type: DataTypes.STRING
        },
        weight: {
            type: DataTypes.STRING
        },
        color: {
            type: DataTypes.STRING
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'asset_ids',
        timestamps: false,
        underscored: true
    });

    AssetId.associate = (models) => {
        AssetId.belongsTo(models.Invoice, {
            foreignKey: 'invoice_id',
            as: 'invoice'
        });

        AssetId.belongsTo(models.ProductTemplete, {
            foreignKey: 'product_id',
            as: 'product'
        });
    };

    return AssetId;
};