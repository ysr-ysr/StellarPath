const fs = require('fs');
const os = require('os');
const path = require('path');
const PDFDocument = require('pdfkit');

const PDF_DIR = path.join(os.tmpdir(), 'stellarpath-cv');
const FONT_REGULAR = 'Helvetica';
const FONT_BOLD = 'Helvetica-Bold';

const COLOR_PRIMARY = '#1e293b';
const COLOR_ACCENT = '#1e40af';
const COLOR_MUTED = '#64748b';
const COLOR_RULE = '#94a3b8';
const COLOR_RULE_LIGHT = '#e2e8f0';

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
  if (!text) {
    return;
  }

  const { startX, width } = contentBounds(doc);
  const bulletX = startX + 8;
  const textWidth = width - 8;

  doc
    .font(FONT_REGULAR)
    .fontSize(9.3)
    .fillColor(COLOR_PRIMARY)
    .text('•', startX, doc.y, { continued: false, width: 8 })
    .text(text, bulletX, doc.y - doc.currentLineHeight(), {
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
    .text(normalizeText(summary), startX, doc.y, {
      width,
      lineGap: 3,
      align: 'left',
    });
}

function addSkills(doc, skills) {
  if (!skills || skills.length === 0) {
    return;
  }

  addSectionTitle(doc, 'Skills');

  const { startX, width } = contentBounds(doc);
  const skillsByCategory = skills.reduce((groups, skill) => {
    const category = skill.category || 'Other';

    if (!groups[category]) {
      groups[category] = [];
    }

    groups[category].push(skill.name);
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
      .text(names.join(', '), {
        lineGap: 3,
      });
  });
}

function addProjects(doc, projects) {
  if (!projects || projects.length === 0) {
    return;
  }

  addSectionTitle(doc, 'Projects');

  const { startX, width } = contentBounds(doc);

  projects.forEach((project, index) => {
    if (index > 0) {
      doc.moveDown(0.65);
    }

    doc
      .font(FONT_BOLD)
      .fontSize(10.2)
      .fillColor(COLOR_PRIMARY)
      .text(normalizeText(project.name), startX, doc.y, { width });

    if (project.tech_stack) {
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
        .text(normalizeText(project.tech_stack), {
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

    normalizeAchievements(project.key_achievements).forEach((achievement) => {
      doc.moveDown(0.08);
      addBullet(doc, achievement);
    });
  });
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

  await ensurePdfDirectory();

  const safeName = candidate.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  const fileName = `${safeName || 'candidate'}-${Date.now()}-resume.pdf`;
  const filePath = path.join(PDF_DIR, fileName);

  const doc = new PDFDocument({
    size: 'LETTER',
    margin: 52,
    info: {
      Title: `${candidate.name} Resume`,
      Author: candidate.name,
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
    .text(candidate.name.toUpperCase(), startX, doc.y, {
      width,
      align: 'center',
      characterSpacing: 0.8,
    });

  if (candidate.title) {
    doc.moveDown(0.35);
    doc
      .font(FONT_REGULAR)
      .fontSize(10.5)
      .fillColor(COLOR_ACCENT)
      .text(candidate.title, startX, doc.y, {
        width,
        align: 'center',
      });
  }

  const contactLine = buildContactLine(candidate);
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
