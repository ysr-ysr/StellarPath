function buildSkillsContext(skills) {
  if (!skills || skills.length === 0) {
    return 'No skills listed.';
  }

  return skills.map((skill) => skill.name).join(', ');
}

function buildProjectsContext(projects) {
  return projects.slice(0, 3).map((project, index) => {
    return [
      `Project ${index + 1}: ${project.name}`,
      `Tech Stack: ${project.tech_stack || 'Not listed'}`,
      `Description: ${project.description || 'Not listed'}`,
      `Key Achievements: ${project.key_achievements || 'Not listed'}`,
    ].join('\n');
  }).join('\n\n');
}

function buildAtsSummaryPrompt({ candidate, jobDescription, skills, projects }) {
  return `
You are an ATS resume summary generator.

Task:
Generate a polished professional summary for the top of an ATS resume.

Strict rules:
- Output exactly 3 distinct sentences, each on its own new line.
- Structure:
  * Line 1: Professional title and high-level summary of experience.
  * Line 2: Core technical expertise, mentioning ONLY the top 3-4 most relevant technologies for this job. DO NOT list every skill.
  * Line 3: A brief highlight of a relevant project or measurable achievement.
- DO NOT use semicolons (;). Keep sentences short and easy for recruiters to read.
- Use third-person resume style without pronouns.
- Do not use "I", "my", "we", "our", "the candidate".
- DO NOT output any preamble, intro, or internal thinking. Output ONLY the final 3 lines.
- CRITICAL: You MUST wrap your final 3 lines of output inside <FINAL_SUMMARY> and </FINAL_SUMMARY> tags. Anything outside these tags will be deleted.
- No storytelling or regurgitating these instructions.
- Do not invent experience.
- Use only the candidate data below.

Candidate name:
${candidate.name}

Candidate title:
${candidate.title || 'Not listed'}

Job description:
${jobDescription}

Candidate skills:
${buildSkillsContext(skills)}

Retrieved candidate projects:
${buildProjectsContext(projects)}
`.trim();
}

function cleanSummary(summary) {
  let text = String(summary || '');
  const match = text.match(/<FINAL_SUMMARY>([\s\S]*?)<\/FINAL_SUMMARY>/i);
  if (match) {
    text = match[1];
  }

  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*•]\s*/, ''))
    .map((line) => line.replace(/^(professional summary|résumé|resume summary)\s*:\s*/i, ''))
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .slice(0, 3)
    .join('\n');
}

module.exports = {
  buildAtsSummaryPrompt,
  cleanSummary,
};
