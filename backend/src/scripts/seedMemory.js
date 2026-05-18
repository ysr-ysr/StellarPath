require('dotenv').config();

const {
  initializeCollection,
  addProject,
} = require('../services/chromaService');

// These sample projects give ChromaDB realistic data for career matching tests.
const sampleProjects = [
  {
    id: 'candidate-1-project-hr-genius',
    candidate_id: 1,
    name: 'HR-Genius',
    description:
      'An AI-powered human resources platform that screens resumes, matches candidates to job descriptions, and helps recruiters manage hiring pipelines.',
    tech_stack: ['Node.js', 'Express', 'PostgreSQL', 'OpenAI API', 'React'],
    key_achievements: [
      'Built an automated resume matching workflow using semantic search',
      'Created REST APIs for candidates, jobs, and recruiter dashboards',
      'Improved hiring pipeline visibility with structured candidate scoring',
    ],
  },
  {
    id: 'candidate-1-project-ai-todo-app',
    candidate_id: 1,
    name: 'AI ToDo App',
    description:
      'A productivity app that uses AI to organize tasks, suggest priorities, and break large goals into smaller action steps.',
    tech_stack: ['JavaScript', 'Node.js', 'Express', 'MongoDB', 'React'],
    key_achievements: [
      'Implemented AI-generated task prioritization and daily planning',
      'Designed a clean task management API with authentication-ready routes',
      'Added project-based task grouping for better user organization',
    ],
  },
  {
    id: 'candidate-1-project-stellarpath',
    candidate_id: 1,
    name: 'StellarPath',
    description:
      'A career development platform that analyzes user skills, projects, and job goals to recommend personalized career paths.',
    tech_stack: ['Node.js', 'Express', 'PostgreSQL', 'ChromaDB', 'React'],
    key_achievements: [
      'Created a memory system for AI-powered project and career matching',
      'Connected backend services to structured career and project data',
      'Designed the foundation for personalized job recommendation workflows',
    ],
  },
  {
    id: 'candidate-2-project-clinicflow',
    candidate_id: 2,
    name: 'ClinicFlow',
    description:
      'A healthcare appointment platform for managing patient visits, doctor schedules, and clinic intake forms.',
    tech_stack: ['Python', 'Django', 'PostgreSQL', 'Bootstrap'],
    key_achievements: [
      'Built secure CRUD workflows for patient appointments and clinic schedules',
      'Created role-based dashboards for reception staff and doctors',
      'Improved booking visibility with status tracking and searchable patient records',
    ],
  },
  {
    id: 'candidate-2-project-finance-tracker',
    candidate_id: 2,
    name: 'Finance Tracker',
    description:
      'A personal finance dashboard that tracks budgets, expenses, recurring payments, and savings goals.',
    tech_stack: ['Vue.js', 'Express', 'MongoDB', 'Chart.js'],
    key_achievements: [
      'Designed expense analytics views using interactive charts',
      'Implemented REST APIs for budgets, transactions, and recurring payment rules',
      'Added monthly spending summaries to help users identify financial patterns',
    ],
  },
];

async function seedMemory() {
  try {
    // Step 1: Make sure the ChromaDB collection exists before adding data.
    await initializeCollection();
    console.log('ChromaDB collection is ready.');

    // Step 2: Add each sample project with candidate_id metadata for isolated retrieval.
    for (const project of sampleProjects) {
      await addProject(project);
      console.log(`Inserted candidate ${project.candidate_id} project: ${project.name}`);
    }

    // Step 3: Print a clear success message after all projects are inserted.
    console.log('\nMemory seed completed successfully.');
    console.log('Inserted projects:');
    sampleProjects.forEach((project) => {
      console.log(`- Candidate ${project.candidate_id}: ${project.name}`);
    });
  } catch (error) {
    // If something goes wrong, show the error so it is easier to debug.
    console.error('Failed to seed ChromaDB memory.');
    console.error(error.message);
    process.exit(1);
  }
}

seedMemory();
