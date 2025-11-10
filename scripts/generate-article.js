// scripts/generate-article.js
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as cheerio from "cheerio";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

// CONFIG
const CONFIG = {
    model: "claude-3-sonnet-20241022",
    maxTokens: 8000,
    categories: [
        "Digital Privacy",
        "Digital Security",
        "Online Anonymity",
        "Digital Scams",
        "Future Tech",
        "Policy & Rights",
        "Family Privacy",
        "Digital Wellness",
        "Tech Deep Dive",
    ],
    articlesDir: path.join(__dirname, "../articles"),
    articlesPage: path.join(__dirname, "../articles.html"),
    articleTemplate: path.join(__dirname, "../articles/best-privacy-apps.html"),
};

// ✅ Utility: Convert to safe slug
function toSlug(str) {
    return str
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
}

// ✅ Utility: Read existing articles
function getExistingArticles() {
    if (!fs.existsSync(CONFIG.articlesDir)) return [];
    return fs
        .readdirSync(CONFIG.articlesDir)
        .filter((f) => f.endsWith(".html"))
        .map((f) => ({
            name: path.basename(f, ".html"),
            file: f,
            title: toTitle(f),
        }));
}

function toTitle(filename) {
    return filename
        .replace(/-/g, " ")
        .replace(".html", "")
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ✅ Pick random subset
function getRandomArticles(all, exclude, count = 3) {
    const filtered = all.filter((a) => a.name !== exclude);
    const shuffled = filtered.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, filtered.length));
}

// ✅ Generate article data via Anthropic
async function generateArticleData() {
    const existing = getExistingArticles();
    const systemPrompt = `You are a professional writer for NoIdentity.Space, a privacy and security publication.
Create unique, high-quality HTML article content. Avoid duplicating these topics:
${existing.map((a) => a.name).join(", ")}.`;

    const userPrompt = `
Generate an HTML article on a trending privacy or cybersecurity topic.
Return JSON with fields: title, category (from ${CONFIG.categories.join(
        ", "
    )}), metaDescription, keywords, readingTime, emoji, imageColor, summary, and content (pure HTML).`;

    console.log("🤖 Generating article...");
    const message = await anthropic.messages.create({
        model: CONFIG.model,
        max_tokens: CONFIG.maxTokens,
        messages: [{ role: "user", content: userPrompt }],
    });

    let jsonText = message.content.map((c) => c.text).join("\n");
    jsonText = jsonText.replace(/```json|```/g, "").trim();

    let articleData;
    try {
        articleData = JSON.parse(jsonText);
    } catch {
        console.error("⚠️ JSON parse failed, using fallback");
        articleData = {
            title: "Untitled Article",
            category: "Digital Privacy",
            metaDescription: "Auto-generated article.",
            keywords: "privacy, security",
            readingTime: "8 min read",
            emoji: "🧠",
            imageColor: "#6366f1",
            summary: "Automatically generated content.",
            content: `<p>${jsonText}</p>`,
        };
    }

    articleData.filename = `${toSlug(articleData.title)}.html`;
    return articleData;
}

// ✅ Create HTML from template
function createArticleHTML(articleData) {
    const template = fs.readFileSync(CONFIG.articleTemplate, "utf8");
    const $ = cheerio.load(template);

    // Replace key info
    $("title").text(`${articleData.title} | NoIdentity.Space`);
    $('meta[name="description"]').attr("content", articleData.metaDescription);
    $('meta[name="keywords"]').attr("content", articleData.keywords);
    $("h1").first().text(articleData.title);
    $(".article-category").first().text(articleData.category);
    $(".article-meta span").first().text(`📅 ${new Date().toLocaleDateString()}`);
    $(".article-meta span").eq(2).text(`⏱️ ${articleData.readingTime}`);
    $(".featured-image").text(articleData.emoji);
    $(".article-content").html(articleData.content);

    return $;
}

// ✅ Add Related Articles
function addRelatedArticles($, currentSlug) {
    const allArticles = getExistingArticles();
    const related = getRandomArticles(allArticles, currentSlug, 3);
    if (related.length === 0) return $;

    const section = `
  <section class="related-articles">
    <h2>Related Articles</h2>
    <div class="related-grid">
      ${related
            .map(
                (a) => `
        <a href="${a.file}" class="related-card">
          <div class="related-thumb">📰</div>
          <h3>${a.title}</h3>
        </a>`
            )
            .join("\n")}
    </div>
  </section>
  `;

    $(".article-content").after(section);
    return $;
}

// ✅ Update articles.html
function updateArticlesPage(articleData) {
    if (!fs.existsSync(CONFIG.articlesPage)) {
        console.warn("⚠️ articles.html not found, skipping update.");
        return;
    }

    const html = fs.readFileSync(CONFIG.articlesPage, "utf8");
    const $ = cheerio.load(html);

    const card = `
  <a href="articles/${articleData.filename}" class="article-card">
      <img src="https://placehold.co/600x400/${articleData.imageColor
            .replace("#", "")
            .slice(0, 6)}/ffffff?text=${encodeURIComponent(
                articleData.emoji
            )}" alt="${articleData.title}" loading="lazy">
      <div class="card-content">
          <h3>${articleData.title}</h3>
          <p>${articleData.summary}</p>
          <span>${articleData.category}</span>
      </div>
  </a>
  `;

    $(".article-grid").prepend(card);

    fs.writeFileSync(CONFIG.articlesPage, $.html(), "utf8");
    console.log(`🧩 Updated articles.html with "${articleData.title}"`);
}

// ✅ Main Process
async function main() {
    try {
        console.log("🚀 Starting article generation...");
        if (!fs.existsSync(CONFIG.articlesDir)) fs.mkdirSync(CONFIG.articlesDir);

        const articleData = await generateArticleData();
        let $ = createArticleHTML(articleData);

        // Add Related Articles
        $ = addRelatedArticles($, toSlug(articleData.title));

        const html = $.html();
        const outputPath = path.join(CONFIG.articlesDir, articleData.filename);
        fs.writeFileSync(outputPath, html, "utf8");

        console.log(`✅ Created new article: ${outputPath}`);
        updateArticlesPage(articleData);

        fs.writeFileSync(".article-title.txt", articleData.title, "utf8");
        fs.writeFileSync(
            "article-report.txt",
            `📰 ${articleData.title}\n📂 ${articleData.filename}\n🏷️ ${articleData.category}\n\nSummary:\n${articleData.summary}\n`,
            "utf8"
        );
    } catch (error) {
        console.error("❌ Failed:", error);
    }
}

main();
