// Career Discovery Journey — All static data and scoring logic

export const WORLDS = [
  { id: 'tech', icon: '💻', name: 'Tech World', desc: 'Code, AI, apps & machines', tags: ['cs', 'ai', 'data', 'cyber'] },
  { id: 'creator', icon: '🎨', name: 'Creator World', desc: 'Design, art, content & media', tags: ['design', 'media', 'art', 'writing'] },
  { id: 'business', icon: '💼', name: 'Business World', desc: 'Money, markets & leadership', tags: ['finance', 'marketing', 'management', 'startup'] },
  { id: 'people', icon: '🤝', name: 'People World', desc: 'Helping, teaching & connecting', tags: ['psychology', 'education', 'social', 'hr'] },
  { id: 'science', icon: '🔬', name: 'Science World', desc: 'Research, discovery & experiments', tags: ['bio', 'chem', 'physics', 'research'] },
  { id: 'nature', icon: '🌿', name: 'Nature World', desc: 'Environment, animals & earth', tags: ['environment', 'agriculture', 'wildlife', 'geo'] },
  { id: 'health', icon: '🏥', name: 'Health World', desc: 'Medicine, fitness & wellness', tags: ['medicine', 'fitness', 'nutrition', 'pharma'] },
  { id: 'builder', icon: '🏗️', name: 'Builder World', desc: 'Structures, machines & systems', tags: ['mechanical', 'civil', 'electrical', 'architecture'] },
  { id: 'law', icon: '⚖️', name: 'Justice World', desc: 'Law, policy & social change', tags: ['law', 'politics', 'advocacy', 'policy'] },
];

export const RAPID_FIRE = [
  { a: { text: 'Build an app', emoji: '📱', tags: { cs: 2, ai: 1 } }, b: { text: 'Design a poster', emoji: '🎨', tags: { design: 2, art: 1 } } },
  { a: { text: 'Solve a mystery', emoji: '🔍', tags: { data: 2, research: 1 } }, b: { text: 'Talk to a crowd', emoji: '🎤', tags: { marketing: 2, education: 1 } } },
  { a: { text: 'Write code all night', emoji: '🌙', tags: { cs: 2, cyber: 1 } }, b: { text: 'Brainstorm ideas', emoji: '💡', tags: { startup: 2, design: 1 } } },
  { a: { text: 'Analyze data charts', emoji: '📊', tags: { data: 2, finance: 1 } }, b: { text: 'Record a video', emoji: '🎬', tags: { media: 2, writing: 1 } } },
  { a: { text: 'Fix a broken machine', emoji: '🔧', tags: { mechanical: 2, electrical: 1 } }, b: { text: 'Comfort a friend', emoji: '💛', tags: { psychology: 2, social: 1 } } },
  { a: { text: 'Run experiments', emoji: '🧪', tags: { research: 2, bio: 1 } }, b: { text: 'Plan a campaign', emoji: '📣', tags: { marketing: 2, management: 1 } } },
  { a: { text: 'Draw blueprints', emoji: '📐', tags: { architecture: 2, civil: 1 } }, b: { text: 'Negotiate a deal', emoji: '🤝', tags: { finance: 2, management: 1 } } },
  { a: { text: 'Teach someone new', emoji: '📚', tags: { education: 2, social: 1 } }, b: { text: 'Hack a system', emoji: '🛡️', tags: { cyber: 2, cs: 1 } } },
  { a: { text: 'Grow a garden', emoji: '🌱', tags: { agriculture: 2, environment: 1 } }, b: { text: 'Trade stocks', emoji: '📈', tags: { finance: 2, data: 1 } } },
  { a: { text: 'Treat a patient', emoji: '🩺', tags: { medicine: 2, bio: 1 } }, b: { text: 'Argue in court', emoji: '⚖️', tags: { law: 2, advocacy: 1 } } },
];

export const MISSIONS = [
  {
    scenario: '🚀 A startup is about to fail. The team has 48 hours. What do you do?',
    options: [
      { text: 'Fix the broken code', emoji: '💻', tags: { cs: 3, ai: 1 } },
      { text: 'Redesign the product', emoji: '🎨', tags: { design: 3, art: 1 } },
      { text: 'Pitch to investors', emoji: '💰', tags: { finance: 2, marketing: 2 } },
      { text: 'Analyze user data', emoji: '📊', tags: { data: 3, research: 1 } },
    ],
  },
  {
    scenario: '🏫 Your school wants to go completely digital. You volunteer to lead. What\'s your move?',
    options: [
      { text: 'Build the school app', emoji: '📱', tags: { cs: 3, cyber: 1 } },
      { text: 'Design the experience', emoji: '✨', tags: { design: 2, art: 2 } },
      { text: 'Train teachers & students', emoji: '🎓', tags: { education: 3, social: 1 } },
      { text: 'Manage the project', emoji: '📋', tags: { management: 3, startup: 1 } },
    ],
  },
  {
    scenario: '🌍 A new virus is spreading in a remote village. You\'re sent to help.',
    options: [
      { text: 'Research a cure', emoji: '🔬', tags: { research: 2, bio: 2 } },
      { text: 'Treat the patients', emoji: '🏥', tags: { medicine: 3, nutrition: 1 } },
      { text: 'Spread awareness online', emoji: '📢', tags: { media: 2, social: 2 } },
      { text: 'Build a supply system', emoji: '🚛', tags: { management: 2, civil: 2 } },
    ],
  },
  {
    scenario: '🤖 You got early access to a powerful AI. How do you use it?',
    options: [
      { text: 'Train it to solve problems', emoji: '🧠', tags: { ai: 3, data: 1 } },
      { text: 'Make it create art', emoji: '🖼️', tags: { art: 2, design: 2 } },
      { text: 'Use it to help students', emoji: '📖', tags: { education: 2, psychology: 2 } },
      { text: 'Build a business around it', emoji: '💼', tags: { startup: 3, marketing: 1 } },
    ],
  },
  {
    scenario: '⚡ A city just lost all power. It\'s up to your team to fix it.',
    options: [
      { text: 'Fix the power grid', emoji: '🔌', tags: { electrical: 3, mechanical: 1 } },
      { text: 'Set up solar panels', emoji: '☀️', tags: { environment: 2, physics: 2 } },
      { text: 'Coordinate rescue teams', emoji: '🚨', tags: { management: 2, social: 2 } },
      { text: 'Write emergency protocols', emoji: '📝', tags: { law: 2, policy: 2 } },
    ],
  },
];

export const REALITY_CHECKS = [
  { q: '💻 Can you sit and work on a laptop for hours?', tag: 'desk', emoji: '🪑' },
  { q: '🔢 Do you actually enjoy math & logic puzzles?', tag: 'math', emoji: '🧮' },
  { q: '🎤 Are you comfortable speaking in public?', tag: 'public', emoji: '🗣️' },
  { q: '🧪 Do you like doing detailed, precise work?', tag: 'detail', emoji: '🔬' },
];

// ── Domain Narrowing Questions (generated dynamically) ──────────────────
export const DOMAIN_QUESTIONS = {
  tech: {
    question: 'In the tech universe, which path calls to you?',
    options: [
      { text: 'Build Smart Apps', emoji: '📱', sub: 'Software & Mobile Dev', tags: { cs: 3 } },
      { text: 'Teach Machines to Think', emoji: '🤖', sub: 'AI & Machine Learning', tags: { ai: 3 } },
      { text: 'Protect Digital Worlds', emoji: '🛡️', sub: 'Cybersecurity', tags: { cyber: 3 } },
      { text: 'Decode Hidden Patterns', emoji: '📊', sub: 'Data Science', tags: { data: 3 } },
    ],
  },
  creator: {
    question: 'What kind of creator are you?',
    options: [
      { text: 'Design Interfaces', emoji: '🖥️', sub: 'UI/UX Design', tags: { design: 3 } },
      { text: 'Tell Visual Stories', emoji: '🎬', sub: 'Film & Animation', tags: { media: 3 } },
      { text: 'Write & Blog', emoji: '✍️', sub: 'Content & Writing', tags: { writing: 3 } },
      { text: 'Create Art & Illustrations', emoji: '🎨', sub: 'Graphic & Digital Art', tags: { art: 3 } },
    ],
  },
  business: {
    question: 'What\'s your business superpower?',
    options: [
      { text: 'Start a Company', emoji: '🚀', sub: 'Entrepreneurship', tags: { startup: 3 } },
      { text: 'Grow Brands', emoji: '📣', sub: 'Marketing & Branding', tags: { marketing: 3 } },
      { text: 'Manage Money', emoji: '💰', sub: 'Finance & Investment', tags: { finance: 3 } },
      { text: 'Lead Teams', emoji: '👑', sub: 'Management & Strategy', tags: { management: 3 } },
    ],
  },
  people: {
    question: 'How do you connect with people?',
    options: [
      { text: 'Understand Minds', emoji: '🧠', sub: 'Psychology & Counseling', tags: { psychology: 3 } },
      { text: 'Teach & Inspire', emoji: '🎓', sub: 'Education & Training', tags: { education: 3 } },
      { text: 'Fight for Rights', emoji: '✊', sub: 'Social Work & NGOs', tags: { social: 3 } },
      { text: 'Recruit & Develop', emoji: '🤝', sub: 'HR & People Ops', tags: { hr: 3 } },
    ],
  },
  science: {
    question: 'Which science frontier excites you?',
    options: [
      { text: 'Explore Life', emoji: '🧬', sub: 'Biology & Biotech', tags: { bio: 3 } },
      { text: 'Mix & React', emoji: '⚗️', sub: 'Chemistry & Materials', tags: { chem: 3 } },
      { text: 'Understand the Universe', emoji: '🌌', sub: 'Physics & Astronomy', tags: { physics: 3 } },
      { text: 'Discover Deep Truths', emoji: '📖', sub: 'Pure Research', tags: { research: 3 } },
    ],
  },
  nature: {
    question: 'How do you want to save the planet?',
    options: [
      { text: 'Protect Ecosystems', emoji: '🌳', sub: 'Environmental Science', tags: { environment: 3 } },
      { text: 'Feed the World', emoji: '🌾', sub: 'Agriculture & Food Tech', tags: { agriculture: 3 } },
      { text: 'Save Animals', emoji: '🐾', sub: 'Wildlife & Zoology', tags: { wildlife: 3 } },
      { text: 'Map the Earth', emoji: '🗺️', sub: 'Geography & GIS', tags: { geo: 3 } },
    ],
  },
  health: {
    question: 'Your health mission is...',
    options: [
      { text: 'Heal People', emoji: '🩺', sub: 'Medicine & Surgery', tags: { medicine: 3 } },
      { text: 'Train Bodies', emoji: '💪', sub: 'Sports & Fitness', tags: { fitness: 3 } },
      { text: 'Nourish Lives', emoji: '🥗', sub: 'Nutrition & Dietetics', tags: { nutrition: 3 } },
      { text: 'Create Medicines', emoji: '💊', sub: 'Pharmacy & Biotech', tags: { pharma: 3 } },
    ],
  },
  builder: {
    question: 'What do you want to build?',
    options: [
      { text: 'Design Machines', emoji: '⚙️', sub: 'Mechanical Engineering', tags: { mechanical: 3 } },
      { text: 'Build Structures', emoji: '🏛️', sub: 'Civil Engineering', tags: { civil: 3 } },
      { text: 'Power Systems', emoji: '⚡', sub: 'Electrical Engineering', tags: { electrical: 3 } },
      { text: 'Shape Spaces', emoji: '🏠', sub: 'Architecture', tags: { architecture: 3 } },
    ],
  },
  law: {
    question: 'Your justice path is...',
    options: [
      { text: 'Practice Law', emoji: '⚖️', sub: 'Lawyer & Advocate', tags: { law: 3 } },
      { text: 'Shape Policy', emoji: '📜', sub: 'Public Policy', tags: { policy: 3 } },
      { text: 'Lead Nations', emoji: '🏛️', sub: 'Politics & Governance', tags: { politics: 3 } },
      { text: 'Defend Rights', emoji: '🕊️', sub: 'NGO & Advocacy', tags: { advocacy: 3 } },
    ],
  },
};

// ── Career Mapping ──────────────────────────────────────────────────────
export const CAREERS = {
  cs: { title: 'Software Engineer', emoji: '💻', why: 'You love building things with code and solving complex puzzles. Software engineering lets you create the apps and systems that power the world.', alts: ['Full-Stack Developer', 'Mobile App Developer', 'DevOps Engineer'], task: 'Try building a simple calculator app using HTML & JavaScript today!' },
  ai: { title: 'AI / ML Engineer', emoji: '🤖', why: 'You\'re fascinated by smart systems and want machines to think. AI Engineering puts you at the cutting edge of technology.', alts: ['Data Scientist', 'Robotics Engineer', 'NLP Specialist'], task: 'Try training a simple chatbot using a free tool like Teachable Machine!' },
  data: { title: 'Data Scientist', emoji: '📊', why: 'You see patterns where others see chaos. Data Science lets you uncover hidden insights that drive real decisions.', alts: ['Business Analyst', 'Data Engineer', 'Statistician'], task: 'Try visualizing a dataset on Kaggle using Python or Google Sheets!' },
  cyber: { title: 'Cybersecurity Analyst', emoji: '🛡️', why: 'You think like a hacker to protect others. Cybersecurity is a high-impact field that\'s always in demand.', alts: ['Ethical Hacker', 'Security Architect', 'Digital Forensics'], task: 'Try a beginner challenge on TryHackMe or PicoCTF today!' },
  design: { title: 'UI/UX Designer', emoji: '🎨', why: 'You care deeply about how things look AND feel. Great design shapes how millions experience technology.', alts: ['Product Designer', 'Interaction Designer', 'Design System Lead'], task: 'Try redesigning your favorite app\'s login screen in Figma!' },
  media: { title: 'Content Creator / Filmmaker', emoji: '🎬', why: 'You\'re a natural storyteller with a visual eye. The creator economy is booming — your voice matters.', alts: ['Video Editor', 'Social Media Manager', 'Podcast Producer'], task: 'Create a 60-second video about something you love today!' },
  art: { title: 'Digital Artist / Illustrator', emoji: '🖌️', why: 'Your creativity flows through visuals. Digital art is shaping games, movies, and the metaverse.', alts: ['Game Artist', 'Concept Artist', 'Motion Designer'], task: 'Draw a character or scene using a free tool like Krita!' },
  writing: { title: 'Content Writer / Copywriter', emoji: '✍️', why: 'Words are your superpower. Great writing drives brands, moves people, and builds communities.', alts: ['Technical Writer', 'Journalist', 'Screenwriter'], task: 'Write a 200-word blog post on a topic you care about!' },
  finance: { title: 'Financial Analyst', emoji: '💰', why: 'Numbers tell you stories others can\'t hear. Finance careers put you at the center of global markets.', alts: ['Investment Banker', 'Chartered Accountant', 'FinTech Developer'], task: 'Research one stock and write a mini analysis on why it\'s a buy or sell!' },
  marketing: { title: 'Marketing Strategist', emoji: '📣', why: 'You understand people and know how to get their attention. Marketing is the engine behind every successful brand.', alts: ['Growth Hacker', 'Brand Manager', 'SEO Specialist'], task: 'Create a mock social media campaign for your favorite brand!' },
  management: { title: 'Product Manager', emoji: '📋', why: 'You\'re a natural leader who sees the big picture. Product managers shape the future of technology products.', alts: ['Project Manager', 'Operations Manager', 'Strategy Consultant'], task: 'Write a 1-page product brief for an app idea you have!' },
  startup: { title: 'Entrepreneur / Founder', emoji: '🚀', why: 'You don\'t just dream — you build. Entrepreneurship lets you create something that didn\'t exist before.', alts: ['Startup Founder', 'Venture Capitalist', 'Innovation Consultant'], task: 'Write your startup idea in 3 sentences and tell a friend!' },
  psychology: { title: 'Psychologist / Counselor', emoji: '🧠', why: 'You understand emotions deeply. Psychology helps people heal, grow, and find meaning in life.', alts: ['Clinical Psychologist', 'Organizational Psychologist', 'Life Coach'], task: 'Listen to a friend\'s problem today and practice active listening!' },
  education: { title: 'Educator / EdTech Designer', emoji: '🎓', why: 'You light up when teaching. Education roles let you shape future generations and build learning tools.', alts: ['Curriculum Designer', 'Training Specialist', 'Online Course Creator'], task: 'Explain a concept you know well in a 2-minute video!' },
  social: { title: 'Social Worker / NGO Leader', emoji: '🌍', why: 'You fight for those who can\'t fight for themselves. Social work creates real, tangible change.', alts: ['Community Organizer', 'Humanitarian Worker', 'Policy Advocate'], task: 'Volunteer for 1 hour at a local community organization!' },
  hr: { title: 'HR Manager / People Ops', emoji: '🤝', why: 'You bring teams together. HR is no longer just paperwork — it\'s about culture and growth.', alts: ['Talent Recruiter', 'Employee Experience Lead', 'Diversity & Inclusion Lead'], task: 'Interview a friend about their dream job and take notes!' },
  bio: { title: 'Biotechnologist', emoji: '🧬', why: 'You want to unlock the secrets of life itself. Biotech is solving the world\'s biggest health challenges.', alts: ['Genetic Counselor', 'Bioinformatician', 'Lab Scientist'], task: 'Watch a CRISPR documentary and write 3 things you learned!' },
  chem: { title: 'Chemical Engineer', emoji: '⚗️', why: 'You love reactions and transformations. Chemistry powers medicines, materials, and energy.', alts: ['Materials Scientist', 'Pharmaceutical Chemist', 'Food Technologist'], task: 'Do a simple kitchen chemistry experiment safely at home!' },
  physics: { title: 'Physicist / Astrophysicist', emoji: '🌌', why: 'You ask the biggest questions in the universe. Physics lets you explore reality at its deepest level.', alts: ['Quantum Computing Researcher', 'Aerospace Engineer', 'Optics Engineer'], task: 'Watch a Veritasium or 3Blue1Brown video and solve a physics puzzle!' },
  research: { title: 'Research Scientist', emoji: '🔬', why: 'You live to discover. Research scientists push the boundaries of human knowledge every day.', alts: ['Lab Director', 'Academic Professor', 'R&D Specialist'], task: 'Read one research abstract on Google Scholar about something cool!' },
  environment: { title: 'Environmental Scientist', emoji: '🌳', why: 'The planet needs you. Environmental science addresses climate change and ecosystem preservation.', alts: ['Sustainability Consultant', 'Clean Energy Engineer', 'Conservation Biologist'], task: 'Calculate your carbon footprint using an online calculator!' },
  agriculture: { title: 'Agricultural Scientist / AgriTech', emoji: '🌾', why: 'You want to feed the world sustainably. AgriTech combines farming with cutting-edge innovation.', alts: ['Soil Scientist', 'Food Safety Expert', 'Vertical Farming Engineer'], task: 'Plant a seed today and track its growth for a week!' },
  wildlife: { title: 'Wildlife Biologist', emoji: '🐾', why: 'Animals fascinate you. Wildlife biology lets you protect and study the species that share our planet.', alts: ['Veterinarian', 'Marine Biologist', 'Zoo Curator'], task: 'Visit a local park and identify 5 different plant or animal species!' },
  geo: { title: 'Geographer / GIS Specialist', emoji: '🗺️', why: 'Maps are more than locations — they\'re stories. GIS technology shapes urban planning and disaster response.', alts: ['Urban Planner', 'Remote Sensing Analyst', 'Cartographer'], task: 'Explore Google Earth and find 3 geographic features you didn\'t know existed!' },
  medicine: { title: 'Doctor / Physician', emoji: '🩺', why: 'You want to heal. Medicine is one of the most impactful and respected professions in the world.', alts: ['Surgeon', 'Psychiatrist', 'Public Health Specialist'], task: 'Learn basic first aid from a Red Cross YouTube video!' },
  fitness: { title: 'Sports Scientist / Coach', emoji: '💪', why: 'Movement is your language. Sports science combines biology, psychology, and performance.', alts: ['Personal Trainer', 'Physiotherapist', 'Sports Psychologist'], task: 'Design a 15-minute workout routine for a friend!' },
  nutrition: { title: 'Nutritionist / Dietitian', emoji: '🥗', why: 'You know food is medicine. Nutrition careers help people live healthier, longer lives.', alts: ['Food Scientist', 'Clinical Dietitian', 'Wellness Coach'], task: 'Plan a balanced meal for tomorrow using a food tracking app!' },
  pharma: { title: 'Pharmacist / Drug Researcher', emoji: '💊', why: 'You want to create the medicines that save lives. Pharma is where science meets healing.', alts: ['Clinical Research Associate', 'Regulatory Affairs Specialist', 'Pharmacologist'], task: 'Read a drug label and research how one common medicine works!' },
  mechanical: { title: 'Mechanical Engineer', emoji: '⚙️', why: 'You love machines. Mechanical engineering is one of the broadest and most versatile engineering fields.', alts: ['Automotive Engineer', 'Robotics Engineer', 'HVAC Engineer'], task: 'Take apart a simple gadget and try to understand how it works!' },
  civil: { title: 'Civil Engineer', emoji: '🏛️', why: 'You want to build infrastructure that lasts. Civil engineering shapes cities and communities.', alts: ['Structural Engineer', 'Transportation Engineer', 'Construction Manager'], task: 'Research how a famous bridge was built and draw its structure!' },
  electrical: { title: 'Electrical Engineer', emoji: '⚡', why: 'You\'re drawn to power and circuits. Electrical engineering powers everything from homes to rockets.', alts: ['Electronics Engineer', 'Power Systems Engineer', 'Semiconductor Designer'], task: 'Build a simple LED circuit using a battery and wires!' },
  architecture: { title: 'Architect', emoji: '🏠', why: 'You imagine spaces before they exist. Architecture blends art, science, and human experience.', alts: ['Interior Designer', 'Landscape Architect', 'Urban Designer'], task: 'Sketch the floor plan of your dream room or house!' },
  law: { title: 'Lawyer / Legal Advisor', emoji: '⚖️', why: 'You argue with logic and defend with passion. Law shapes society and protects justice.', alts: ['Corporate Lawyer', 'Criminal Lawyer', 'International Law'], task: 'Read about a famous court case and form your own opinion!' },
  policy: { title: 'Public Policy Analyst', emoji: '📜', why: 'You want systems to be fair. Policy work shapes the rules that govern millions.', alts: ['Think Tank Researcher', 'Government Advisor', 'UN Official'], task: 'Read about a current government policy and write a 100-word opinion!' },
  politics: { title: 'Political Leader / Diplomat', emoji: '🏛️', why: 'You want to lead change at scale. Politics and diplomacy shape nations and global relations.', alts: ['Civil Servant', 'Foreign Service Officer', 'Political Analyst'], task: 'Attend or watch a local council meeting and take notes!' },
  advocacy: { title: 'Human Rights Advocate', emoji: '🕊️', why: 'You fight for what\'s right. Advocacy turns passion into policies that protect vulnerable communities.', alts: ['Legal Aid Worker', 'NGO Director', 'Community Advocate'], task: 'Learn about one human rights issue and share it on social media!' },
};

// ── Cross-Domain Hybrid Careers ─────────────────────────────────────────
export const CROSS_DOMAIN_MAP = [
  { combo: ['tech', 'creator'], emoji: '🖥️', title: 'UI/UX Designer', formula: 'Tech + Creativity', desc: 'Design beautiful digital experiences where code meets art', tag: 'design' },
  { combo: ['tech', 'business'], emoji: '📊', title: 'Business Analyst', formula: 'Data + Business', desc: 'Use data to drive strategic decisions and solve business puzzles', tag: 'data' },
  { combo: ['tech', 'health'], emoji: '🏥', title: 'Health Tech Engineer', formula: 'Tech + Health', desc: 'Build the apps and devices that save lives in modern healthcare', tag: 'cs' },
  { combo: ['tech', 'science'], emoji: '🧬', title: 'Bioinformatics Specialist', formula: 'Tech + Science', desc: 'Decode genomes and biological data using powerful algorithms', tag: 'ai' },
  { combo: ['creator', 'business'], emoji: '📣', title: 'Brand Strategist', formula: 'Creativity + Business', desc: 'Shape how the world sees brands through visual storytelling', tag: 'marketing' },
  { combo: ['creator', 'people'], emoji: '🎓', title: 'Instructional Designer', formula: 'Creativity + Education', desc: 'Create engaging learning experiences that transform education', tag: 'education' },
  { combo: ['science', 'health'], emoji: '💊', title: 'Biomedical Researcher', formula: 'Science + Health', desc: 'Discover cures and develop new treatments that heal the world', tag: 'bio' },
  { combo: ['science', 'nature'], emoji: '🌿', title: 'Conservation Scientist', formula: 'Science + Nature', desc: 'Use scientific methods to protect endangered ecosystems', tag: 'environment' },
  { combo: ['business', 'people'], emoji: '🤝', title: 'HR Tech Specialist', formula: 'Business + People', desc: 'Build people-first cultures using technology and empathy', tag: 'hr' },
  { combo: ['people', 'health'], emoji: '🧠', title: 'Clinical Psychologist', formula: 'People + Health', desc: 'Heal minds and transform lives through therapy and research', tag: 'psychology' },
  { combo: ['builder', 'nature'], emoji: '☀️', title: 'Renewable Energy Engineer', formula: 'Engineering + Nature', desc: 'Design sustainable energy systems that power a greener future', tag: 'electrical' },
  { combo: ['builder', 'tech'], emoji: '🤖', title: 'Robotics Engineer', formula: 'Engineering + Tech', desc: 'Build intelligent machines that work alongside humans', tag: 'mechanical' },
  { combo: ['law', 'tech'], emoji: '🔐', title: 'Cyber Law Specialist', formula: 'Law + Tech', desc: 'Navigate the legal frontiers of data privacy and digital rights', tag: 'law' },
  { combo: ['law', 'people'], emoji: '🕊️', title: 'Human Rights Lawyer', formula: 'Law + People', desc: 'Defend the vulnerable and fight injustice through legal action', tag: 'advocacy' },
];

// ── Scoring helpers ─────────────────────────────────────────────────────
export function addScores(currentScores, newTags) {
  const updated = { ...currentScores };
  Object.entries(newTags).forEach(([tag, score]) => {
    updated[tag] = (updated[tag] || 0) + score;
  });
  return updated;
}

export function getTopTags(scores, n = 3) {
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([tag]) => tag);
}

export function getTraitLabels(topTags) {
  const map = {
    cs: '🔧 Problem Solver', ai: '🤖 Tech Explorer', data: '📊 Pattern Finder',
    cyber: '🛡️ Digital Guardian', design: '🎨 Creator', media: '🎬 Storyteller',
    art: '🖌️ Visual Thinker', writing: '✍️ Word Crafter', finance: '💰 Number Master',
    marketing: '📣 Influencer', management: '👑 Leader', startup: '🚀 Innovator',
    psychology: '🧠 Mind Reader', education: '🎓 Mentor', social: '🌍 Changemaker',
    hr: '🤝 Connector', bio: '🧬 Life Explorer', chem: '⚗️ Transformer',
    physics: '🌌 Universe Seeker', research: '🔬 Discoverer', environment: '🌳 Earth Protector',
    agriculture: '🌾 Nurturer', wildlife: '🐾 Animal Ally', geo: '🗺️ Explorer',
    medicine: '🩺 Healer', fitness: '💪 Body Architect', nutrition: '🥗 Wellness Guide',
    pharma: '💊 Medicine Maker', mechanical: '⚙️ Machine Whisperer', civil: '🏛️ Builder',
    electrical: '⚡ Energy Master', architecture: '🏠 Space Designer',
    law: '⚖️ Justice Seeker', policy: '📜 Rule Shaper', politics: '🏛️ Leader',
    advocacy: '🕊️ Rights Defender',
  };
  return topTags.map((t) => map[t] || '✨ Explorer');
}

export function getBestCareer(scores, realityAnswers) {
  let adjusted = { ...scores };

  // Reality check filters
  if (realityAnswers.desk === 'no') {
    ['cs', 'ai', 'data', 'cyber', 'writing', 'finance'].forEach((t) => {
      adjusted[t] = (adjusted[t] || 0) * 0.6;
    });
  }
  if (realityAnswers.math === 'no') {
    ['data', 'finance', 'physics', 'ai', 'electrical'].forEach((t) => {
      adjusted[t] = (adjusted[t] || 0) * 0.6;
    });
  }
  if (realityAnswers.public === 'yes') {
    ['marketing', 'education', 'management', 'politics', 'advocacy'].forEach((t) => {
      adjusted[t] = (adjusted[t] || 0) * 1.3;
    });
  }
  if (realityAnswers.detail === 'yes') {
    ['research', 'medicine', 'pharma', 'architecture', 'law'].forEach((t) => {
      adjusted[t] = (adjusted[t] || 0) * 1.2;
    });
  }

  const top = getTopTags(adjusted, 3);
  const best = CAREERS[top[0]] || CAREERS.cs;
  const alt1 = CAREERS[top[1]];
  const alt2 = CAREERS[top[2]];

  return { best, alternatives: [alt1, alt2].filter(Boolean) };
}
