require('dotenv').config();

const { searchProjects } = require('../services/chromaService');

const candidate_id = Number(process.env.TEST_CANDIDATE_ID || 1);

// This is the job-style query we want to compare against stored projects.
const query = 'Looking for a React and PostgreSQL developer internship';

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

async function testSearch() {
  try {
    console.log('Testing ChromaDB semantic search...');
    console.log(`Candidate ID: ${candidate_id}`);
    console.log(`Query: "${query}"\n`);

    // Ask ChromaDB to find the most similar projects only inside this candidate's memory.
    const results = await searchProjects(query, candidate_id);

    if (results.length === 0) {
      console.log(`No matching projects found for candidate ${candidate_id}.`);
      return;
    }

    console.log('Matching projects:\n');

    results.forEach((result, index) => {
      const projectName = result.metadata && result.metadata.name
        ? result.metadata.name
        : result.id;

      const description = getDescriptionFromDocument(result.document);
      const candidateId = result.metadata && result.metadata.candidate_id
        ? result.metadata.candidate_id
        : 'not available';

      const techStack = result.metadata && result.metadata.tech_stack
        ? result.metadata.tech_stack
        : 'No tech stack available';

      // In ChromaDB, a smaller distance usually means a closer semantic match.
      const similarityResult = typeof result.distance === 'number'
        ? `Distance: ${result.distance.toFixed(4)}`
        : 'Distance: not available';

      console.log(`${index + 1}. ${projectName}`);
      console.log(`   Candidate ID: ${candidateId}`);
      console.log(`   Description: ${description}`);
      console.log(`   Tech Stack: ${techStack}`);
      console.log(`   Similarity Result: ${similarityResult}\n`);
    });
  } catch (error) {
    console.error('Failed to test ChromaDB search.');
    console.error(error.message);
    process.exit(1);
  }
}

testSearch();
