require('dotenv').config();

const { searchProjects } = require('../services/chromaService');
const { generateResponse } = require('../services/aiService');

const candidate_id = Number(process.env.TEST_CANDIDATE_ID || 1);
const jobDescription =
  'We are looking for a React and PostgreSQL intern with backend knowledge and problem-solving skills.';

function getDescriptionFromDocument(document) {
  if (!document) {
    return 'No description available.';
  }

  const descriptionLine = document
    .split('\n')
    .find((line) => line.startsWith('Description:'));

  return descriptionLine
    ? descriptionLine.replace('Description:', '').trim()
    : document;
}

function buildProjectsContext(projects) {
  return projects.slice(0, 3).map((project, index) => {
    const metadata = project.metadata || {};
    const name = metadata.name || project.id;
    const technologies = metadata.tech_stack || 'No technologies listed';
    const description = getDescriptionFromDocument(project.document);

    return [
      `Project ${index + 1}: ${name}`,
      `Description: ${description}`,
      `Technologies: ${technologies}`,
    ].join('\n');
  }).join('\n\n');
}

function buildTailoringPrompt(projects) {
  const projectsContext = buildProjectsContext(projects);

  return `
You are an ATS resume generator.

Task:
Generate a professional ATS-friendly resume summary for this candidate.

Strict rules:
- Output must be 5 to 7 lines maximum.
- No paragraphs longer than 2 lines.
- No storytelling.
- No explanations.
- No greetings.
- No repetition.
- Candidate perspective only.
- Do not mention "our team" or use company voice.
- Always write in first person using phrases like "I am", "I built", or "I developed".

Content rules:
- Focus only on skills, projects, and technologies.
- Use only information from retrieved projects.
- Do not invent candidate experience.
- Mention 2 or 3 most relevant projects only.

Format:
- Use clean bullet-like short sentences or short lines.
- Optimize for ATS keywords such as React, PostgreSQL, Node.js, Express, ChromaDB, and backend development.

Job description:
${jobDescription}

Retrieved candidate projects:
${projectsContext}

Output example style:
I am a software engineer experienced in React and PostgreSQL.
I built HR-Genius using Node.js and Express.
I developed StellarPath using ChromaDB for semantic matching.
I have strong backend and problem-solving skills.
`.trim();
}

async function testTailor() {
  try {
    console.log('Testing AI-powered resume tailoring...\n');
    console.log(`Candidate ID: ${candidate_id}`);
    console.log(`Job description: ${jobDescription}\n`);

    // Step 1: Search only this candidate's ChromaDB memory for matching projects.
    const projects = await searchProjects(jobDescription, candidate_id);

    if (projects.length === 0) {
      console.log(`No relevant projects found in ChromaDB memory for candidate ${candidate_id}.`);
      return;
    }

    console.log('Retrieved projects:');
    projects.forEach((project, index) => {
      const metadata = project.metadata || {};
      console.log(`${index + 1}. ${metadata.name || project.id}`);
      console.log(`   Candidate ID: ${metadata.candidate_id || 'not available'}`);
      console.log(`   Technologies: ${metadata.tech_stack || 'No technologies listed'}`);
      console.log(`   Similarity Distance: ${project.distance.toFixed(4)}`);
    });

    // Step 2: Build a prompt that gives the AI all useful context.
    const prompt = buildTailoringPrompt(projects);

    // Step 3: Ask Ollama to generate the tailored candidate summary.
    console.log('\nGenerating tailored summary with Ollama...');
    const summary = await generateResponse(prompt);

    console.log('\nAI-generated tailored summary:\n');
    console.log(summary.trim());
  } catch (error) {
    console.error('Failed to test resume tailoring.');
    console.error(error.message);
    process.exit(1);
  }
}

testTailor();
