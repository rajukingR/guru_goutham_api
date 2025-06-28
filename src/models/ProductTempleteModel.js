export default (sequelize, DataTypes) => {
  const ProductTemplete = sequelize.define('ProductTemplete', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    category_id: {
      type: DataTypes.INTEGER,
    },
    product_category: {
      type: DataTypes.STRING(100),
    },
    product_id: {
      type: DataTypes.STRING(50),
    },
    product_name: {
      type: DataTypes.STRING(100),
    },
    product_image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    brand: {
      type: DataTypes.STRING(100),
    },
    grade: {
      type: DataTypes.STRING(50),
    },
    model: {
      type: DataTypes.STRING(100),
    },
    pro_model: {
      type: DataTypes.STRING(100),
    },
    st_number: {
      type: DataTypes.STRING(100),
    },
    stock_location: {
      type: DataTypes.STRING(100),
    },
    description: {
      type: DataTypes.TEXT,
    },

    // Specifications
    ram: {
      type: DataTypes.STRING(50),
    },
    disk_type: {
      type: DataTypes.STRING(50),
    },
    processor: {
      type: DataTypes.STRING(100),
    },
    storage: {
      type: DataTypes.STRING(50),
    },
    graphics: {
      type: DataTypes.STRING(100),
    },
    os: {
      type: DataTypes.STRING(100),
    },
    mouse: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    keyboard: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    dvd: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    speaker: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    webcam: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    // Monitor-specific fields
    display_device: {
      type: DataTypes.STRING(100),
    },
    power_consumption: {
      type: DataTypes.STRING(100),
    },
    resolution: {
      type: DataTypes.STRING(100),
    },
    brightness: {
      type: DataTypes.STRING(100),
    },
    screen_size: {
      type: DataTypes.STRING(100),
    },
    color: {
      type: DataTypes.STRING(100),
    },
    audio_output: {
      type: DataTypes.STRING(100),
    },
    weight: {
      type: DataTypes.STRING(100),
    },

    // Price Details
    purchase_price: {
      type: DataTypes.DECIMAL(10, 2),
    },
    rent_percent_per_day: {
      type: DataTypes.DECIMAL(5, 2),
    },
    rent_price_per_day: {
      type: DataTypes.DECIMAL(10, 2),
    },
    rent_percent_per_month: {
      type: DataTypes.DECIMAL(5, 2),
    },
    rent_price_per_month: {
      type: DataTypes.DECIMAL(10, 2),
    },
    rent_percent_6_months: {
      type: DataTypes.DECIMAL(5, 2),
    },
    rent_price_6_months: {
      type: DataTypes.DECIMAL(10, 2),
    },
    rent_percent_1_year: {
      type: DataTypes.DECIMAL(5, 2),
    },
    rent_price_1_year: {
      type: DataTypes.DECIMAL(10, 2),
    },

    // Control
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

   
 }, {
  tableName: 'products_templete',
  timestamps: true, // ✅ enable Sequelize timestamps
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});


 ProductTemplete.associate = (models) => {
  ProductTemplete.hasMany(models.LeadProduct, {
    foreignKey: 'product_id',
    as: 'lead_products'
  });
  ProductTemplete.hasMany(models.OrderItem, {
  foreignKey: 'product_id',
  as: 'order_items'
});

};


  return ProductTemplete;
};
