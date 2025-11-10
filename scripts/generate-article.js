// scripts/generate-article.js
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';

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

        articleData = JSON.parse(jsonText);

        console.log(`📝 Generated article: "${articleData.title}"`);
        console.log(`📂 Filename: ${articleData.filename}.html`);
        console.log(`🏷️  Category: ${articleData.category}`);

        return articleData;

    } catch (error) {
        console.error('❌ Error generating article:', error);
        throw error;
    }
}

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
    <header>
        <nav>
            <a href="../index.html" class="logo">no<span>identity</span>.space</a>
            <ul class="nav-links">
                <li><a href="../index.html">Home</a></li>
                <li><a href="../index.html#topics">Topics</a></li>
                <li><a href="../articles.html">Articles</a></li>
                <li><a href="../index.html#about">About</a></li>
            </ul>
        </nav>
    </header>

    <div class="article-header">
        <div class="article-category">${articleData.category}</div>
        <h1>${articleData.title}</h1>
        <div class="article-meta">
            <span>📅 ${currentDate}</span>
            <span>•</span>
            <span>⏱️ ${articleData.readingTime}</span>
            <span>•</span>
            <span>✍️ NoIdentity Team</span>
        </div>
    </div>

    <div class="article-container">
        <article class="article-content">
            <div class="featured-image">${articleData.emoji}</div>
            
            ${articleData.content}

            <div class="share-buttons">
                <a href="#" class="share-button">📱 Share on Twitter</a>
                <a href="#" class="share-button">📘 Share on Facebook</a>
                <a href="#" class="share-button">💼 Share on LinkedIn</a>
                <a href="#" class="share-button">📋 Copy Link</a>
            </div>

            <div class="author-box">
                <div class="author-avatar">✍️</div>
                <div class="author-info">
                    <h4>Written by the NoIdentity Team</h4>
                    <p>Our team continuously researches and analyzes digital privacy trends to keep you informed and protected.</p>
                </div>
            </div>
        </article>

        <aside class="sidebar">
            <div class="sidebar-section">
                <h3>Related Articles</h3>
                ${relatedArticles.map(slug => `
                <a href="${slug}.html" class="related-post">
                    <h4>🔗 ${slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</h4>
                </a>
                `).join('')}
            </div>

            <div class="sidebar-section" style="background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white;">
                <h3 style="color: white;">Stay Updated</h3>
                <p style="font-size: 0.9rem; margin-bottom: 1rem;">Get weekly privacy tips delivered to your inbox.</p>
                <form id="sidebarNewsletterForm" class="sidebar-newsletter-form">
                    <input type="email" name="email" placeholder="Your email" required
                        style="width: 100%; padding: 0.75rem; border: none; border-radius: 6px; margin-bottom: 0.5rem;">
                    <button type="submit"
                        style="width: 100%; padding: 0.75rem; background: white; color: var(--primary); border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
                        Subscribe
                    </button>
                </form>
            </div>
        </aside>
    </div>

    <footer>
        <p>&copy; 2025 NoIdentity.Space | <a href="../privacy.html" style="color: var(--primary);">Privacy Policy</a> |
            <a href="../terms.html" style="color: var(--primary);">Terms</a>
        </p>
    </footer>

    <script type="module" src="../main.js"></script>
</body>

</html>`;

    return html;
}

// Update articles.html with new article card
function updateArticlesPage(articleData) {
    const articlesPath = path.join(__dirname, '..', 'articles.html');

    if (!fs.existsSync(articlesPath)) {
        console.error('❌ articles.html not found');
        return;
    }

    const html = fs.readFileSync(articlesPath, 'utf-8');
    const $ = cheerio.load(html);

    // Create new article card
    const newCard = `
                <a href="articles/${articleData.filename}.html" class="article-card">
                    <img src="https://placehold.co/600x400/${articleData.imageColor.replace('#', '')}/ffffff?text=${encodeURIComponent(articleData.emoji)}" alt="${articleData.title}"
                        loading="lazy">
                    <div class="card-content">
                        <h3>${articleData.title}</h3>
                        <p>${articleData.summary}</p>
                        <span>${articleData.category}</span>
                    </div>
                </a>
`;

    // Insert after the opening of article-grid div
    const articleGrid = $('.article-grid');
    if (articleGrid.length > 0) {
        articleGrid.prepend(newCard);

        // Write back to file
        fs.writeFileSync(articlesPath, $.html(), 'utf-8');
        console.log('✅ Updated articles.html with new article card');
    } else {
        console.error('❌ Could not find .article-grid in articles.html');
    }
}

// Main execution
async function main() {
    try {
        console.log('🚀 Starting article generation workflow...\n');

        // Generate article
        const articleData = await generateArticle();

        // Create article HTML
        const articleHTML = createArticleHTML(articleData);

        // Save article to files
        const articlesDir = path.join(__dirname, '..', 'articles');
        if (!fs.existsSync(articlesDir)) {
            fs.mkdirSync(articlesDir, { recursive: true });
        }

        const articlePath = path.join(articlesDir, `${articleData.filename}.html`);
        fs.writeFileSync(articlePath, articleHTML, 'utf-8');
        console.log(`✅ Created article file: articles/${articleData.filename}.html`);

        // Update articles.html
        updateArticlesPage(articleData);

        // Save title for commit message
        fs.writeFileSync(
            path.join(__dirname, '..', '.article-title.txt'),
            articleData.title,
            'utf-8'
        );

        // Create report
        const report = `
✅ Article Generation Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 Title: ${articleData.title}
🏷️  Category: ${articleData.category}
📂 File: articles/${articleData.filename}.html
📊 Length: ${articleData.readingTime}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

        fs.writeFileSync(
            path.join(__dirname, '..', 'article-report.txt'),
            report,
            'utf-8'
        );

        console.log(report);

    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

main();