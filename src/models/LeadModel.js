export default (sequelize, DataTypes) => {
    const Lead = sequelize.define('Lead', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        lead_id: DataTypes.STRING,
        lead_title: DataTypes.STRING,
        transaction_type: DataTypes.STRING,
        lead_source: DataTypes.STRING,
        source_of_enquiry: DataTypes.STRING,
        rental_duration_months: DataTypes.INTEGER,
        rental_start_date: DataTypes.DATEONLY,
        rental_end_date: DataTypes.DATEONLY,
        lead_date: DataTypes.DATEONLY,
        owner: DataTypes.STRING,
        remarks: DataTypes.TEXT,
        lead_generated_by: DataTypes.STRING,
        is_active: DataTypes.BOOLEAN,
        contact_id: DataTypes.INTEGER,
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    }, {
        tableName: 'leads',
        timestamps: false,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    Lead.associate = (models) => {
        Lead.belongsTo(models.Contact, {
            foreignKey: 'contact_id',
            as: 'contact'
        });

        Lead.belongsToMany(models.Product, {
            through: {
                model: 'lead_products',
                unique: false,
                timestamps: false
            },
            foreignKey: 'lead_id',
            otherKey: 'product_id',
            as: 'products'
        });
    };

    return Lead;
};
