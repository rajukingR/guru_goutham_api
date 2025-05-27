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
        phone: DataTypes.STRING,
        company_name: DataTypes.STRING,
        industry: DataTypes.STRING,
    }, {
        tableName: 'order_customers',
        timestamps: false,
    });

    return OrderPersonalDetail;
};