export default (sequelize, DataTypes) => {
    const AssetTransaction = sequelize.define('AssetTransaction', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        customer_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        parent_asset_id: {
            type: DataTypes.STRING,
            allowNull: false
        },
        asset_id: {
            type: DataTypes.STRING,
            allowNull: false
        },
        size: {
            type: DataTypes.STRING
        },
        action_date: {
            type: DataTypes.DATE,
            allowNull: false
        },
        // Item Details
        item_name: {
            type: DataTypes.STRING
        },
        specification: {
            type: DataTypes.STRING
        },
        item_type: {
            type: DataTypes.STRING
        },
        price: {
            type: DataTypes.DECIMAL(10, 2)
        },
        // ✅ ENUM column for Added / Removed
        status: {
            type: DataTypes.ENUM('Added', 'Removed'),
            allowNull: false
        },
        credit_note_id: {
            type: DataTypes.INTEGER,
            allowNull: true, // ✅ allow null
            references: {
                model: 'credit_notes', // table name
                key: 'id'
            },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE'
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
        tableName: 'asset_transactions',
        timestamps: false, // We’re handling created_at / updated_at manually
        underscored: true
    });

    // 🔗 Associations
    AssetTransaction.associate = (models) => {


        AssetTransaction.belongsTo(models.ProductTemplete, {
            foreignKey: 'product_id',
            as: 'product'
        });

    };

    return AssetTransaction;
};