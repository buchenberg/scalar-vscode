const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

// Bundle the extension (Node.js target)
async function bundleExtension() {
    const ctx = await esbuild.context({
        entryPoints: ['src/extension.ts'],
        bundle: true,
        format: 'cjs',
        platform: 'node',
        outfile: 'out/extension.js',
        external: ['vscode'],
        sourcemap: !production,
        minify: production,
    });

    if (watch) {
        await ctx.watch();
        console.log('Watching extension...');
    } else {
        await ctx.rebuild();
        await ctx.dispose();
    }
}

// Bundle the webview (browser target with Scalar)
async function bundleWebview() {
    const ctx = await esbuild.context({
        entryPoints: ['src/webview/main.ts'],
        bundle: true,
        format: 'iife',
        platform: 'browser',
        outfile: 'out/main.js',
        sourcemap: !production,
        minify: production,
        // Define globals for browser environment
        define: {
            'process.env.NODE_ENV': production ? '"production"' : '"development"',
        },
    });

    if (watch) {
        await ctx.watch();
        console.log('Watching webview...');
    } else {
        await ctx.rebuild();
        await ctx.dispose();
    }

    // Copy Scalar CSS to output directory
    const scalarCssSource = path.join(__dirname, 'node_modules', '@scalar', 'api-reference', 'dist', 'style.css');
    const scalarCssDest = path.join(__dirname, 'out', 'main.css');

    if (fs.existsSync(scalarCssSource)) {
        fs.copyFileSync(scalarCssSource, scalarCssDest);
        console.log('Copied Scalar CSS to out/main.css');
    } else {
        console.warn('Warning: Scalar CSS not found at', scalarCssSource);
    }
}

async function main() {
    try {
        // Ensure output directory exists
        if (!fs.existsSync('out')) {
            fs.mkdirSync('out', { recursive: true });
        }

        await Promise.all([
            bundleExtension(),
            bundleWebview(),
        ]);
        console.log('Build complete!');
    } catch (err) {
        console.error('Build failed:', err);
        process.exit(1);
    }
}

main();
