-- Seed data for 3 Dummy Missions
-- Run this after creating the schema
-- Images will be added later

-- Mission 1: Beginner - Next.js Basics
INSERT INTO missions (
  id,
  title,
  goal,
  description,
  initial_files,
  stack_type,
  difficulty,
  estimated_time,
  order_index
) VALUES (
  'mission-1'::uuid,
  'Build Your First Next.js App',
  'Create a simple Next.js application with a home page and navigation',
  'Learn the fundamentals of Next.js by building a basic application. This mission will introduce you to the Next.js file-based routing system, components, and basic styling.',
  '{
    "app/page.tsx": "export default function Home() {\n  return (\n    <div>\n      <h1>Welcome to Next.js</h1>\n      <p>This is your first Next.js app!</p>\n    </div>\n  );\n}",
    "package.json": "{\n  \"name\": \"my-nextjs-app\",\n  \"version\": \"0.1.0\",\n  \"private\": true,\n  \"scripts\": {\n    \"dev\": \"next dev\",\n    \"build\": \"next build\",\n    \"start\": \"next start\"\n  },\n  \"dependencies\": {\n    \"react\": \"^18.0.0\",\n    \"react-dom\": \"^18.0.0\",\n    \"next\": \"^14.0.0\"\n  }\n}"
  }'::jsonb,
  'nextjs',
  'beginner',
  30,
  1
);

-- Mission 2: Intermediate - Python API
INSERT INTO missions (
  id,
  title,
  goal,
  description,
  initial_files,
  stack_type,
  difficulty,
  estimated_time,
  order_index
) VALUES (
  'mission-2'::uuid,
  'Create a REST API with Python',
  'Build a RESTful API using Python and Flask that handles CRUD operations',
  'Master backend development by creating a fully functional REST API. You''ll learn about HTTP methods, request handling, JSON responses, and database integration.',
  '{
    "app.py": "from flask import Flask, jsonify, request\n\napp = Flask(__name__)\n\n@app.route(\"/\", methods=[\"GET\"])\ndef home():\n    return jsonify({\"message\": \"Welcome to the API\"})\n\nif __name__ == \"__main__\":\n    app.run(debug=True)",
    "requirements.txt": "Flask==3.0.0\nflask-cors==4.0.0"
  }'::jsonb,
  'python',
  'intermediate',
  45,
  2
);

-- Mission 3: Advanced - Solana Smart Contract
INSERT INTO missions (
  id,
  title,
  goal,
  description,
  initial_files,
  stack_type,
  difficulty,
  estimated_time,
  order_index
) VALUES (
  'mission-3'::uuid,
  'Deploy Your First Solana Program',
  'Write and deploy a Solana smart contract (program) that handles basic token operations',
  'Dive into Web3 development by creating a Solana program. Learn about accounts, instructions, and the Solana program model. This mission will teach you the fundamentals of blockchain development on Solana.',
  '{
    "src/lib.rs": "use anchor_lang::prelude::*;\n\ndeclare_id!(\"YourProgramIdHere\");\n\n#[program]\npub mod my_program {\n    use super::*;\n    \n    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct Initialize {}",
    "Cargo.toml": "[package]\nname = \"my-solana-program\"\nversion = \"0.1.0\"\nedition = \"2021\"\n\n[lib]\ncrate-type = [\"cdylib\", \"lib\"]\n\n[dependencies]\nanchor-lang = \"0.29.0\""
  }'::jsonb,
  'solana',
  'advanced',
  60,
  3
);

-- Mission Content for Mission 1
INSERT INTO mission_content (
  id,
  mission_id,
  markdown_content,
  checklist,
  advanced_tips
) VALUES (
  'mission-content-1'::uuid,
  'mission-1'::uuid,
  '# Build Your First Next.js App

## Overview
In this mission, you will create your first Next.js application from scratch. Next.js is a powerful React framework that makes building web applications easier.

## What You''ll Learn
- Next.js file-based routing
- React components in Next.js
- Basic styling and layout
- Running a development server

## Getting Started
1. Set up your Next.js project
2. Create your first page
3. Add navigation
4. Style your application

## Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)',
  ARRAY[
    '{"text": "Set up Next.js project structure", "completed": false}',
    '{"text": "Create a home page component", "completed": false}',
    '{"text": "Add navigation between pages", "completed": false}',
    '{"text": "Style the application with CSS", "completed": false}',
    '{"text": "Test the application locally", "completed": false}'
  ]::jsonb,
  '## Advanced Tips

- Use Next.js Image component for optimized images
- Consider using TypeScript for better type safety
- Explore Next.js App Router for modern routing patterns
- Learn about Server Components for better performance'
);

-- Mission Content for Mission 2
INSERT INTO mission_content (
  id,
  mission_id,
  markdown_content,
  checklist,
  advanced_tips
) VALUES (
  'mission-content-2'::uuid,
  'mission-2'::uuid,
  '# Create a REST API with Python

## Overview
Build a complete RESTful API using Python and Flask. This mission will teach you how to handle HTTP requests, manage data, and create endpoints.

## What You''ll Learn
- Flask framework basics
- HTTP methods (GET, POST, PUT, DELETE)
- Request and response handling
- JSON data manipulation
- API design principles

## Getting Started
1. Set up Flask environment
2. Create your first endpoint
3. Implement CRUD operations
4. Add error handling
5. Test your API

## Resources
- [Flask Documentation](https://flask.palletsprojects.com/)
- [REST API Best Practices](https://restfulapi.net/)',
  ARRAY[
    '{"text": "Install Flask and set up virtual environment", "completed": false}',
    '{"text": "Create a Flask application", "completed": false}',
    '{"text": "Implement GET endpoint for listing items", "completed": false}',
    '{"text": "Implement POST endpoint for creating items", "completed": false}',
    '{"text": "Implement PUT endpoint for updating items", "completed": false}',
    '{"text": "Implement DELETE endpoint for removing items", "completed": false}',
    '{"text": "Add error handling and validation", "completed": false}',
    '{"text": "Test all endpoints with Postman or curl", "completed": false}'
  ]::jsonb,
  '## Advanced Tips

- Use Flask-RESTful for more structured API design
- Implement authentication with JWT tokens
- Add database integration with SQLAlchemy
- Use Flask-CORS for cross-origin requests
- Consider using Flask-Migrate for database migrations
- Add API rate limiting for production'
);

-- Mission Content for Mission 3
INSERT INTO mission_content (
  id,
  mission_id,
  markdown_content,
  checklist,
  advanced_tips
) VALUES (
  'mission-content-3'::uuid,
  'mission-3'::uuid,
  '# Deploy Your First Solana Program

## Overview
Create and deploy a Solana program (smart contract) that handles basic operations. This mission introduces you to blockchain development on the Solana network.

## What You''ll Learn
- Solana program architecture
- Anchor framework basics
- Account management
- Instruction handling
- Program deployment

## Getting Started
1. Set up Solana development environment
2. Install Anchor framework
3. Create your first program
4. Write and test instructions
5. Deploy to devnet

## Resources
- [Solana Documentation](https://docs.solana.com/)
- [Anchor Book](https://www.anchor-lang.com/)
- [Solana Cookbook](https://solanacookbook.com/)',
  ARRAY[
    '{"text": "Install Solana CLI and Anchor", "completed": false}',
    '{"text": "Set up Anchor project structure", "completed": false}',
    '{"text": "Write your first Solana program", "completed": false}',
    '{"text": "Define program accounts and instructions", "completed": false}',
    '{"text": "Build and test locally", "completed": false}',
    '{"text": "Deploy to Solana devnet", "completed": false}',
    '{"text": "Create a client to interact with your program", "completed": false}',
    '{"text": "Test the deployed program", "completed": false}'
  ]::jsonb,
  '## Advanced Tips

- Learn about Program Derived Addresses (PDAs)
- Understand the difference between accounts and programs
- Use Anchor IDL for type-safe client generation
- Implement proper error handling
- Consider security best practices for on-chain programs
- Learn about rent and account sizing
- Explore cross-program invocations (CPIs)'
);

