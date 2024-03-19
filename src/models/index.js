const { User } = require('./user.model');
const { Role } = require('./role.model');
const { Permission } = require('./permission.model');
const { MessageTemplate } = require('./message_template.model');
const { Variable } = require('./variable.model');
const { Token } = require('./token.model');
const { Media } = require('./media.model');
const { School } = require('./school.model');
const { SchoolStudents } = require('./school_students.model');
const { SchoolClass } = require('./class.model');
const { ClassUser } = require('./class_user.model');
const { SchoolEmployee } = require('./school_employee.model');

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

  // User as principal - School
  User.hasMany(School, { foreignKey: 'createdBy', as: 'school_owner' });
  School.belongsTo(User, { foreignKey: 'createdBy', as: 'school_owner' });

  // User - Media
  User.hasMany(Media, { foreignKey: 'userId', as: 'media' });
  Media.belongsTo(User, { foreignKey: 'userId', as: 'media' });

  School.hasMany(SchoolClass, { foreignKey: 'schoolId', as: 'school_classes' });
  SchoolClass.belongsTo(School, { foreignKey: 'schoolId', as: 'school_classes' });

  SchoolClass.hasMany(ClassUser, { foreignKey: 'classId', as: 'class_users' });
  ClassUser.belongsTo(SchoolClass, { foreignKey: 'classId', as: 'class_users' });

  User.hasMany(ClassUser, { foreignKey: 'studentId', as: 'class_students' });
  ClassUser.belongsTo(User, { foreignKey: 'studentId', as: 'class_students' });

  User.hasMany(ClassUser, { foreignKey: 'teacherId', as: 'class_teachers' });
  ClassUser.belongsTo(User, { foreignKey: 'teacherId', as: 'class_teachers' });

  User.hasOne(ClassUser, { foreignKey: 'classCaptainId', as: 'class_captain' });
  ClassUser.belongsTo(User, { foreignKey: 'classCaptainId', as: 'class_captain' });

  User.belongsToMany(School, { through: SchoolStudents, foreignKey: 'school_id', as: 'schoool_students' });
  School.belongsToMany(User, { through: SchoolStudents, foreignKey: 'studentId', as: 'schoool_students' });

  // School - SchoolEmployee
  User.belongsToMany(School, { through: SchoolEmployee, foreignKey: 'employeeId', as: 'school_employees' });
  School.belongsToMany(User, { through: SchoolEmployee, foreignKey: 'school_id', as: 'school_employees' });
};