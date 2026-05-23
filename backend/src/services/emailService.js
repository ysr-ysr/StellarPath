const nodemailer = require('nodemailer');
const { createHttpError } = require('../utils/httpError');

function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw createHttpError('SMTP configuration is incomplete.', 500);
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

function buildEvaluationEmail({ type, candidate, job, evaluation }) {
  const candidateName = candidate.name || 'Candidate';
  const jobTitle = job.title || 'the role';
  //const companyName = job.company || 'our company';
  const companyName ='StellarPath';

  if (type === 'accepted') {
    return {
      subject: `Next step for your ${jobTitle} application`,
      text: [
        `Hello ${candidateName},`,
        '',
        `Thank you for applying for ${jobTitle} at ${companyName}.`,
        'We are pleased to invite you to the next recruitment stage.',
        '',
        `Evaluation score: ${evaluation.overall_score}/100`,
        `Recommendation: ${evaluation.recommendation}`,
        '',
        'Best regards,',
        companyName,
      ].join('\n'),
    };
  }

  return {
    subject: `Update on your ${jobTitle} application`,
    text: [
      `Hello ${candidateName},`,
      '',
      `Thank you for applying for ${jobTitle} at ${companyName}.`,
      'After reviewing your application, we will not be moving forward at this time.',
      'We appreciate your interest and wish you success in your job search.',
      '',
      'Best regards,',
      companyName,
    ].join('\n'),
  };
}

async function sendEvaluationEmail({ type, candidate, job, evaluation }) {
  const normalizedType = String(type || '').trim().toLowerCase();

  if (!['accepted', 'rejected'].includes(normalizedType)) {
    throw createHttpError('type must be either accepted or rejected.', 400);
  }

  if (!candidate.email) {
    throw createHttpError('Candidate email address was not found.', 400);
  }

  const transporter = getTransporter();
  const email = buildEvaluationEmail({
    type: normalizedType,
    candidate,
    job,
    evaluation,
  });

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: candidate.email,
    subject: email.subject,
    text: email.text,
  });

  return {
    messageId: info.messageId,
    type: normalizedType,
    to: candidate.email,
  };
}

module.exports = {
  sendEvaluationEmail,
};
