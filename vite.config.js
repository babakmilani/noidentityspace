import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readdirSync } from 'fs';

// Function to find all HTML files in the articles directory and create Rollup entry points
function getArticleEntries(dir) {
    const entries = {};
    const files = readdirSync(dir).filter(file => file.endsWith('.html'));

    for (const file of files) {
        // Key example: 'articles/how-to-browse-the-internet-anonymously'
        const key = `articles/${file.replace('.html', '')}`;
        // Value example: '/path/to/project/articles/how-to-browse-the-internet-anonymously.html'
        entries[key] = resolve(__dirname, dir, file);
    }
    return entries;
}

// Get the entry map for all articles
const articleEntries = getArticleEntries('articles');

export default defineConfig(({ command }) => {
    const isBuild = command === 'build';
    const repositoryName = 'noidentityspace'; // <<< CHANGE THIS to your actual GitHub repository name

    return {
        // Set the base path for deployment (important for GitHub Pages subfolder hosting)
        base: isBuild ? `/${repositoryName}/` : '/',

        // Configure multi-page entry points for Rollup
        build: {
            outDir: 'dist',
            rollupOptions: {
                input: {
                    // Standard top-level pages
                    main: resolve(__dirname, 'index.html'),
                    contact: resolve(__dirname, 'contact.html'),
                    // Add articles dynamically
                    ...articleEntries,
                    // Add any other top-level HTML pages here (e.g., privacy: resolve(__dirname, 'privacy.html'))
                },
            },
        },
        server: {
            host: true,
        },
    };
});
