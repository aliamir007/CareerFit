/**
 * Skill Normalization Utility
 * 
 * This utility normalizes skill names to ensure consistent comparison
 * between candidate skills and recruiter requirements.
 * 
 * Key features:
 * - Converts to lowercase
 * - Trims whitespace and removes duplicate spaces
 * - Normalizes common aliases (Node.js, NodeJS, Node JS -> nodejs)
 * - Removes duplicates
 * - Sorts alphabetically
 */

/**
 * Comprehensive skill alias mapping
 * Maps various skill name variations to a standardized form
 */
const SKILL_ALIASES = {
  // Programming Languages
  'node': 'nodejs',
  'nodejs': 'nodejs',
  'node js': 'nodejs',
  'javascript': 'javascript',
  'js': 'javascript',
  'typescript': 'typescript',
  'ts': 'typescript',
  'python': 'python',
  'py': 'python',
  'java': 'java',
  'csharp': 'csharp',
  'c#': 'csharp',
  'csharp': 'csharp',
  'cpp': 'cpp',
  'c++': 'cpp',
  'c': 'c',
  'golang': 'golang',
  'go': 'golang',
  'ruby': 'ruby',
  'php': 'php',
  'swift': 'swift',
  'kotlin': 'kotlin',
  'rust': 'rust',
  'scala': 'scala',
  'r': 'r',
  'matlab': 'matlab',
  'perl': 'perl',
  'lua': 'lua',
  'dart': 'dart',
  'bash': 'bash',
  'shell': 'bash',
  'powershell': 'powershell',
  
  // Frontend Frameworks
  'reactjs': 'react',
  'react js': 'react',
  'react': 'react',
  'vuejs': 'vue',
  'vue js': 'vue',
  'vue': 'vue',
  'angularjs': 'angular',
  'angular js': 'angular',
  'angular': 'angular',
  'svelte': 'svelte',
  'nextjs': 'nextjs',
  'next js': 'nextjs',
  'nuxtjs': 'nuxtjs',
  'nuxt js': 'nuxtjs',
  
  // Backend Frameworks
  'expressjs': 'express',
  'express js': 'express',
  'express': 'express',
  'nestjs': 'nestjs',
  'nest js': 'nestjs',
  'django': 'django',
  'flask': 'flask',
  'springboot': 'springboot',
  'spring boot': 'springboot',
  'spring': 'springboot',
  'laravel': 'laravel',
  'rails': 'rails',
  'rubyonrails': 'rails',
  'ruby on rails': 'rails',
  'fastapi': 'fastapi',
  'fast api': 'fastapi',
  
  // Databases
  'mongodb': 'mongodb',
  'mongo': 'mongodb',
  'mongo db': 'mongodb',
  'mysql': 'mysql',
  'postgresql': 'postgresql',
  'postgres': 'postgresql',
  'postgre': 'postgresql',
  'redis': 'redis',
  'sqlite': 'sqlite',
  'oracle': 'oracle',
  'sql server': 'sqlserver',
  'sqlserver': 'sqlserver',
  'mssql': 'sqlserver',
  'cassandra': 'cassandra',
  'elasticsearch': 'elasticsearch',
  'neo4j': 'neo4j',
  
  // Cloud Platforms
  'aws': 'aws',
  'amazonwebservices': 'aws',
  'amazon web services': 'aws',
  'azure': 'azure',
  'microsoft azure': 'azure',
  'googlecloud': 'gcp',
  'google cloud': 'gcp',
  'gcp': 'gcp',
  'ibm cloud': 'ibmcloud',
  'oracle cloud': 'oraclecloud',
  
  // Cloud Services
  'ec2': 'ec2',
  'lambda': 'lambda',
  's3': 's3',
  'rds': 'rds',
  'dynamodb': 'dynamodb',
  'cloudfront': 'cloudfront',
  'route53': 'route53',
  'vpc': 'vpc',
  'eks': 'eks',
  'fargate': 'fargate',
  
  // DevOps Tools
  'docker': 'docker',
  'kubernetes': 'kubernetes',
  'k8s': 'kubernetes',
  'k8': 'kubernetes',
  'terraform': 'terraform',
  'ansible': 'ansible',
  'chef': 'chef',
  'puppet': 'puppet',
  'jenkins': 'jenkins',
  'gitlab ci': 'gitlabci',
  'gitlabci': 'gitlabci',
  'circleci': 'circleci',
  'travisci': 'travisci',
  'bamboo': 'bamboo',
  
  // Version Control
  'git': 'git',
  'github': 'git',
  'gitlab': 'gitlab',
  'bitbucket': 'bitbucket',
  'svn': 'svn',
  'mercurial': 'mercurial',
  
  // Development Tools
  'vscode': 'vscode',
  'visual studio code': 'vscode',
  'intellij': 'intellij',
  'eclipse': 'eclipse',
  'xcode': 'xcode',
  'android studio': 'androidstudio',
  'androidstudio': 'androidstudio',
  'postman': 'postman',
  'swagger': 'swagger',
  'jira': 'jira',
  'confluence': 'confluence',
  'trello': 'trello',
  'slack': 'slack',
  
  // Build Tools
  'webpack': 'webpack',
  'vite': 'vite',
  'babel': 'babel',
  'gulp': 'gulp',
  'grunt': 'grunt',
  'npm': 'npm',
  'yarn': 'yarn',
  'pnpm': 'pnpm',
  'maven': 'maven',
  'gradle': 'gradle',
  
  // Testing
  'jest': 'jest',
  'mocha': 'mocha',
  'jasmine': 'jasmine',
  'cypress': 'cypress',
  'selenium': 'selenium',
  'playwright': 'playwright',
  'pytest': 'pytest',
  'junit': 'junit',
  
  // CSS/UI
  'html': 'html',
  'html5': 'html',
  'css': 'css',
  'css3': 'css',
  'sass': 'sass',
  'scss': 'sass',
  'less': 'less',
  'tailwind': 'tailwind',
  'tailwindcss': 'tailwind',
  'bootstrap': 'bootstrap',
  'material ui': 'materialui',
  'materialui': 'materialui',
  'ant design': 'antdesign',
  'antdesign': 'antdesign',
  'chakra ui': 'chakraui',
  'chakraui': 'chakraui',
  
  // Data & Analytics
  'spark': 'spark',
  'apache spark': 'spark',
  'kafka': 'kafka',
  'apache kafka': 'kafka',
  'hadoop': 'hadoop',
  'hive': 'hive',
  'pig': 'pig',
  'tableau': 'tableau',
  'power bi': 'powerbi',
  'powerbi': 'powerbi',
  'looker': 'looker',
  
  // Operating Systems
  'linux': 'linux',
  'ubuntu': 'linux',
  'debian': 'linux',
  'centos': 'linux',
  'redhat': 'linux',
  'rhel': 'linux',
  'windows': 'windows',
  'macos': 'macos',
  'os x': 'macos',
  'unix': 'unix',
  'android': 'android',
  'ios': 'ios',
  
  // Concepts
  'oop': 'oop',
  'object oriented programming': 'oop',
  'rest api': 'restapi',
  'restapi': 'restapi',
  'graphql': 'graphql',
  'grpc': 'grpc',
  'microservices': 'microservices',
  'micro service': 'microservices',
  'distributed systems': 'distributedsystems',
  'distributedsystems': 'distributedsystems',
  'data structures': 'datastructures',
  'datastructures': 'datastructures',
  'algorithms': 'algorithms',
  'design patterns': 'designpatterns',
  'designpatterns': 'designpatterns',
  'agile': 'agile',
  'scrum': 'scrum',
  'devops': 'devops',
  'ci/cd': 'cicd',
  'cicd': 'cicd',
  'tdd': 'tdd',
  'bdd': 'bdd',
  'test driven development': 'tdd',
  'behavior driven development': 'bdd',
  
  // Soft Skills
  'communication': 'communication',
  'leadership': 'leadership',
  'teamwork': 'teamwork',
  'problem solving': 'problemsolving',
  'problemsolving': 'problemsolving',
  'critical thinking': 'criticalthinking',
  'criticalthinking': 'criticalthinking',
  'time management': 'timemanagement',
  'timemanagement': 'timemanagement',
  'project management': 'projectmanagement',
  'projectmanagement': 'projectmanagement',
};

/**
 * Normalize a single skill name
 * - Converts to lowercase
 * - Trims whitespace
 * - Removes duplicate spaces
 * - Removes dots, hyphens, and special characters
 * - Maps to standardized alias if exists
 * 
 * @param {string} skill - The skill name to normalize
 * @returns {string} - Normalized skill name
 */
function normalizeSkill(skill) {
  if (!skill || typeof skill !== 'string') {
    return '';
  }

  // Convert to lowercase
  let normalized = skill.toLowerCase();
  
  // Trim whitespace
  normalized = normalized.trim();
  
  // Remove duplicate spaces
  normalized = normalized.replace(/\s+/g, ' ');
  
  // Remove dots and hyphens (but keep spaces for multi-word skills)
  normalized = normalized.replace(/[.\-]/g, ' ');
  
  // Remove any remaining duplicate spaces after character replacement
  normalized = normalized.replace(/\s+/g, ' ');
  
  // Trim again
  normalized = normalized.trim();
  
  // Check if this skill has a mapped alias
  if (SKILL_ALIASES[normalized]) {
    return SKILL_ALIASES[normalized];
  }
  
  // Return the normalized skill
  return normalized;
}

/**
 * Normalize an array of skills
 * - Normalizes each skill using normalizeSkill()
 * - Removes duplicates using Set
 * - Removes empty strings
 * - Sorts alphabetically
 * 
 * @param {string[]} skills - Array of skill names to normalize
 * @returns {string[]} - Array of normalized, unique, sorted skills
 */
function normalizeSkillsArray(skills) {
  if (!Array.isArray(skills)) {
    return [];
  }

  // Normalize each skill and remove duplicates using Set
  const normalizedSet = new Set();
  
  skills.forEach(skill => {
    const normalized = normalizeSkill(skill);
    if (normalized) {
      normalizedSet.add(normalized);
    }
  });

  // Convert to array and sort alphabetically
  return Array.from(normalizedSet).sort();
}

/**
 * Build complete skills array from categorized skills
 * - Combines all categories into one array
 * - Normalizes all skills
 * - Removes duplicates
 * - Sorts alphabetically
 * 
 * @param {Object} categorizedSkills - Object with skill categories
 * @returns {string[]} - Complete normalized skills array
 */
function buildCompleteSkillsArray(categorizedSkills) {
  if (!categorizedSkills || typeof categorizedSkills !== 'object') {
    return [];
  }

  // Extract all skill arrays from categories
  const allSkills = [];
  
  // Iterate through all categories and collect skills
  Object.values(categorizedSkills).forEach(categorySkills => {
    if (Array.isArray(categorySkills)) {
      allSkills.push(...categorySkills);
    }
  });

  // Normalize and deduplicate
  return normalizeSkillsArray(allSkills);
}

/**
 * Calculate matching skills between two arrays
 * 
 * @param {string[]} candidateSkills - Normalized candidate skills
 * @param {string[]} recruiterSkills - Normalized recruiter required skills
 * @returns {Object} - Object containing matched and missing skills
 */
function calculateSkillMatch(candidateSkills, recruiterSkills) {
  // Convert candidate skills to Set for O(1) lookup
  const candidateSkillSet = new Set(candidateSkills);
  
  // Find matched skills
  const matchedSkills = recruiterSkills.filter(skill => 
    candidateSkillSet.has(skill)
  );
  
  // Find missing skills
  const missingSkills = recruiterSkills.filter(skill => 
    !candidateSkillSet.has(skill)
  );
  
  return {
    matchedSkills,
    missingSkills
  };
}

/**
 * Calculate match percentage
 * 
 * @param {number} matchedCount - Number of matched skills
 * @param {number} requiredCount - Total number of required skills
 * @returns {number} - Match percentage (0-100)
 */
function calculateMatchPercentage(matchedCount, requiredCount) {
  if (requiredCount === 0) {
    return 0;
  }
  return Math.round((matchedCount / requiredCount) * 100);
}

export {
  normalizeSkill,
  normalizeSkillsArray,
  buildCompleteSkillsArray,
  calculateSkillMatch,
  calculateMatchPercentage
};
