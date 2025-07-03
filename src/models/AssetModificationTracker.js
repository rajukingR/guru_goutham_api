export default (sequelize, DataTypes) => {
    const AssetModificationTracker = sequelize.define('AssetModificationTracker', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        // Customer Information
        customer_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        customer_name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },

        // Invoice Information
        invoice_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        invoice_number: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        invoice_date: {
            type: DataTypes.DATE,
            allowNull: false
        },

        // Asset Information
        asset_id: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        product_name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        brand: {
            type: DataTypes.STRING(50)
        },
        model: {
            type: DataTypes.STRING(100)
        },

        // Hardware Specifications
        ram: {
            type: DataTypes.STRING(20),
            comment: 'Current RAM (e.g., "16GB")'
        },
        new_ram: {
            type: DataTypes.STRING(20),
            comment: 'Modified RAM'
        },
        storage: {
            type: DataTypes.STRING(20),
            comment: 'Current Storage (e.g., "256GB")'
        },
        new_storage: {
            type: DataTypes.STRING(20),
            comment: 'Modified Storage'
        },
        processor: {
            type: DataTypes.STRING(50)
        },
        os: {
            type: DataTypes.STRING(50)
        },
        graphics: {
            type: DataTypes.STRING(100)
        },
        disk_type: {
            type: DataTypes.STRING(20)
        },
        grade: {
            type: DataTypes.STRING(10)
        },

        // Modification Details
        modification_type: {
            type: DataTypes.STRING(100)
        },
        reason: {
            type: DataTypes.TEXT,
            comment: 'Reason for modification'
        },

        // Request & Approval
        requested_by: {
            type: DataTypes.STRING(100)
        },
        approved_by: {
            type: DataTypes.STRING(100)
        },
        request_date: {
            type: DataTypes.DATE
        },
        approval_date: {
            type: DataTypes.DATE
        },
        estimated_cost: {
            type: DataTypes.DECIMAL(10, 2)
        },
        new_ram_cost: {
            type: DataTypes.DECIMAL(10, 2)
        },
        new_storage_cost: {
            type: DataTypes.DECIMAL(10, 2)
        },
        status: {
            type: DataTypes.STRING(50)
        },
        remarks: {
            type: DataTypes.TEXT
        },
        active_status: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },

        // Timestamps
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'asset_modification_tracker',
        timestamps: false,
        underscored: true
    });

    return AssetModificationTracker;
};