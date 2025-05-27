export default (sequelize, DataTypes) => {
    const LeadProduct = sequelize.define('lead_products', {
        lead_id: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },
        product_id: {
            type: DataTypes.INTEGER,
            primaryKey: true
        }
    }, {
        tableName: 'lead_products',
        timestamps: false
    });

    return LeadProduct;
};
