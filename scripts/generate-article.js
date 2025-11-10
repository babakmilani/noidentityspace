// scripts/generate-article.js
// --- Debug start ---
console.log("✅ Script started running...");

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';

console.log("✅ Imports loaded successfully");

try {
    console.log("✅ Starting article generation logic...");

    // DEBUG POINT 1
    console.log("🔍 Initializing Anthropic client...");
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // DEBUG POINT 2
    console.log("🔍 Sending request to Anthropic API...");
    const completion = await client.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 800,
        messages: [
            { role: "user", content: "Write a 3-paragraph tech privacy article." }
        ],
    });

    console.log("✅ Received response from Anthropic API");

    // DEBUG POINT 3
    const articleText = completion.content[0]?.text || "(empty response)";
    console.log("🧠 Article content length:", articleText.length);

    // Create output folder if missing
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const outputDir = path.join(__dirname, "../articles");
    fs.mkdirSync(outputDir, { recursive: true });

    // DEBUG POINT 4
    console.log("📂 Writing file to:", outputDir);
    const filePath = path.join(outputDir, `article-${Date.now()}.html`);
    fs.writeFileSync(filePath, articleText, "utf8");

    console.log("✅ Article file successfully created:", filePath);
} catch (err) {
    console.error("❌ Script failed:", err);
}


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

const CONFIG = {
    model: 'claude-sonnet-4-20250514',
    maxTokens: 8000,
    categories: [
        'Digital Privacy',
        'Digital Security',
        'Online Anonymity',
        'Digital Scams',
        'Future Tech',
        'Policy & Rights',
        'Family Privacy',
        'Digital Wellness',
        'Tech Deep Dive'
    ],
};

// Get existing articles to avoid duplication
function getExistingArticles() {
    const articlesDir = path.join(__dirname, '..', 'articles');

    if (!fs.existsSync(articlesDir)) {
        return { files: [], titles: [] };
    }

    const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.html'));

    const titles = files.map(file => {
        try {
            const content = fs.readFileSync(path.join(articlesDir, file), 'utf-8');
            const $ = cheerio.load(content);
            return $('h1').first().text() || '';
        } catch (e) {
            return '';
        }
    }).filter(Boolean);

    return { files, titles };
}

// Generate article using Claude with web search
async function generateArticle() {
    console.log('🔍 Starting article generation process...');

    const existingArticles = getExistingArticles();
    const currentDate = new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    console.log(`📚 Found ${existingArticles.titles.length} existing articles`);

    const systemPrompt = `You are an expert content creator for NoIdentity.Space, a digital privacy and security blog. Your task is to research, write, and format a complete article.

SITE CONTEXT:
- Target audience: Privacy-conscious individuals, security professionals, tech-savvy users
- Tone: Informative, practical, empowering (not fear-mongering)
- Writing style: Clear, actionable, conversational but professional
- Length: 2000-3000 words (10-15 minute read)

EXISTING ARTICLES (avoid duplicating these topics):
${existingArticles.titles.slice(0, 20).join('\n- ')}

TODAY'S DATE: ${currentDate}`;

    const userPrompt = `Using web search, research the latest digital privacy, cybersecurity, or online anonymity news from the past 7 days. Find trending topics, breaking news, or emerging threats.

Then generate a COMPLETE article as a JSON object with these exact fields:

{
  "title": "SEO-optimized title (60-70 characters)",
  "filename": "url-friendly-filename-without-extension",
  "category": "Pick ONE from: ${CONFIG.categories.join(', ')}",
  "metaDescription": "Compelling meta description (150-160 characters)",
  "keywords": "comma, separated, keywords, for, seo",
  "readingTime": "X min read",
  "emoji": "Single relevant emoji for featured image",
  "imageColor": "Hex color (e.g., #6366f1) for placeholder image background",
  "summary": "2-sentence summary for article card (150 characters max)",
  "content": "FULL HTML CONTENT - see requirements below"
}

CONTENT REQUIREMENTS:
- Start with <p><strong>Introduction:</strong> Hook the reader...</p>
- Use proper HTML: <h2>, <h3>, <p>, <ul>, <li>, <strong>
- Include 3-5 main <h2> sections with id attributes (e.g., <h2 id="section-name">)
- Add 2-3 <h3> subsections within main sections
- Include practical examples, tips, or warnings
- Add special boxes where appropriate:
  * <div class="tip-box"><strong>💡 Pro Tip:</strong> ...</div>
  * <div class="warning-box"><strong>⚠️ Warning:</strong> ...</div>
- End with strong conclusion
- Use **bold** sparingly for emphasis (will convert to <strong>)
- NO markdown - output pure HTML tags only

The content should be unique, well-researched, and provide genuine value. Use web search to ensure information is current and accurate.`;

    try {
        console.log('🤖 Calling Claude API with web search...');

        const message = await anthropic.messages.create({
            model: CONFIG.model,
            max_tokens: CONFIG.maxTokens,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }],
            tools: [{
                type: "web_search_20250305",
                name: "web_search"
            }]
        });

        console.log('✅ Received response from Claude');

        // Handle potential tool use and get final content
        let articleData;
        const textBlocks = message.content.filter(block => block.type === 'text');

        if (textBlocks.length === 0) {
            throw new Error('No text content received from Claude');
        }

        // Extract JSON from the response
        let jsonText = textBlocks.map(b => b.text).join('\n');

        // Remove markdown code fences if present
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        // ✅ FIX: Try parsing JSON safely and handle non-JSON gracefully
        try {
            articleData = JSON.parse(jsonText);
        } catch (err) {
            console.warn('⚠️ Claude response was not strict JSON, falling back to text extraction.');
            console.log('🔍 Raw response snippet:', jsonText.slice(0, 300));

            // fallback minimal object
            articleData = {
                title: "Untitled Article",
                filename: "untitled-article",
                category: "Digital Privacy",
                metaDescription: "Auto-generated article fallback.",
                keywords: "privacy, security, ai",
                readingTime: "8 min read",
                emoji: "📰",
                imageColor: "#6366f1",
                summary: "Automatically generated article.",
                content: `<p>${jsonText}</p>`
            };
        }

        console.log(`📝 Generated article: "${articleData.title}"`);
        console.log(`📂 Filename: ${articleData.filename}.html`);
        console.log(`🏷️  Category: ${articleData.category}`);

        return articleData;

    } catch (error) {
        console.error('❌ Error generating article:', error);
        throw error;
    }
}

// --- rest of your code below unchanged ---

// Create article HTML from template
function createArticleHTML(articleData) {
    const currentDate = new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    // Get 3 random existing articles for related section
    const existingArticles = getExistingArticles();
    const relatedArticles = existingArticles.files
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(f => f.replace('.html', ''));

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta name="google-adsense-account" content="ca-pub-2379517169183719">
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${articleData.metaDescription}">
    <meta name="keywords" content="${articleData.keywords}">
    <meta name="author" content="NoIdentity Team">
    <meta property="og:title" content="${articleData.title}">
    <meta property="og:description" content="${articleData.metaDescription}">
    <meta property="og:type" content="article">
    <title>${articleData.title} | NoIdentity.Space</title>
    <link rel="stylesheet" href="../styles.css">
</head>
<body>
<!-- ... (unchanged HTML content) ... -->
</body>
</html>`;

    return html;
}

// (keep your updateArticlesPage and main() functions unchanged below)
