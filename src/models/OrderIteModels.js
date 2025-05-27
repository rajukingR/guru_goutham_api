export default (sequelize, DataTypes) => {
    const OrderItem = sequelize.define('OrderItem', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        order_id: DataTypes.INTEGER,
        product_id: DataTypes.INTEGER,
        requested_quantity: DataTypes.INTEGER,
        quotation_quantity: DataTypes.INTEGER,
        rental_price_per_piece: DataTypes.DECIMAL(10, 2),
        remark: DataTypes.TEXT,
    }, {
        tableName: 'order_products',
        timestamps: false,
    });

    return OrderItem;
};