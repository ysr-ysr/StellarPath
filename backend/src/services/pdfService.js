const fs = require('fs');
const os = require('os');
const path = require('path');
const PDFDocument = require('pdfkit');
const { normalizeArrayField, formatInlineList } = require('../utils/arrayFields');

const PDF_DIR = path.join(os.tmpdir(), 'stellarpath-cv');
const FONT_REGULAR = 'Helvetica';
const FONT_BOLD = 'Helvetica-Bold';

const COLOR_PRIMARY = '#1e293b';
const COLOR_ACCENT = '#1e40af';
const COLOR_MUTED = '#64748b';
const COLOR_RULE = '#94a3b8';
const COLOR_RULE_LIGHT = '#e2e8f0';
const FALLBACK_SUMMARY =
  'Professional summary unavailable. Add more profile details, skills, and projects to improve this section.';

function normalizeText(value) {
  return value
    ? String(value)
      .replace(/<\/?FINAL_SUMMARY>/gi, '')
      .replace(/<\/?TEMP>/gi, '')
      .replace(/<\/?PLACEHOLDER>/gi, '')
      .replace(/<\/?[^>]+>/g, '')
      .replace(/[{}[\]"]/g, '')
      .trim()
    : '';
}

function normalizeAchievements(value) {
  return normalizeArrayField(value);
}

function contentBounds(doc) {
  const startX = doc.page.margins.left;
  const endX = doc.page.width - doc.page.margins.right;
  return { startX, endX, width: endX - startX };
}

function drawHorizontalRule(doc, y, color = COLOR_RULE_LIGHT, lineWidth = 0.75) {
  const { startX, endX } = contentBounds(doc);

  doc
    .save()
    .moveTo(startX, y)
    .lineTo(endX, y)
    .lineWidth(lineWidth)
    .strokeColor(color)
    .stroke()
    .restore()
    .strokeColor(COLOR_PRIMARY)
    .fillColor(COLOR_PRIMARY);
}

function addSectionTitle(doc, title) {
  const { startX, width } = contentBounds(doc);

  doc.moveDown(1.1);

  doc
    .font(FONT_BOLD)
    .fontSize(10)
    .fillColor(COLOR_ACCENT)
    .text(title.toUpperCase(), startX, doc.y, {
      width,
      align: 'left',
      characterSpacing: 0.6,
    });

  const lineY = doc.y + 5;
  drawHorizontalRule(doc, lineY, COLOR_ACCENT, 1.2);
  doc.y = lineY + 12;
}

function addHeaderDivider(doc) {
  const lineY = doc.y + 10;
  drawHorizontalRule(doc, lineY, COLOR_RULE_LIGHT, 0.75);
  doc.y = lineY + 14;
}

function addBullet(doc, text) {
  const normalizedText = normalizeText(text);

  if (!normalizedText) {
    return;
  }

  const { startX, width } = contentBounds(doc);
  const bulletX = startX + 8;
  const textWidth = width - 8;

  doc
    .font(FONT_REGULAR)
    .fontSize(9.3)
    .fillColor(COLOR_PRIMARY)
    .text('\u2022', startX, doc.y, { continued: false, width: 8 })
    .text(normalizedText, bulletX, doc.y - doc.currentLineHeight(), {
      width: textWidth,
      lineGap: 2,
    });
}

function buildContactLine(candidate) {
  return [
    candidate.phone,
    candidate.email,
    candidate.linkedin,
    candidate.github,
    candidate.location,
  ]
    .filter(Boolean)
    .join('  |  ');
}

function addSummary(doc, summary) {
  addSectionTitle(doc, 'Professional Summary');

  const { startX, width } = contentBounds(doc);

  doc
    .font(FONT_REGULAR)
    .fontSize(9.5)
    .fillColor(COLOR_PRIMARY)
    .text(normalizeText(summary) || FALLBACK_SUMMARY, startX, doc.y, {
      width,
      lineGap: 3,
      align: 'left',
    });
}

function addSkills(doc, skills) {
  addSectionTitle(doc, 'Skills');

  const { startX, width } = contentBounds(doc);

  if (!skills || skills.length === 0) {
    doc
      .font(FONT_REGULAR)
      .fontSize(9.5)
      .fillColor(COLOR_MUTED)
      .text('No skills added yet.', startX, doc.y, {
        width,
        lineGap: 3,
      });
    return;
  }

  const skillsByCategory = skills.reduce((groups, skill) => {
    const category = skill.category || 'Other';

    if (!groups[category]) {
      groups[category] = [];
    }

    normalizeArrayField(skill.name).forEach((name) => groups[category].push(name));
    return groups;
  }, {});

  Object.entries(skillsByCategory).forEach(([category, names]) => {
    doc
      .font(FONT_BOLD)
      .fontSize(9.2)
      .fillColor(COLOR_ACCENT)
      .text(`${category}: `, startX, doc.y, {
        continued: true,
        width,
      })
      .font(FONT_REGULAR)
      .fillColor(COLOR_PRIMARY)
      .text([...new Set(names.map(normalizeText).filter(Boolean))].join(' \u2022 '), {
        lineGap: 3,
      });
  });
}

function addProjects(doc, projects) {
  addSectionTitle(doc, 'Projects');

  const { startX, width } = contentBounds(doc);

  if (!projects || projects.length === 0) {
    doc
      .font(FONT_REGULAR)
      .fontSize(9.5)
      .fillColor(COLOR_MUTED)
      .text('No projects available.', startX, doc.y, {
        width,
        lineGap: 3,
      });
    return;
  }

  projects.forEach((project, index) => {
    if (index > 0) {
      doc.moveDown(0.65);
    }

    doc
      .font(FONT_BOLD)
      .fontSize(10.2)
      .fillColor(COLOR_PRIMARY)
      .text(normalizeText(project.name), startX, doc.y, { width });

    const techStack = formatInlineList(
      project.tech_stack || project.technologies || project.skills,
      ' \u2022 '
    );

    if (techStack) {
      doc.moveDown(0.15);
      doc
        .font(FONT_BOLD)
        .fontSize(9.1)
        .fillColor(COLOR_MUTED)
        .text('Tech Stack: ', startX, doc.y, {
          continued: true,
          width,
        })
        .font(FONT_REGULAR)
        .fillColor(COLOR_PRIMARY)
        .text(techStack, {
          lineGap: 2,
        });
    }

    if (project.description) {
      doc.moveDown(0.1);
      doc
        .font(FONT_REGULAR)
        .fontSize(9.2)
        .fillColor(COLOR_PRIMARY)
        .text(normalizeText(project.description), startX, doc.y, {
          width,
          lineGap: 2,
        });
    }

    const achievements = [
      ...normalizeAchievements(project.achievements),
      ...normalizeAchievements(project.key_achievements),
    ];

    if (achievements.length > 0) {
      doc.moveDown(0.15);
      doc
        .font(FONT_BOLD)
        .fontSize(9.1)
        .fillColor(COLOR_MUTED)
        .text('Achievements:', startX, doc.y, { width });
    }

    [...new Set(achievements.map(normalizeText).filter(Boolean))].forEach((achievement) => {
      doc.moveDown(0.08);
      addBullet(doc, achievement);
    });
  });
}

function normalizeProjectForPdf(project) {
  return {
    ...project,
    name: normalizeText(project.name),
    description: normalizeText(project.description),
    tech_stack: normalizeArrayField(project.tech_stack || project.technologies || project.skills),
    key_achievements: [
      ...normalizeArrayField(project.achievements),
      ...normalizeArrayField(project.key_achievements),
    ],
  };
}

function normalizeSkillForPdf(skill) {
  return {
    ...skill,
    category: normalizeText(skill.category) || 'Other',
    name: normalizeArrayField(skill.name),
  };
}

function validateNoDatabaseArtifacts(label, value) {
  const text = String(value || '');

  if (/[{}[\]]/.test(text) || /<\/?FINAL_SUMMARY>/i.test(text)) {
    throw new Error(`Malformed resume data in ${label}.`);
  }
}

function sanitizeResumeData({ candidate, summary, skills, projects, education }) {
  const cleanCandidate = {
    ...candidate,
    name: normalizeText(candidate.name),
    title: normalizeText(candidate.title),
    phone: normalizeText(candidate.phone),
    email: normalizeText(candidate.email),
    linkedin: normalizeText(candidate.linkedin),
    github: normalizeText(candidate.github),
    location: normalizeText(candidate.location),
  };
  const cleanSummary = normalizeText(summary);
  const cleanSkills = (skills || []).map(normalizeSkillForPdf);
  const cleanProjects = (projects || []).map(normalizeProjectForPdf);
  const cleanEducation = (education || []).map((item) => ({
    ...item,
    school: normalizeText(item.school),
    diploma: normalizeText(item.diploma),
  }));

  validateNoDatabaseArtifacts('summary', cleanSummary);
  validateNoDatabaseArtifacts('candidate name', cleanCandidate.name);
  validateNoDatabaseArtifacts('candidate title', cleanCandidate.title);
  cleanSkills.forEach((skill, index) => {
    validateNoDatabaseArtifacts(`skill ${index + 1} category`, skill.category);
    skill.name.forEach((item) => validateNoDatabaseArtifacts(`skill ${index + 1}`, item));
  });
  cleanProjects.forEach((project, index) => {
    validateNoDatabaseArtifacts(`project ${index + 1} name`, project.name);
    validateNoDatabaseArtifacts(`project ${index + 1} description`, project.description);
    project.tech_stack.forEach((item) => validateNoDatabaseArtifacts(`project ${index + 1} tech stack`, item));
    project.key_achievements.forEach((item) => validateNoDatabaseArtifacts(`project ${index + 1} achievement`, item));
  });

  return {
    candidate: cleanCandidate,
    summary: cleanSummary,
    skills: cleanSkills,
    projects: cleanProjects,
    education: cleanEducation,
  };
}

function addEducation(doc, education) {
  if (!education || education.length === 0) {
    return;
  }

  addSectionTitle(doc, 'Education');

  const { startX, width } = contentBounds(doc);

  education.forEach((item, index) => {
    if (index > 0) {
      doc.moveDown(0.35);
    }

    doc
      .font(FONT_BOLD)
      .fontSize(9.6)
      .fillColor(COLOR_PRIMARY)
      .text(normalizeText(item.school), startX, doc.y, { width });

    if (item.diploma) {
      doc
        .font(FONT_REGULAR)
        .fontSize(9.2)
        .fillColor(COLOR_MUTED)
        .text(normalizeText(item.diploma), startX, doc.y, {
          width,
          lineGap: 2,
        });
    }
  });
}

async function ensurePdfDirectory() {
  await fs.promises.mkdir(PDF_DIR, {
    recursive: true,
  });
}

async function generateResumePdf({ candidate, summary, skills, projects, education }) {
  if (!candidate || !candidate.name) {
    throw new Error('Candidate data is required to generate a resume PDF.');
  }

  const sanitized = sanitizeResumeData({
    candidate,
    summary,
    skills,
    projects,
    education,
  });

  await ensurePdfDirectory();

  const safeName = sanitized.candidate.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  const fileName = `${safeName || 'candidate'}-${Date.now()}-resume.pdf`;
  const filePath = path.join(PDF_DIR, fileName);

  const doc = new PDFDocument({
    size: 'LETTER',
    margin: 52,
    info: {
      Title: `${sanitized.candidate.name} Resume`,
      Author: sanitized.candidate.name,
      Subject: 'ATS-friendly resume generated by StellarPath',
    },
  });

  const output = fs.createWriteStream(filePath);
  doc.pipe(output);

  const { startX, width } = contentBounds(doc);

  doc
    .font(FONT_BOLD)
    .fontSize(20)
    .fillColor(COLOR_PRIMARY)
    .text(sanitized.candidate.name.toUpperCase(), startX, doc.y, {
      width,
      align: 'center',
      characterSpacing: 0.8,
    });

  if (sanitized.candidate.title) {
    doc.moveDown(0.35);
    doc
      .font(FONT_REGULAR)
      .fontSize(10.5)
      .fillColor(COLOR_ACCENT)
      .text(sanitized.candidate.title, startX, doc.y, {
        width,
        align: 'center',
      });
  }

  const contactLine = buildContactLine(sanitized.candidate);
  if (contactLine) {
    doc.moveDown(0.4);
    doc
      .font(FONT_REGULAR)
      .fontSize(8.5)
      .fillColor(COLOR_MUTED)
      .text(contactLine, startX, doc.y, {
        width,
        align: 'center',
        lineGap: 1,
      });
  }

  addHeaderDivider(doc);
  addSummary(doc, sanitized.summary);
  addSkills(doc, sanitized.skills);
  addProjects(doc, sanitized.projects);
  addEducation(doc, sanitized.education);

  doc.end();

  await new Promise((resolve, reject) => {
    output.on('finish', resolve);
    output.on('error', reject);
  });

  return {
    filePath,
    fileName,
  };
}

module.exports = {
  generateResumePdf,
};
