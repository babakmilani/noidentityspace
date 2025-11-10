# ==========================================
# LOCAL TESTING SETUP (OPTIONAL)
# ==========================================
# Only needed if you want to test the article generator on your local machine
# The GitHub Actions workflow does NOT need this

# Step 1: Create .env file in your repo root
# File: .env
ANTHROPIC_API_KEY=sk-ant-your-actual-api-key-here

# Step 2: Update package.json
# File: package.json
{
  "name": "noidentityspace",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "generate": "node scripts/generate-article.js"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.32.1",
    "cheerio": "^1.0.0",
    "dotenv": "^16.4.7"
  }
}

# Step 3: Update scripts/generate-article.js (add at top)
# Add this line after imports:
import 'dotenv/config';

# Step 4: Install dependencies
npm install

# Step 5: Create .gitignore (IMPORTANT - don't commit API key!)
# File: .gitignore
node_modules/
.env
.article-title.txt
article-report.txt

# Step 6: Run locally
npm run generate

# ==========================================
# IMPORTANT NOTES:
# ==========================================
# 1. NEVER commit .env to GitHub
# 2. Add .env to .gitignore immediately
# 3. For production, use GitHub Secrets (no .env needed)
# 4. Local testing is optional - you can test via GitHub Actions manual trigger