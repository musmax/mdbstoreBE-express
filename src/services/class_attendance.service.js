const httpStatus = require('http-status');
const { Op } = require('sequelize');
const ApiError = require('../utils/ApiError');
const { ClassUser } = require('../models/class_user.model');
const { ClassAttendance } = require('../models/attendance.model');
const { SchoolClass } = require('../models/class.model');
const { SchoolSession } = require('../models/school_session.model');
const { School } = require('../models/school.model');
const { SchoolSessionTerm } = require('../models/school_session_term.model');
const { SchoolTermBreak } = require('../models/school_term_break.model');
const { SchoolTermActivity } = require('../models/school_term_activities.model');

/**
 * @typedef {Object} AttendanceObject
 * @property {string} dateOfMarking - .the day of the attendance marking
 * @property {number} teacherId - .the class teacher
 * @property {number} studentId - .the student of the class
 * @property {number} classId - .the class the attendance is meant for
 * @property {string} isPresent - .the flag indicating if a student is absent or present
 * @property {string} standInMarker - .another employee of the school that can mark attendance for the class
 */

/**
 * Instantiate a new company
 * @param {Object} AttendanceBody
 * @param {number} AttendanceBody.teacherId
 * @param {number} AttendanceBody.studentId
 * @param {number} AttendanceBody.classId
 * @param {date} AttendanceBody.dateOfMarking
 * @returns {Promise<CompanyObject>}
 */
const markAttendance = async (AttendanceBody) => {
  const { dateOfMarking, studentRecords, teacherId, classId, standInMarker } = AttendanceBody;
  const existingClass = await SchoolClass.findByPk(classId);
  // Ensure that the class teacher is assigned to this class
  const validateTeacher = await ClassUser.findOne({ where: { classId, teacherId } });
  if (!validateTeacher) {
    throw new ApiError(httpStatus.NOT_FOUND, 'This teacher is not assigned to this class');
  }
  // To Do: preventing of marking attendance for a student not in a particular class
  // Check if attendance has already been marked for the given date
  const existingRecords = await ClassAttendance.findAll({ where: { dateOfMarking } });
  const newRecord = studentRecords.flatMap((record) => record.studentId);
  if (existingRecords.length === newRecord.length) {
    throw new ApiError(
      httpStatus.NOT_ACCEPTABLE,
      'You already mark attendance for this set of students for this particular day'
    );
  }
  const existingStudentIds = new Set(existingRecords.map((record) => record.studentId));
  // Filter out student records that don't already have an attendance record for the given date
  const newStudentRecords = studentRecords.filter((record) => !existingStudentIds.has(record.studentId));
  // Create attendance records for new student records
  const promisesArray = newStudentRecords.map(async (record) => {
    // Create the attendance
    await ClassAttendance.create({
      dateOfMarking,
      teacherId,
      classId,
      standInMarker,
      schoolId: existingClass.schoolId,
      studentId: record.studentId,
      isPresent: record.isPresent,
    });
  });
  await Promise.all(promisesArray);
  return {
    message: 'Attendance marked successfully',
    status: httpStatus.OK,
  };
};

/**
 * Query class attendance
 */
const queryClassAttendance = async (filter, current) => {
  const { startDate, endDate, studentId, teacherId, schoolId, classId } = filter;
  const options = {
    page: current.page,
    paginate: current.limit,
    attributes: ['id', 'isPresent', 'dateOfMarking'],
    where: {
      ...(schoolId && { schoolId: { [Op.like]: `%${schoolId}%` } }),
      ...(classId && { classId: { [Op.like]: `%${classId}%` } }),
      ...(studentId && { studentId: { [Op.like]: `%${studentId}%` } }),
      ...(teacherId && { teacherId: { [Op.like]: `%${teacherId}%` } }),
      ...(startDate && endDate && { createdAt: { [Op.between]: [startDate, endDate] } }),
    },
    include: [
      { association: 'student_attendance', attributes: ['id', 'firstName', 'lastName', 'profileImage'] },
      // { association: 'class_teacher_attendance', attributes: ['id', 'firstName', 'lastName', 'profileImage'] },
      // { association: 'attendance_class', attributes: ['id', 'name'] },
      { association: 'stand_in_marker', attributes: ['id', 'firstName', 'lastName', 'profileImage'] },
    ],
  };
  // Ensure that paginate is not included in the where clause
  delete options.where.paginate;

  const { docs, pages, total } = await ClassAttendance.paginate(options);
  return {
    status: true,
    data: {
      class_attendances: docs,
      pagination: {
        totalPages: Number(pages),
        totalResults: total,
        page: Number(current.page),
        paginate: current.limit,
      },
    },
  };
};

/**
 * get attendance for a particular student
 */
const getAttendance = async (id) => {
  return ClassAttendance.findByPk(id);
};

/**
 * Update an attendance
 */
const updateAttendance = async (id, body) => {
  const recordExist = await getAttendance(id);
  if (!recordExist) throw new ApiError(httpStatus.NOT_FOUND, 'No Attendance Record Found');
  Object.assign(recordExist, body);
  await recordExist.save();
  return recordExist;
};

/**
 * create a session for a school
 */
const createSession = async (body) => {
  const { schoolId } = body;
  const schoolExist = await School.findByPk(schoolId);
  if (!schoolExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'School not found');
  }
  const sessionRecord = await SchoolSession.create({ body, schoolId });
  return sessionRecord;
};

/**
 * get a session
 */
const getSession = async (id) => {
  const session = await SchoolSession.findOne({
    where: { id },
    include: [
      {
        association: 'school_session_terms',
        attributes: ['id', 'title'],
        include: [
          {
            association: 'school_term_activities',
          },
          {
            association: 'school_term_breaks',
          },
        ],
      },
    ],
  });
  if (!session) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Session Not Found!');
  }
  return session;
};

/**
 * get all sessions for your school
 */
const querySchoolSession = async (filter, current) => {
  const { schoolId } = filter;
  const options = {
    page: current.page,
    paginate: current.limit,
    attributes: ['id', 'isPresent', 'dateOfMarking'],
    where: {
      ...(schoolId && { schoolId: { [Op.like]: `%${schoolId}%` } }),
    },
  };
  // Ensure that paginate is not included in the where clause
  delete options.where.paginate;

  const { docs, pages, total } = await SchoolSession.paginate(options);
  return {
    status: true,
    data: {
      school_sessions: docs,
      pagination: {
        totalPages: Number(pages),
        totalResults: total,
        page: Number(current.page),
        paginate: current.limit,
      },
    },
  };
};

/**
 * update a session
 */
const updateSession = async (id, body) => {
  //  Check if the id exists
  const recordExist = await getSession(id);
  Object.assign(recordExist, body);
  recordExist.save();
  return recordExist;
};

/**
 * update a session
 */
const deactivateSession = async (id) => {
  //  Check if the id exists
  const recordExist = await getSession(id);
  return recordExist.update({ isActive: false });
};

/**
 * create a session term
 */
const createSessionTerm = async (body) => {
  const { sessionId, schoolBreak, schoolActivity } = body;
  // lets get the session
  const session = await getSession(sessionId);
  const term = SchoolSessionTerm.create({ ...body, sessionId: session.id });
  if (schoolBreak) {
    await Promise.all(schoolBreak.map((item) => SchoolTermBreak.create({ ...item, termId: term.id })));
  }
  if (schoolActivity) {
    await Promise.all(schoolActivity.map((item) => SchoolTermActivity.create({ ...item, termId: term.id })));
  }
  return term;
};

/**
 * query term per session
 */
const querySessionTerm = async (filter, current) => {
  const { sessionId, title } = filter;
  const options = {
    page: current.page,
    paginate: current.limit,
    attributes: ['id', 'isPresent', 'dateOfMarking'],
    where: {
      ...(sessionId && { sessionId: { [Op.like]: `%${sessionId}%` } }),
      ...(title && { title: { [Op.like]: `%${title}%` } }),
    },
  };
  // Ensure that paginate is not included in the where clause
  delete options.where.paginate;
  const { docs, pages, total } = await SchoolSessionTerm.paginate(options);
  return {
    status: true,
    data: {
      school_terms: docs,
      pagination: {
        totalPages: Number(pages),
        totalResults: total,
        page: Number(current.page),
        paginate: current.limit,
      },
    },
  };
};

/**
 * get a term
 */
const fetchtermById = async (id) => {
  const term = SchoolSessionTerm.findByPk(id, {
    include: [
      {
        association: 'school_term_activities',
      },
      {
        association: 'school_term_breaks',
      },
    ],
  });
  if (!term) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Term not found');
  }
};

/**
 * update a term
 */
const updateSessionTerm = async (id, body) => {
  let term = await fetchtermById(id);
  term = await SchoolSessionTerm.update(body, { where: { id } });
  term = await fetchtermById(id);
  return term;
};

/**
 * deactivate a term
 */
const deactivateTerm = async (id) => {
  const term = await fetchtermById(id);
  return term.update({ isActive: false });
};

/**
 * create a session term activity for a school
 */
const createTermActivity = async (body) => {
  const { termId } = body;
  const termExist = await fetchtermById(termId);
  // create the term activity
  return SchoolTermActivity.create({ ...body, termId: termExist.id });
};

/**
 * get a session
 */
const getTermActivity = async (id) => {
  const term = await SchoolTermActivity.findOne({
    where: { id },
  });
  if (!term) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Term activity Not Found!');
  }
  return term;
};

/**
 * get all sessions term actiity for your school
 */
const querySchoolTermActivity = async (filter, current) => {
  const { termId } = filter;
  const options = {
    page: current.page,
    paginate: current.limit,
    where: {
      ...(termId && { termId: { [Op.like]: `%${termId}%` } }),
    },
  };
  // Ensure that paginate is not included in the where clause
  delete options.where.paginate;
  const { docs, pages, total } = await SchoolTermActivity.paginate(options);
  return {
    status: true,
    data: {
      school_term_activities: docs,
      pagination: {
        totalPages: Number(pages),
        totalResults: total,
        page: Number(current.page),
        paginate: current.limit,
      },
    },
  };
};

/**
 * update a session term activity
 */
const updateTermActivity = async (id, body) => {
  //  Check if the id exists
  const recordExist = await getTermActivity(id);
  Object.assign(recordExist, body);
  recordExist.save();
  return recordExist;
};

/**
 * delete a session term activity
 */
const deleteTermActivity = async (id) => {
  //  Check if the id exists
  const recordExist = await getTermActivity(id);
  await recordExist.destroy();
  return recordExist;
};

/**
 * create a session term break for a school
 */
const createTermBreak = async (body) => {
  const { termId } = body;
  const termExist = await fetchtermById(termId);
  // create the term activity
  return SchoolTermBreak.create({ ...body, termId: termExist.id });
};

/**
 * get a session
 */
const getTermBreak = async (id) => {
  const term = await SchoolTermBreak.findOne({
    where: { id },
  });
  if (!term) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Term break Not Found!');
  }
  return term;
};

/**
 * get all sessions term break for your school
 */
const querySchoolTermBreak = async (filter, current) => {
  const { termId } = filter;
  const options = {
    page: current.page,
    paginate: current.limit,
    where: {
      ...(termId && { termId: { [Op.like]: `%${termId}%` } }),
    },
  };
  // Ensure that paginate is not included in the where clause
  delete options.where.paginate;
  const { docs, pages, total } = await SchoolTermBreak.paginate(options);
  return {
    status: true,
    data: {
      school_term_breaks: docs,
      pagination: {
        totalPages: Number(pages),
        totalResults: total,
        page: Number(current.page),
        paginate: current.limit,
      },
    },
  };
};

/**
 * update a session term activity
 */
const updateTermBreak = async (id, body) => {
  //  Check if the id exists
  const recordExist = await getTermBreak(id);
  Object.assign(recordExist, body);
  recordExist.save();
  return recordExist;
};

/**
 * delete a session term activity
 */
const deleteTermBreak = async (id) => {
  //  Check if the id exists
  const recordExist = await getTermBreak(id);
  await recordExist.destroy();
  return recordExist;
};
module.exports = {
  queryClassAttendance,
  markAttendance,
  updateAttendance,
  getAttendance,
  createSession,
  updateSession,
  getSession,
  createSessionTerm,
  fetchtermById,
  updateSessionTerm,
  createTermActivity,
  getTermActivity,
  updateTermActivity,
  deleteTermActivity,
  createTermBreak,
  getTermBreak,
  updateTermBreak,
  deleteTermBreak,
  deactivateSession,
  deactivateTerm,
  querySchoolSession,
  querySessionTerm,
  querySchoolTermActivity,
  querySchoolTermBreak,
};
