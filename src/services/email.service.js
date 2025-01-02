const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const config = require('../config/config');
const logger = require('../config/logger');
const { User } = require('../models/user.model');
const { convertTemplateToMessage, getMessageTemplateByTitle } = require('./message_template.service');

const transport = nodemailer.createTransport(config.email.smtp);
/* istanbul ignore next */
if (config.env !== 'test') {
  transport
    .verify()
    .then(() => logger.info('Connected to email server'))
    .catch(() => logger.warn('Unable to connect to email server. Make sure you have configured the SMTP options in .env'));
}

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @returns {Promise}
 */
const sendEmail = async (to, subject, text) => {
  try {
    const msg = { from: config.email.from, to, subject, text };
    await transport.sendMail(msg);
  } catch (error) {
    logger.info(error);
  }
};

/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (to, token) => {
  // get email template
  const {
    dataValues: { emailSubject, emailBody },
  } = await getMessageTemplateByTitle('Reset_Password');

  // get user information
  const user = await User.findOne({ where: { email: to } });
  // replace the placeholders with the actual values
  const text = await convertTemplateToMessage(emailBody, {
    firstName: user.dataValues.firstName,
    token,
  });

  await sendEmail(to, emailSubject, text);
};

/**
 * Send verification email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendVerificationEmail = async (to, token) => {
  const subject = 'Email Verification';
  // replace this url with the link to the email verification page of your front-end app
  const verificationEmailUrl = `${process.env.FRONTEND_URL}?token=${token}`;
  const text = `Dear user,
To verify your email, click on this link: ${verificationEmailUrl}
If you did not create an account, then ignore this email.`;
  await sendEmail(to, subject, text);
};

module.exports = {
  transport,
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
};
