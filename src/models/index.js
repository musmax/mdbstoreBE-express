const { User } = require('./user.model');
const { Role } = require('./role.model');
const { Permission } = require('./permission.model');
const { MessageTemplate } = require('./message_template.model');
const { Variable } = require('./variable.model');
const { Token } = require('./token.model');
const { Category } = require('./category.model');
const {Product} = require('./product.model');
const { ProductImages } = require('./productImage.model');
const { Wallet } = require('./wallet.model');
const { Transaction } = require('./transaction.model');
const { Order } = require('./order.model');
const { Rating } = require('./rating.model');

exports.association = () => {
  // User - Token
  User.hasOne(Token, { foreignKey: 'userId', as: 'userToken' });
  Token.belongsTo(User, { foreignKey: 'userId', as: 'userToken' });

  // Role - Permission
  Role.belongsToMany(Permission, { through: 'role_permission' });
  Permission.belongsToMany(Role, { through: 'role_permission' });

  // // User - Role
  User.belongsToMany(Role, { through: 'user_role' });
  Role.belongsToMany(User, { through: 'user_role' });

  // User - Role | part 2
  Role.hasMany(User, { foreignKey: 'roleId', as: 'userRole' });
  User.belongsTo(Role, { foreignKey: 'roleId', as: 'userRole' });

  // Message Template - Variable
  MessageTemplate.belongsToMany(Variable, { through: 'message_variable' });
  Variable.belongsToMany(MessageTemplate, { through: 'message_variable' });

  // User - Message Template
  User.belongsToMany(MessageTemplate, { through: 'user_message_template' });
  MessageTemplate.belongsToMany(User, { through: 'user_message_template' });


  /**
   * Ecommer mgt
   */

  // Product - Category
  Product.belongsToMany(Category, { through: 'product_category' });
  Category.belongsToMany(Product, { through: 'product_category' });

  // Product - User
  Product.hasOne(User, { foreignKey: 'createdBy', as: 'product_creator' });
  User.belongsTo(Product, { foreignKey: 'createdBy', as: 'product_creator' });

  // Product - Product Image
  Product.hasMany(ProductImages, { foreignKey: 'productId', as: 'product_images' });
  ProductImages.belongsTo(Product, { foreignKey: 'productId', as: 'product_images' });

  // Wallet - user
  User.hasOne(Wallet, { foreignKey: 'userId', as: 'user_wallet' });
  Wallet.belongsTo(User, { foreignKey: 'userId', as: 'user_wallet' });

  // User - Transaction
  User.hasMany(Transaction, { foreignKey: 'userId', as: 'user_transactions' });
  Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user_transactions' });

  // Order - Transaction
  Order.hasMany(Transaction, { foreignKey: 'orderId', as: 'order_transactions' });
  Transaction.belongsTo(Order, { foreignKey: 'orderId', as: 'order_transactions' });

  // Order - User
  Order.hasOne(User, { foreignKey: 'userId', as: 'order_user' });
  User.belongsTo(Order, { foreignKey: 'userId', as: 'order_user' });

  // Order - Product
  Order.belongsToMany(Product, { through: 'order_product' });
  Product.belongsToMany(Order, { through: 'order_product' });

  // Rating - Product
  Product.hasMany(Rating, { foreignKey: 'productId', as: 'product_ratings' });
  Rating.belongsTo(Product, { foreignKey: 'productId', as: 'product_ratings' });

};
