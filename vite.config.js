import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readdirSync } from 'fs';

// Function to find all HTML files in the articles directory and create Rollup entry points
function getArticleEntries(dir) {
    const entries = {};
    const files = readdirSync(dir).filter(file => file.endsWith('.html'));

    for (const file of files) {
        const key = `articles/${file.replace('.html', '')}`;
        entries[key] = resolve(__dirname, dir, file);
    }
    return entries;
}

// Get the entry map for all articles
const articleEntries = getArticleEntries('articles');

export default defineConfig(({ command }) => {
    const isBuild = command === 'build';

    // Since you're using a custom domain (www.noidentity.space),
    // the base path should be '/' not '/noidentityspace/'
    return {
        // Set the base path for deployment
        base: '/',

        // Configure multi-page entry points for Rollup
        build: {
            outDir: 'dist',
            rollupOptions: {
                input: {
                    // Standard top-level pages
                    main: resolve(__dirname, 'index.html'),
                    // 👇 CRITICAL FIX: Add articles.html as a core entry point
                    articles: resolve(__dirname, 'articles.html'),
                    contact: resolve(__dirname, 'contact.html'),
                    privacy: resolve(__dirname, 'privacy.html'),
                    terms: resolve(__dirname, 'terms.html'),
                    // Add articles dynamically
                    ...articleEntries,
                },
            },
        },
        server: {
            host: true,
        },
    };
});