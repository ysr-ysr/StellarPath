const fs = require('fs');
const os = require('os');
const path = require('path');
const PDFDocument = require('pdfkit');

const PDF_DIR = path.join(os.tmpdir(), 'stellarpath-interview-reports');

const FONT_REGULAR = 'Helvetica';
const FONT_BOLD = 'Helvetica-Bold';

// Light palette based on user image
const COLOR_BG_DEEP = '#F5F5F4';       // White Smoke (Page background)
const COLOR_BG_MID = '#E5DBE6';        // Lavender Blush (Card backgrounds)
const COLOR_HIGHLIGHT = '#55418B';     // Dusty Grape (Titles, important text)
const COLOR_ACCENT = '#7D80DA';        // Soft Periwinkle (Accents, bullets)
const COLOR_ACCENT_BRIGHT = '#7D80DA'; // Soft Periwinkle
const COLOR_PURPLE_MID = '#B8A0A0';    // Rosy Taupe (Table headers)
const COLOR_PURPLE_DARK = '#E5DBE6';   // Lavender Blush (Score card background)
const COLOR_PURPLE_DEEPER = '#E5DBE6'; // Lavender Blush (List backgrounds)
const COLOR_TEXT = '#55418B';          // Dusty Grape (Primary text)
const COLOR_MUTED = '#B8A0A0';         // Rosy Taupe (Secondary text, descriptions)

function contentBounds(doc) {
  const startX = doc.page.margins.left;
  const endX = doc.page.width - doc.page.margins.right;
  return { startX, endX, width: endX - startX };
}

function drawPageBackground(doc) {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  doc.save();
  doc.rect(0, 0, pageWidth, pageHeight).fill(COLOR_BG_DEEP);

  doc.opacity(0.22);
  doc.circle(pageWidth - 55, 70, 100).fill(COLOR_ACCENT_BRIGHT);
  doc.circle(45, pageHeight - 70, 120).fill(COLOR_PURPLE_MID);
  doc.opacity(0.14);
  doc.circle(pageWidth - 130, pageHeight - 90, 80).fill(COLOR_HIGHLIGHT);
  doc.restore();

  doc.fillColor(COLOR_TEXT);
}

function ensureSpace(doc, requiredHeight) {
  const bottom = doc.page.height - doc.page.margins.bottom;

  if (doc.y + requiredHeight > bottom) {
    doc.addPage();
    drawPageBackground(doc);
    doc.y = doc.page.margins.top;
  }
}

function addSectionTitle(doc, title) {
  const { startX, width } = contentBounds(doc);

  ensureSpace(doc, 50);
  doc.moveDown(0.8);

  doc
    .font(FONT_BOLD)
    .fontSize(11)
    .fillColor(COLOR_HIGHLIGHT)
    .text(title.toUpperCase(), startX, doc.y, {
      width,
      characterSpacing: 0.9,
    });

  const lineY = doc.y + 4;
  doc
    .save()
    .moveTo(startX, lineY)
    .lineTo(startX + width, lineY)
    .lineWidth(1.5)
    .strokeColor(COLOR_ACCENT)
    .stroke()
    .restore();

  doc.y = lineY + 14;
  doc.fillColor(COLOR_TEXT);
}

function addBulletList(doc, items, cardColor = COLOR_PURPLE_DEEPER) {
  const { startX, width } = contentBounds(doc);
  const padding = 12;
  const textWidth = width - padding * 2 - 14;
  const listStartY = doc.y;

  let listHeight = padding * 2;

  items.forEach((item) => {
    listHeight +=
      doc.heightOfString(item, {
        width: textWidth,
        font: FONT_REGULAR,
        fontSize: 9.3,
      }) + 6;
  });

  ensureSpace(doc, listHeight + 8);

  doc
    .save()
    .roundedRect(startX, listStartY, width, listHeight, 8)
    .fillColor(cardColor)
    .fill()
    .restore();

  doc.y = listStartY + padding;

  items.forEach((item) => {
    const y = doc.y;
    const bulletX = startX + padding;
    const textX = bulletX + 12;

    doc
      .font(FONT_BOLD)
      .fontSize(9)
      .fillColor(COLOR_ACCENT)
      .text('•', bulletX, y, { width: 10 });

    doc
      .font(FONT_REGULAR)
      .fontSize(9.3)
      .fillColor(COLOR_TEXT)
      .text(item, textX, y, {
        width: textWidth,
        lineGap: 2,
      });

    doc.moveDown(0.35);
  });

  doc.moveDown(0.5);
  doc.fillColor(COLOR_TEXT);
}

function drawScoreCard(doc, scorePercentage) {
  const { startX, width } = contentBounds(doc);
  const cardY = doc.y;
  const cardHeight = 78;

  ensureSpace(doc, cardHeight + 10);

  doc
    .save()
    .roundedRect(startX, cardY, width, cardHeight, 12)
    .fillColor(COLOR_PURPLE_DARK)
    .fill()
    .restore();

  doc
    .save()
    .roundedRect(startX, cardY, 6, cardHeight, 3)
    .fillColor(COLOR_ACCENT_BRIGHT)
    .fill()
    .restore();

  const scoreX = startX + 24;
  const scoreCenterY = cardY + cardHeight / 2;

  doc
    .save()
    .lineWidth(5)
    .strokeColor(COLOR_PURPLE_MID)
    .circle(scoreX + 28, scoreCenterY, 26)
    .stroke()
    .lineWidth(5)
    .strokeColor(COLOR_HIGHLIGHT)
    .circle(scoreX + 28, scoreCenterY, 26)
    .stroke()
    .restore();

  doc
    .font(FONT_BOLD)
    .fontSize(18)
    .fillColor(COLOR_HIGHLIGHT)
    .text(`${scorePercentage}%`, scoreX, scoreCenterY - 8, { width: 56, align: 'center' });

  doc
    .font(FONT_BOLD)
    .fontSize(10)
    .fillColor(COLOR_HIGHLIGHT)
    .text('FINAL SCORE', startX + 100, cardY + 18);

  doc
    .font(FONT_REGULAR)
    .fontSize(9)
    .fillColor(COLOR_MUTED)
    .text('Acceptable answers / total questions', startX + 100, cardY + 36, {
      width: width - 120,
    });

  doc
    .font(FONT_REGULAR)
    .fontSize(8.5)
    .fillColor(COLOR_ACCENT)
    .text('StellarPath AI Interview Coach', startX + 100, cardY + 52, {
      width: width - 120,
    });

  doc.y = cardY + cardHeight + 16;
  doc.fillColor(COLOR_TEXT);
}

function drawTableHeader(doc) {
  const { startX, width } = contentBounds(doc);
  const headerHeight = 22;
  const y = doc.y;

  ensureSpace(doc, headerHeight + 8);

  doc
    .save()
    .roundedRect(startX, y, width, headerHeight, 6)
    .fillColor(COLOR_PURPLE_MID)
    .fill()
    .restore();

  doc
    .font(FONT_BOLD)
    .fontSize(8.5)
    .fillColor(COLOR_HIGHLIGHT)
    .text('QUESTIONS & ANSWERS · AI FEEDBACK', startX + 10, y + 7, { width: width - 20 });

  doc.y = y + headerHeight + 8;
}

function measureTextHeight(doc, text, textWidth, fontSize) {
  return doc.heightOfString(text || '—', {
    width: textWidth,
    font: FONT_REGULAR,
    fontSize,
  });
}

function drawQaBlock(doc, index, pair) {
  const { startX, width } = contentBounds(doc);
  const pad = 14;
  const innerWidth = width - pad * 2;
  const statusLabel = pair.is_acceptable ? 'Acceptable' : 'Needs improvement';
  const statusColor = pair.is_acceptable ? COLOR_HIGHLIGHT : COLOR_ACCENT;

  const blockHeight =
    20 +
    16 +
    measureTextHeight(doc, pair.question, innerWidth, 9.2) +
    22 +
    measureTextHeight(doc, pair.answer || 'No answer submitted.', innerWidth, 9) +
    22 +
    measureTextHeight(doc, pair.feedback || 'No feedback yet.', innerWidth, 9) +
    18;

  ensureSpace(doc, blockHeight + 12);

  const blockY = doc.y;

  doc
    .save()
    .roundedRect(startX, blockY, width, blockHeight, 8)
    .fillColor(COLOR_BG_MID)
    .fill()
    .restore();

  doc
    .save()
    .roundedRect(startX, blockY, 5, blockHeight, 2)
    .fillColor(COLOR_ACCENT_BRIGHT)
    .fill()
    .restore();

  let y = blockY + 16;

  doc
    .font(FONT_BOLD)
    .fontSize(9.5)
    .fillColor(COLOR_HIGHLIGHT)
    .text(`Question ${index + 1}`, startX + pad, y, { width: innerWidth });
  y = doc.y + 4;

  doc
    .font(FONT_REGULAR)
    .fontSize(9.2)
    .fillColor(COLOR_TEXT)
    .text(pair.question || '—', startX + pad, y, { width: innerWidth, lineGap: 2 });
  y = doc.y + 8;

  doc
    .font(FONT_BOLD)
    .fontSize(8.8)
    .fillColor(COLOR_ACCENT)
    .text('Answer', startX + pad, y, { width: innerWidth });
  y = doc.y + 2;

  doc
    .font(FONT_REGULAR)
    .fontSize(9)
    .fillColor(COLOR_TEXT)
    .text(pair.answer || 'No answer submitted.', startX + pad, y, {
      width: innerWidth,
      lineGap: 2,
    });
  y = doc.y + 8;

  doc
    .font(FONT_BOLD)
    .fontSize(8.8)
    .fillColor(COLOR_HIGHLIGHT)
    .text('AI Feedback', startX + pad, y, { width: innerWidth });
  y = doc.y + 2;

  doc
    .font(FONT_REGULAR)
    .fontSize(9)
    .fillColor(COLOR_MUTED)
    .text(pair.feedback || 'No feedback yet.', startX + pad, y, {
      width: innerWidth,
      lineGap: 2,
    });
  y = doc.y + 6;

  doc
    .font(FONT_BOLD)
    .fontSize(8.5)
    .fillColor(statusColor)
    .text(`Status: ${statusLabel}`, startX + pad, y, { width: innerWidth });

  doc.y = blockY + blockHeight + 10;
  doc.fillColor(COLOR_TEXT);
}

async function ensurePdfDirectory() {
  await fs.promises.mkdir(PDF_DIR, { recursive: true });
}

async function generateInterviewReportPdf({
  candidate,
  session,
  score,
  strengths,
  weaknesses,
  recommendations,
  qa_pairs,
}) {
  if (!candidate || !candidate.name) {
    throw new Error('Candidate data is required to generate an interview report PDF.');
  }

  await ensurePdfDirectory();

  const safeName = candidate.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  const fileName = `${safeName || 'candidate'}-interview-report-${session.id}.pdf`;
  const filePath = path.join(PDF_DIR, fileName);

  const doc = new PDFDocument({
    size: 'LETTER',
    margin: 48,
    info: {
      Title: `${candidate.name} - Interview Report`,
      Author: 'StellarPath',
      Subject: 'AI Interview Coach Report',
    },
  });

  const output = fs.createWriteStream(filePath);
  doc.pipe(output);

  drawPageBackground(doc);

  const { startX, width } = contentBounds(doc);
  const jobTitle =
    candidate.title ||
    `Interview target: ${String(session.job_description || '').slice(0, 90)}`;

  doc
    .font(FONT_BOLD)
    .fontSize(9)
    .fillColor(COLOR_ACCENT)
    .text('STELLARPATH · INTERVIEW COACH', startX, doc.page.margins.top, { width });

  doc.moveDown(1.2);

  doc
    .font(FONT_BOLD)
    .fontSize(22)
    .fillColor(COLOR_HIGHLIGHT)
    .text(candidate.name, startX, doc.y, { width });

  doc.moveDown(0.25);

  doc
    .font(FONT_REGULAR)
    .fontSize(11)
    .fillColor(COLOR_TEXT)
    .text(jobTitle, startX, doc.y, { width, lineGap: 2 });

  doc.moveDown(0.35);

  doc
    .font(FONT_REGULAR)
    .fontSize(8.5)
    .fillColor(COLOR_MUTED)
    .text(
      `Session #${session.id} · ${session.difficulty || 'beginner'} · ${new Date(session.created_at).toLocaleDateString()}`,
      startX,
      doc.y,
      { width }
    );

  doc.moveDown(0.8);
  drawScoreCard(doc, score.percentage ?? 0);

  addSectionTitle(doc, 'Questions & Answers');
  drawTableHeader(doc);

  if (!qa_pairs || qa_pairs.length === 0) {
    doc
      .font(FONT_REGULAR)
      .fontSize(9.5)
      .fillColor(COLOR_MUTED)
      .text('No questions or answers recorded for this session.', startX, doc.y, { width });
  } else {
    qa_pairs.forEach((pair, index) => {
      drawQaBlock(doc, index, pair);
    });
  }

  addSectionTitle(doc, 'Strengths');
  addBulletList(
    doc,
    strengths && strengths.length > 0 ? strengths : ['No strengths recorded.'],
    COLOR_PURPLE_DEEPER
  );

  addSectionTitle(doc, 'Weaknesses');
  addBulletList(
    doc,
    weaknesses && weaknesses.length > 0 ? weaknesses : ['No weaknesses recorded.'],
    COLOR_PURPLE_DARK
  );

  addSectionTitle(doc, 'Recommendations');
  addBulletList(
    doc,
    recommendations && recommendations.length > 0
      ? recommendations
      : ['No recommendations recorded.'],
    COLOR_PURPLE_MID
  );

  const footerY = doc.page.height - doc.page.margins.bottom + 8;
  doc
    .font(FONT_REGULAR)
    .fontSize(7.5)
    .fillColor(COLOR_MUTED)
    .text('Generated by StellarPath Interview Coach', startX, footerY, {
      width,
      align: 'center',
    });

  doc.end();

  await new Promise((resolve, reject) => {
    output.on('finish', resolve);
    output.on('error', reject);
  });

  return { filePath, fileName };
}

module.exports = {
  generateInterviewReportPdf,
};
