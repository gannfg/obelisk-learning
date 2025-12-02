// Script to verify .env.local file structure
// This script reads the file directly to check format

const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');

console.log('🔍 Checking .env.local file...\n');

if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found!');
  console.log('Please create .env.local in the root directory.');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const lines = envContent.split('\n').filter(line => {
  const trimmed = line.trim();
  return trimmed && !trimmed.startsWith('#');
});

const requiredVars = [
  // Obelisk Learning Auth Supabase
  'NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_URL',
  'NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_ANON_KEY',
];

const optionalVars = [
  'NEXT_PUBLIC_APP_ENV',
  // Learning Supabase (optional, for platform data)
  'NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_URL',
  'NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_ANON_KEY',
  // Ollama AI Integration (optional, defaults to localhost:11434 and llama3)
  'OLLAMA_URL',
  'OLLAMA_MODEL',
];

const foundVars = new Set();
const varValues = new Map();
lines.forEach(line => {
  const trimmed = line.trim();
  // Match variable name at start of line (with optional whitespace), followed by =
  const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.+)$/);
  if (match) {
    const varName = match[1];
    const varValue = match[2].trim();
    foundVars.add(varName);
    varValues.set(varName, varValue);
  }
});

let hasErrors = false;

// Check required variables
console.log('📋 Required Variables:');
requiredVars.forEach(varName => {
  if (foundVars.has(varName)) {
    const value = varValues.get(varName) || '';
    if (value && !value.includes('your_') && value !== '' && !value.match(/^https?:\/\/your_/)) {
      const masked = value.length > 14 
        ? `${value.substring(0, 10)}...${value.substring(value.length - 4)}`
        : '***';
      console.log(`  ✅ ${varName}: ${masked}`);
    } else {
      console.log(`  ⚠️  ${varName}: set but empty or using placeholder`);
      hasErrors = true;
    }
  } else {
    console.log(`  ❌ ${varName}: NOT SET`);
    hasErrors = true;
  }
});

// Check optional variables
console.log('\n📋 Optional Variables:');
optionalVars.forEach(varName => {
  if (foundVars.has(varName)) {
    console.log(`  ✓ ${varName}: set`);
  } else {
    console.log(`  ○ ${varName}: not set (optional)`);
  }
});

// Check for Supabase variables
const authSupabaseVars = [
  'NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_URL',
  'NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_ANON_KEY'
];
const learningSupabaseVars = [
  'NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_URL',
  'NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_ANON_KEY'
];
const hasAuthSupabase = authSupabaseVars.every(v => foundVars.has(v));
const hasLearningSupabase = learningSupabaseVars.every(v => foundVars.has(v));

console.log('\n📊 Summary:');
console.log(`  Obelisk Learning Auth Supabase: ${hasAuthSupabase ? '✅ Configured' : '❌ Not configured (required)'}`);
console.log(`  Learning Supabase (optional): ${hasLearningSupabase ? '✅ Configured' : '○ Not configured'}`);
console.log(`  Ollama AI: ${foundVars.has('OLLAMA_URL') || foundVars.has('OLLAMA_MODEL') ? '✅ Configured' : '○ Using defaults (localhost:11434, llama3)'}`);

console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ Some required variables are missing or empty!');
  console.log('Please check your .env.local file and ensure all required variables are set.');
  process.exit(1);
} else {
  console.log('✅ .env.local file structure looks good!');
  console.log('\n💡 Note: Actual values are not verified, only that variables are set.');
  process.exit(0);
}

