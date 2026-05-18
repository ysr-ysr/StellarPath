const fs = require('fs');
const os = require('os');
const path = require('path');
const PDFDocument = require('pdfkit');

const PDF_DIR = path.join(os.tmpdir(), 'stellarpath-cv');
const FONT_REGULAR = 'Helvetica';
const FONT_BOLD = 'Helvetica-Bold';
const TEXT_COLOR = '#222222';
const MUTED_COLOR = '#666666';
const RULE_COLOR = '#333333';

function normalizeText(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(', ');
  }

  return value ? String(value) : '';
}

function normalizeAchievements(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (!value) {
    return [];
  }

  return String(value)
    .split(/\r?\n|;/)
    .map((achievement) => achievement.trim())
    .filter(Boolean);
}

function addSectionTitle(doc, title) {
  const startX = doc.page.margins.left;
  const endX = doc.page.width - doc.page.margins.right;
  const y = doc.y + 15;

  doc
    .moveDown(0.9)
    .font(FONT_BOLD)
    .fontSize(11)
    .fillColor(TEXT_COLOR)
    .text(title.toUpperCase(), {
      align: 'center',
    });

  doc
    .moveTo(startX, y)
    .lineTo(endX, y)
    .lineWidth(0.5)
    .strokeColor(RULE_COLOR)
    .stroke()
    .strokeColor(TEXT_COLOR)
    .moveDown(0.5);
}

function addDivider(doc) {
  const startX = doc.page.margins.left;
  const endX = doc.page.width - doc.page.margins.right;
  const y = doc.y + 6;

  doc
    .moveTo(startX, y)
    .lineTo(endX, y)
    .lineWidth(0.5)
    .strokeColor(RULE_COLOR)
    .stroke()
    .strokeColor(TEXT_COLOR)
    .moveDown(0.65);
}

function addBullet(doc, text) {
  if (!text) {
    return;
  }

  doc
    .font(FONT_REGULAR)
    .fontSize(9.4)
    .fillColor(TEXT_COLOR)
    .text(`- ${text}`, {
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
    .join(' | ');
}

function addSummary(doc, summary) {
  addSectionTitle(doc, 'Professional Summary');

  doc
    .font(FONT_REGULAR)
    .fontSize(9.7)
    .fillColor(TEXT_COLOR)
    .text(normalizeText(summary), {
      lineGap: 3,
    });
}

function addSkills(doc, skills) {
  if (!skills || skills.length === 0) {
    return;
  }

  addSectionTitle(doc, 'Skills');

  const skillsByCategory = skills.reduce((groups, skill) => {
    const category = skill.category || 'Autres';

    if (!groups[category]) {
      groups[category] = [];
    }

    groups[category].push(skill.name);
    return groups;
  }, {});

  Object.entries(skillsByCategory).forEach(([category, names]) => {
    doc
      .font(FONT_BOLD)
      .fontSize(9.4)
      .fillColor(TEXT_COLOR)
      .text(`${category}: `, {
        continued: true,
      })
      .font(FONT_REGULAR)
      .text(names.join(', '), {
        lineGap: 2,
      });
  });
}

function addProjects(doc, projects) {
  if (!projects || projects.length === 0) {
    return;
  }

  addSectionTitle(doc, 'Projects');

  projects.forEach((project, index) => {
    if (index > 0) {
      doc.moveDown(0.55);
    }

    doc
      .font(FONT_BOLD)
      .fontSize(10.3)
      .fillColor(MUTED_COLOR)
      .text(normalizeText(project.name));

    if (project.tech_stack) {
      doc
        .font(FONT_BOLD)
        .fontSize(9.4)
        .fillColor(TEXT_COLOR)
        .text('Tech Stack: ', {
          continued: true,
        })
        .font(FONT_REGULAR)
        .text(normalizeText(project.tech_stack), {
          lineGap: 1.5,
        });
    }

    if (project.description) {
      doc
        .font(FONT_REGULAR)
        .fontSize(9.4)
        .fillColor(TEXT_COLOR)
        .text(normalizeText(project.description), {
          lineGap: 2,
        });
    }

    normalizeAchievements(project.key_achievements).forEach((achievement) => {
      addBullet(doc, achievement);
    });
  });
}

function addEducation(doc, education) {
  if (!education || education.length === 0) {
    return;
  }

  addSectionTitle(doc, 'Education');

  education.forEach((item) => {
    doc
      .font(FONT_BOLD)
      .fontSize(9.8)
      .fillColor(TEXT_COLOR)
      .text(normalizeText(item.school));

    if (item.diploma) {
      doc
        .font(FONT_REGULAR)
        .fontSize(9.4)
        .fillColor(TEXT_COLOR)
        .text(normalizeText(item.diploma), {
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

  await ensurePdfDirectory();

  const safeName = candidate.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  const fileName = `${safeName || 'candidate'}-${Date.now()}-resume.pdf`;
  const filePath = path.join(PDF_DIR, fileName);

  const doc = new PDFDocument({
    size: 'LETTER',
    margin: 48,
    info: {
      Title: `${candidate.name} Resume`,
      Author: candidate.name,
      Subject: 'ATS-friendly resume generated by StellarPath',
    },
  });

  const output = fs.createWriteStream(filePath);
  doc.pipe(output);

  doc
    .font(FONT_BOLD)
    .fontSize(16)
    .fillColor(TEXT_COLOR)
    .text(candidate.name, {
      align: 'center',
    });

  if (candidate.title) {
    doc
      .moveDown(0.2)
      .font(FONT_BOLD)
      .fontSize(10)
      .fillColor(MUTED_COLOR)
      .text(candidate.title, {
        align: 'center',
      });
  }

  const contactLine = buildContactLine(candidate);
  if (contactLine) {
    doc
      .moveDown(0.3)
      .font(FONT_REGULAR)
      .fontSize(8.7)
      .fillColor(TEXT_COLOR)
      .text(contactLine, {
        align: 'center',
      });
  }

  addDivider(doc);
  addSummary(doc, summary);
  addSkills(doc, skills);
  addProjects(doc, projects);
  addEducation(doc, education);

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
