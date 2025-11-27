export type GamifiedDifficulty = "Easy" | "Normal" | "Hard" | "Heroic";

export type GamifiedMission = {
  id: string;
  title: string;
  lore: string;
  description: string;
  category: string;
  xp: number;
  badge: string;
  levelRequirement: number;
  difficulty: GamifiedDifficulty;
  chain?: string; // groups missions into story arcs
  rewards: {
    xp: number;
    badge?: string;
    item?: string; // items for inventory
  };
};

export const gamifiedMissions: GamifiedMission[] = [
  // Beginner Arc – “The Awakening”
  {
    id: "boot-up-terminal",
    title: "Boot Up Your Terminal",
    lore: "Deep beneath the Obelisk, the old systems hum to life. Your first command will echo through the archive.",
    description: "Install the required tools, open your terminal, and run a simple diagnostic command.",
    category: "The Awakening",
    xp: 50,
    badge: "Systems Online",
    levelRequirement: 1,
    difficulty: "Easy",
    chain: "The Awakening",
    rewards: {
      xp: 50,
      badge: "Systems Online",
      item: "Obelisk Shard",
    },
  },
  {
    id: "first-script",
    title: "Your First Script",
    lore: "Scripts are the spellwork of this age. Your first incantation will teach the machines your name.",
    description: "Create and run a simple script that prints a personalized greeting.",
    category: "The Awakening",
    xp: 50,
    badge: "Initiate",
    levelRequirement: 1,
    difficulty: "Easy",
    chain: "The Awakening",
    rewards: {
      xp: 50,
      badge: "Initiate",
      item: "Design Token",
    },
  },
  {
    id: "tools-of-power",
    title: "Tools of Power",
    lore: "Editors, browsers, CLIs—these are your artifacts. Bind them to your workflow.",
    description: "Configure your editor, browser devtools, and terminal for efficient development.",
    category: "The Awakening",
    xp: 75,
    badge: "Operator",
    levelRequirement: 1,
    difficulty: "Normal",
    chain: "The Awakening",
    rewards: {
      xp: 75,
      badge: "Operator",
      item: "API Key Fragment",
    },
  },

  // Core Skills Arc – “Path of the Builder”
  {
    id: "first-web-app",
    title: "Forge Your First Web App",
    lore: "In the glow of the Obelisk, you assemble components into a living interface.",
    description: "Bootstrap a basic Next.js app with a single interactive page.",
    category: "Path of the Builder",
    xp: 100,
    badge: "Apprentice Architect",
    levelRequirement: 2,
    difficulty: "Normal",
    chain: "Path of the Builder",
    rewards: {
      xp: 100,
      badge: "Apprentice Architect",
      item: "Design Token",
    },
  },
  {
    id: "api-vault",
    title: "Decode the API Vault",
    lore: "Behind every interface lies a vault of data. Learn to speak its language.",
    description: "Call a public API, handle loading and error states, and render the response.",
    category: "Path of the Builder",
    xp: 120,
    badge: "Data Whisperer",
    levelRequirement: 3,
    difficulty: "Normal",
    chain: "Path of the Builder",
    rewards: {
      xp: 120,
      badge: "Data Whisperer",
      item: "API Key Fragment",
    },
  },
  {
    id: "master-gitblade",
    title: "Master the Gitblade",
    lore: "Branches, merges, and histories intertwine like arcane timelines. Wield them without fear.",
    description: "Initialize a repo, create branches, open a PR, and resolve a merge conflict.",
    category: "Path of the Builder",
    xp: 150,
    badge: "Version Warden",
    levelRequirement: 4,
    difficulty: "Hard",
    chain: "Path of the Builder",
    rewards: {
      xp: 150,
      badge: "Version Warden",
      item: "Obelisk Shard",
    },
  },

  // Web3 Arc – “The On-Chain Frontier”
  {
    id: "wallet-sync",
    title: "Wallet Sync Ritual",
    lore: "Keys and signatures replace passwords and sessions. Bind a wallet to your app.",
    description: "Connect a crypto wallet to a simple dApp interface.",
    category: "The On-Chain Frontier",
    xp: 100,
    badge: "Keybearer",
    levelRequirement: 3,
    difficulty: "Normal",
    chain: "The On-Chain Frontier",
    rewards: {
      xp: 100,
      badge: "Keybearer",
      item: "Solana Rune",
    },
  },
  {
    id: "on-chain-basics",
    title: "On-Chain Basics",
    lore: "Blocks, slots, and transactions flow through the network like pulses of mana.",
    description: "Read on-chain data and display key metrics from a blockchain RPC.",
    category: "The On-Chain Frontier",
    xp: 150,
    badge: "Explorer of Blocks",
    levelRequirement: 4,
    difficulty: "Hard",
    chain: "The On-Chain Frontier",
    rewards: {
      xp: 150,
      badge: "Explorer of Blocks",
      item: "Solana Rune",
    },
  },
  {
    id: "first-dapp",
    title: "Craft Your First dApp",
    lore: "Code solidifies into a contract; users interact with rules you defined.",
    description: "Build a minimal dApp that can read and write simple on-chain state.",
    category: "The On-Chain Frontier",
    xp: 200,
    badge: "dApp Artificer",
    levelRequirement: 5,
    difficulty: "Heroic",
    chain: "The On-Chain Frontier",
    rewards: {
      xp: 200,
      badge: "dApp Artificer",
      item: "AI Core Unit",
    },
  },

  // Creative Arc – “The Art Domain”
  {
    id: "minimalist-sigil",
    title: "Design a Minimalist Sigil",
    lore: "Symbols carry power. Craft a mark that could live on interfaces and banners.",
    description: "Design a simple logo or mark using a vector tool or Figma.",
    category: "The Art Domain",
    xp: 75,
    badge: "Visual Weaver",
    levelRequirement: 2,
    difficulty: "Easy",
    chain: "The Art Domain",
    rewards: {
      xp: 75,
      item: "Design Token",
    },
  },
  {
    id: "first-sequence",
    title: "Edit Your First Sequence",
    lore: "Time itself becomes your canvas. Cut, sync, and polish a short clip.",
    description: "Edit a short video sequence with basic cuts, transitions, and audio.",
    category: "The Art Domain",
    xp: 100,
    badge: "Sequence Crafter",
    levelRequirement: 3,
    difficulty: "Normal",
    chain: "The Art Domain",
    rewards: {
      xp: 100,
      badge: "Sequence Crafter",
      item: "Design Token",
    },
  },

  // Advanced Arc – “Become the Engineer”
  {
    id: "deploy-outer-net",
    title: "Deploy to the Outer Net",
    lore: "Your code leaves the safe confines of localhost and faces real traffic.",
    description: "Deploy a small app to a hosting platform and configure environment variables.",
    category: "Become the Engineer",
    xp: 200,
    badge: "Edge Deployer",
    levelRequirement: 5,
    difficulty: "Hard",
    chain: "Become the Engineer",
    rewards: {
      xp: 200,
      badge: "Edge Deployer",
      item: "API Key Fragment",
    },
  },
  {
    id: "summon-own-api",
    title: "Summon Your Own API",
    lore: "Endpoints rise from the sea of code, answering only to your contracts.",
    description: "Create a small REST or RPC-style API and consume it from a frontend.",
    category: "Become the Engineer",
    xp: 250,
    badge: "Endpoint Conjurer",
    levelRequirement: 6,
    difficulty: "Heroic",
    chain: "Become the Engineer",
    rewards: {
      xp: 250,
      badge: "Endpoint Conjurer",
      item: "Obelisk Shard",
    },
  },
  {
    id: "local-ai-ritual",
    title: "Local AI Ritual",
    lore: "Spin up a local model and bind it to your tools. The AI answers only to you.",
    description: "Install a local LLM (like Ollama), connect it to your app, and run a simple flow.",
    category: "Become the Engineer",
    xp: 300,
    badge: "AI Handler",
    levelRequirement: 7,
    difficulty: "Heroic",
    chain: "Become the Engineer",
    rewards: {
      xp: 300,
      badge: "AI Handler",
      item: "AI Core Unit",
    },
  },

  // Master Arc – “Legacy of Obelisk”
  {
    id: "launch-full-project",
    title: "Launch A Full Project",
    lore: "A complete experience stands under its own weight, bearing your mark.",
    description: "Ship a real project that ties together frontend, backend, and deployment.",
    category: "Legacy of Obelisk",
    xp: 500,
    badge: "Project Architect",
    levelRequirement: 8,
    difficulty: "Heroic",
    chain: "Legacy of Obelisk",
    rewards: {
      xp: 500,
      badge: "Project Architect",
      item: "Obelisk Shard",
    },
  },
  {
    id: "mentor-initiate",
    title: "Mentor Another Initiate",
    lore: "You become part of the Obelisk itself—knowledge flows through you to others.",
    description: "Help a newer learner complete one of the beginner missions or a small project.",
    category: "Legacy of Obelisk",
    xp: 500,
    badge: "Obelisk Mentor",
    levelRequirement: 9,
    difficulty: "Heroic",
    chain: "Legacy of Obelisk",
    rewards: {
      xp: 500,
      badge: "Obelisk Mentor",
      item: "Obelisk Shard",
    },
  },
];


