export default (sequelize, DataTypes) => {
    const Order = sequelize.define('Order', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        order_id: DataTypes.STRING,
        order_title: DataTypes.STRING,
        quotation_id: DataTypes.INTEGER,
        transaction_type: DataTypes.STRING,
        payment_type: DataTypes.STRING,
        order_status: DataTypes.STRING,
        source_of_entry: DataTypes.STRING,
        owner: DataTypes.STRING,
        remarks: DataTypes.TEXT,
        order_generated_by: DataTypes.STRING,
        rental_duration: DataTypes.INTEGER,
        rental_duration_days: DataTypes.INTEGER,
        rental_start_date: DataTypes.DATE,
        rental_end_date: DataTypes.DATE,
        order_date: DataTypes.DATE,
        contact_status: DataTypes.BOOLEAN,
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        source_of_entry: {
            type: DataTypes.STRING,
            allowNull: true
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
    }, {
        tableName: 'orders',
        timestamps: false,
    });



    Order.associate = models => {
        Order.hasMany(models.OrderItem, {
            foreignKey: 'order_id',
            as: 'items'
        });
        Order.hasOne(models.OrderAddress, {
            foreignKey: 'order_id',
            as: 'address'
        });
        Order.hasOne(models.OrderPersonalDetail, {
            foreignKey: 'order_id',
            as: 'personalDetails'
        });
    };


    return Order;
};