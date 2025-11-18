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
const lines = envContent.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));

const requiredVars = [
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
];

const optionalVars = [
  'NEXT_PUBLIC_CLERK_DOMAIN',
  'NEXT_PUBLIC_CLERK_IS_SATELLITE',
  'NEXT_PUBLIC_APP_ENV',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

const foundVars = new Set();
lines.forEach(line => {
  const match = line.match(/^([A-Z_]+)=/);
  if (match) {
    foundVars.add(match[1]);
  }
});

let hasErrors = false;

// Check required variables
console.log('📋 Required Variables:');
requiredVars.forEach(varName => {
  if (foundVars.has(varName)) {
    const line = lines.find(l => l.startsWith(varName + '='));
    const value = line ? line.split('=')[1]?.trim() : '';
    if (value && value !== 'your_clerk_publishable_key_here' && value !== '') {
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
const supabaseVars = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const hasSupabase = supabaseVars.every(v => foundVars.has(v));

console.log('\n📊 Summary:');
console.log(`  Clerk Auth: ${foundVars.has('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY') ? '✅ Configured' : '❌ Not configured'}`);
console.log(`  Supabase: ${hasSupabase ? '✅ Configured' : '○ Not configured'}`);

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

