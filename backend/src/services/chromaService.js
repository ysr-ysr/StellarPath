const { ChromaClient } = require('chromadb');

const COLLECTION_NAME = 'stellarpath_memory';
const DEFAULT_SEARCH_LIMIT = 5;

// Create one Chroma client that can be reused by every function in this service.
const chromaClient = new ChromaClient({
  host: process.env.CHROMA_HOST || 'localhost',
  port: process.env.CHROMA_PORT || 8000,
});

let memoryCollection = null;

// Turn a project object into searchable text for ChromaDB.
function buildProjectDocument(project) {
  const techStack = Array.isArray(project.tech_stack)
    ? project.tech_stack.join(', ')
    : project.tech_stack || '';

  const keyAchievements = Array.isArray(project.key_achievements)
    ? project.key_achievements.join('. ')
    : project.key_achievements || '';

  return [
    `Project name: ${project.name || ''}`,
    `Description: ${project.description || ''}`,
    `Tech stack: ${techStack}`,
    `Key achievements: ${keyAchievements}`,
  ].join('\n');
}

function normalizeTechStack(techStack) {
  return Array.isArray(techStack)
    ? techStack.join(', ')
    : techStack || '';
}

function normalizeCandidateId(candidateId) {
  const normalizedCandidateId = Number(candidateId);

  if (!Number.isInteger(normalizedCandidateId) || normalizedCandidateId <= 0) {
    throw new Error('A valid candidate_id is required for ChromaDB project memory.');
  }

  return normalizedCandidateId;
}

// Metadata helps us filter, debug, and understand results without reading the full document.
function buildProjectMetadata(project) {
  const candidateId = normalizeCandidateId(project.candidate_id);
  const techStack = normalizeTechStack(project.tech_stack);

  const achievementCount = Array.isArray(project.key_achievements)
    ? project.key_achievements.length
    : project.key_achievements
      ? 1
      : 0;

  return {
    project_id: String(project.id),
    candidate_id: candidateId,
    name: project.name || '',
    tech_stack: techStack,
    achievementCount,
    source: 'stellarpath',
    type: 'project',
  };
}

async function initializeCollection() {
  try {
    // Reuse the collection after the first setup so we do not ask ChromaDB every time.
    if (memoryCollection) {
      return memoryCollection;
    }

    memoryCollection = await chromaClient.getOrCreateCollection({
      name: COLLECTION_NAME,
      metadata: {
        description: 'Candidate-isolated AI memory for StellarPath career project matching',
      },
    });

    return memoryCollection;
  } catch (error) {
    throw new Error(`Failed to initialize ChromaDB collection: ${error.message}`);
  }
}

async function addProject(project) {
  try {
    if (!project || !project.id) {
      throw new Error('Project id is required.');
    }

    const collection = await initializeCollection();
    const document = buildProjectDocument(project);
    const metadata = buildProjectMetadata(project);

    // Upsert keeps the seed script repeatable while still storing one project per id.
    await collection.upsert({
      ids: [String(project.id)],
      documents: [document],
      metadatas: [metadata],
    });

    return {
      id: String(project.id),
      document,
      metadata,
    };
  } catch (error) {
    throw new Error(`Failed to add project to ChromaDB memory: ${error.message}`);
  }
}

async function searchProjects(query, candidate_id, limit = DEFAULT_SEARCH_LIMIT) {
  try {
    if (!query || typeof query !== 'string') {
      throw new Error('Search query is required.');
    }

    const candidateId = normalizeCandidateId(candidate_id);
    const collection = await initializeCollection();

    // The where filter is the production boundary that keeps candidates isolated.
    const results = await collection.query({
      queryTexts: [query],
      nResults: limit,
      where: {
        candidate_id: candidateId,
      },
      include: ['documents', 'metadatas', 'distances'],
    });

    const ids = results.ids && results.ids[0] ? results.ids[0] : [];
    const documents = results.documents && results.documents[0] ? results.documents[0] : [];
    const metadatas = results.metadatas && results.metadatas[0] ? results.metadatas[0] : [];
    const distances = results.distances && results.distances[0] ? results.distances[0] : [];

    // Return a simple list so controllers can send it directly as JSON.
    return ids.map((id, index) => ({
      id,
      document: documents[index],
      metadata: metadatas[index],
      distance: distances[index],
    }));
  } catch (error) {
    throw new Error(`Failed to search candidate projects in ChromaDB: ${error.message}`);
  }
}

module.exports = {
  initializeCollection,
  addProject,
  searchProjects,
};
