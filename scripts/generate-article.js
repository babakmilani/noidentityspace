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
    model: "claude-sonnet-4-20250514",
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

function toSlug(str) {
    return str
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
}

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

function getRandomArticles(all, exclude, count = 3) {
    const filtered = all.filter((a) => a.name !== exclude);
    const shuffled = filtered.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, filtered.length));
}

async function generateArticleData() {
    const existing = getExistingArticles();

    const userPrompt = `Generate a comprehensive HTML article on a trending privacy or cybersecurity topic.

CRITICAL REQUIREMENTS:
1. Avoid these existing topics: ${existing.map((a) => a.name).join(", ")}
2. The article MUST be 2000-3000 words
3. Include at least 5 major sections with <h2> tags and multiple <h3> subsections
4. Use proper HTML formatting: <p>, <ul>, <li>, <strong>, etc.
5. Include at least 1 tip box and 1 warning box in the content
6. Make it comprehensive, detailed, and professional

Return ONLY valid JSON (no markdown code blocks) with these exact fields:
{
  "title": "Complete article title",
  "category": "One of: Digital Privacy, Digital Security, Online Anonymity, Digital Scams, Future Tech, Policy & Rights, Family Privacy, Digital Wellness, Tech Deep Dive",
  "metaDescription": "SEO description (150-160 characters)",
  "keywords": "comma, separated, keywords",
  "readingTime": "X min read",
  "emoji": "single emoji for featured image",
  "imageColor": "#hexcolor",
  "summary": "2-3 sentence summary",
  "content": "Full HTML content with proper structure. Must include: <h2> sections, <h3> subsections, <p> paragraphs, <ul><li> lists, <strong> emphasis. Include tip boxes as: <div class='tip-box'><strong>💡 Pro Tip:</strong> Content here</div> and warning boxes as: <div class='warning-box'><strong>⚠️ Warning:</strong> Content here</div>"
}`;

    console.log("🤖 Generating article with Claude Sonnet 4...");
    const message = await anthropic.messages.create({
        model: CONFIG.model,
        max_tokens: CONFIG.maxTokens,
        messages: [{ role: "user", content: userPrompt }],
    });

    let jsonText = message.content.map((c) => c.text).join("\n");
    jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let articleData;
    try {
        articleData = JSON.parse(jsonText);
    } catch (err) {
        console.error("⚠️ JSON parse failed, attempting cleanup...");
        // Try to extract JSON from response
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                articleData = JSON.parse(jsonMatch[0]);
            } catch {
                throw new Error("Failed to parse JSON from Claude response");
            }
        } else {
            throw new Error("No valid JSON found in Claude response");
        }
    }

    articleData.filename = `${toSlug(articleData.title)}.html`;
    return articleData;
}

function createArticleHTML(articleData) {
    const template = fs.readFileSync(CONFIG.articleTemplate, "utf8");
    const $ = cheerio.load(template);

    // Update meta tags
    $("title").text(`${articleData.title} | NoIdentity.Space`);
    $('meta[name="description"]').attr("content", articleData.metaDescription);
    $('meta[name="keywords"]').attr("content", articleData.keywords);
    $('meta[property="og:title"]').attr("content", articleData.title);
    $('meta[property="og:description"]').attr("content", articleData.metaDescription);

    // Update header
    $(".article-category").first().text(articleData.category);
    $("h1").first().text(articleData.title);

    // Format date properly
    const date = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    $(".article-meta span").first().text(`📅 ${date}`);
    $(".article-meta span").eq(2).text(`⏱️ ${articleData.readingTime}`);

    // Update featured image emoji
    $(".featured-image").text(articleData.emoji);

    // Clear existing content and insert new content
    const contentContainer = $(".article-content");
    contentContainer.find("p, h2, h3, ul, div.tip-box, div.warning-box").remove();

    // Insert content with ad placeholders
    const contentParts = articleData.content.split("</h2>");
    let finalContent = `<div class="featured-image">${articleData.emoji}</div>`;

    // Add introduction
    finalContent += `<p><strong>Introduction:</strong> ${articleData.summary}</p>`;

    // Add first ad placeholder
    finalContent += `
    <div class="ad-placeholder">
        <p class="ad-label">Ad Slot 1 Placeholder (Insert AdSense In-Article Code here after approval)</p>
        <ins class="adsbygoogle" style="display:block; text-align:center;"
            data-ad-client="ca-pub-2379517169183719" data-ad-slot="YOUR_AD_SLOT_NUMBER_1" data-ad-format="auto"
            data-full-width-responsive="true"></ins>
    </div>`;

    // Insert content with ads strategically placed
    const sections = contentParts.length;
    contentParts.forEach((part, index) => {
        if (index < sections - 1) {
            finalContent += part + "</h2>";

            // Add ad after 2nd and 4th sections
            if (index === 1) {
                finalContent += `
                <div class="ad-placeholder">
                    <p class="ad-label">Ad Slot 2 Placeholder (Insert AdSense In-Article Code here after approval)</p>
                    <ins class="adsbygoogle" style="display:block; text-align:center;"
                        data-ad-client="ca-pub-2379517169183719" data-ad-slot="YOUR_AD_SLOT_NUMBER_2" data-ad-format="auto"
                        data-full-width-responsive="true"></ins>
                </div>`;
            }
            if (index === 3) {
                finalContent += `
                <div class="ad-placeholder">
                    <p class="ad-label">Ad Slot 3 Placeholder (Insert AdSense In-Article Code here after approval)</p>
                    <ins class="adsbygoogle" style="display:block; text-align:center;"
                        data-ad-client="ca-pub-2379517169183719" data-ad-slot="YOUR_AD_SLOT_NUMBER_3" data-ad-format="auto"
                        data-full-width-responsive="true"></ins>
                </div>`;
            }
        } else {
            finalContent += part;
        }
    });

    // Add share buttons
    finalContent += `
    <div class="share-buttons">
        <a href="#" class="share-button">📱 Share on Twitter</a>
        <a href="#" class="share-button">📘 Share on Facebook</a>
        <a href="#" class="share-button">💼 Share on LinkedIn</a>
        <a href="#" class="share-button">📋 Copy Link</a>
    </div>`;

    // Add author box
    finalContent += `
    <div class="author-box">
        <div class="author-avatar">✍️</div>
        <div class="author-info">
            <h4>Written by the NoIdentity Team</h4>
            <p>Our team continuously tests and vets privacy software to ensure you have the most effective tools
                to secure your digital life and maintain your anonymity.</p>
        </div>
    </div>`;

    contentContainer.html(finalContent);

    // Generate Table of Contents from h2 headings
    const toc = $(".toc");
    toc.empty();
    $(".article-content h2").each(function () {
        const heading = $(this);
        const text = heading.text();
        const id = toSlug(text);
        heading.attr("id", id);
        toc.append(`<li><a href="#${id}">${text}</a></li>`);
    });

    return $;
}

function addRelatedArticles($, currentSlug) {
    const allArticles = getExistingArticles();
    const related = getRandomArticles(allArticles, currentSlug, 3);
    if (related.length === 0) return $;

    const relatedSection = $(".sidebar-section").eq(1);
    relatedSection.find("h3").text("Related Articles");
    relatedSection.find("a.related-post").remove();

    related.forEach((article) => {
        relatedSection.append(`
        <a href="${article.file}" class="related-post">
            <h4>📰 ${article.title}</h4>
            <p>Essential privacy reading</p>
        </a>`);
    });

    return $;
}

function updateArticlesPage(articleData) {
    if (!fs.existsSync(CONFIG.articlesPage)) {
        console.warn("⚠️ articles.html not found, skipping update.");
        return;
    }

    const html = fs.readFileSync(CONFIG.articlesPage, "utf8");
    const $ = cheerio.load(html);

    // ✅ FIX: Use proper URL encoding for emoji in the text parameter
    const emojiEncoded = encodeURIComponent(articleData.emoji);
    const colorHex = articleData.imageColor.replace("#", "").slice(0, 6);

    const card = `
  <a href="articles/${articleData.filename}" class="article-card">
      <img src="https://placehold.co/600x400/${colorHex}/ffffff/png?text=${emojiEncoded}&font=noto-sans" alt="${articleData.title}" loading="lazy">
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
        process.exit(1);
    }
}

main();