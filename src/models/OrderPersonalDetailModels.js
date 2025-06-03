export default (sequelize, DataTypes) => {
    const OrderPersonalDetail = sequelize.define('OrderPersonalDetail', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        order_id: DataTypes.INTEGER,
        first_name: DataTypes.STRING,
        last_name: DataTypes.STRING,
        email: DataTypes.STRING,
        phone_number: DataTypes.STRING,
        gst_number: {
            type: DataTypes.STRING
        }
    }, {
        tableName: 'order_customers',
        timestamps: false,
    });

    OrderPersonalDetail.associate = models => {
        OrderPersonalDetail.belongsTo(models.Order, {
            foreignKey: 'order_id'
        });
    };

    return OrderPersonalDetail;
};