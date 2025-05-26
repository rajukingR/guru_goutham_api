export default (sequelize, DataTypes) => {
    const UserDetails = sequelize.define(
      "UserDetails",
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        role: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        department: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        branch: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        country: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        state: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        city: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        active_status: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },
        first_name: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        last_name: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        login_id: {
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: true,
        },
        password: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        email: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: true,
          validate: {
            isEmail: true,
          },
        },
        phone_number: {  
          type: DataTypes.STRING(20),
          allowNull: false,
          unique: true
      },
        pincode: {
          type: DataTypes.STRING(20),
          allowNull: false,
        },
        street: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        landmark: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        joining_date: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        tableName: "users_details",
        timestamps: false,
      }
    );
  
    return UserDetails;
  };
  