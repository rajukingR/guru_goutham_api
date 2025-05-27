export default (sequelize, DataTypes) => {
    const OrderAddress = sequelize.define('OrderAddress', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        order_id: DataTypes.INTEGER,
        street: DataTypes.STRING,
        landmark: DataTypes.STRING,
        pincode: DataTypes.STRING,
        city: DataTypes.STRING,
        state: DataTypes.STRING,
        country: DataTypes.STRING,
    }, {
        tableName: 'order_addresses',
        timestamps: false,
    });

    return OrderAddress;
};