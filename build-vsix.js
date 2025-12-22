/**
 * Build script to create VSIX packages for different publishers
 * Usage:
 *   node build-vsix.js              - Builds for all publishers
 *   node build-vsix.js vscode       - Builds for VS Code Marketplace (GregoryBuchenberger)
 *   node build-vsix.js openvsx      - Builds for Open VSX (buchenberg)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PUBLISHERS = {
    vscode: 'GregoryBuchenberger',
    openvsx: 'buchenberg'
};

const packageJsonPath = path.join(__dirname, 'package.json');

function readPackageJson() {
    return JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
}

function writePackageJson(pkg) {
    fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
}

function buildForPublisher(target, publisherName) {
    const pkg = readPackageJson();
    const originalPublisher = pkg.publisher;

    console.log(`\n📦 Building for ${target} (publisher: ${publisherName})...`);

    // Update publisher
    pkg.publisher = publisherName;
    writePackageJson(pkg);

    try {
        // Build the VSIX
        execSync('npx @vscode/vsce package', { stdio: 'inherit' });

        // Rename the output file to include the target
        const version = pkg.version;
        const originalName = `${pkg.name}-${version}.vsix`;
        const newName = `${pkg.name}-${version}-${target}.vsix`;

        if (fs.existsSync(originalName)) {
            fs.renameSync(originalName, newName);
            console.log(`✅ Created: ${newName}`);
        }
    } finally {
        // Restore original publisher
        pkg.publisher = originalPublisher;
        writePackageJson(pkg);
    }
}

// Parse command line args
const target = process.argv[2];

if (target && !PUBLISHERS[target]) {
    console.error(`Unknown target: ${target}`);
    console.error(`Valid targets: ${Object.keys(PUBLISHERS).join(', ')}`);
    process.exit(1);
}

// Build for specified target or all targets
const targets = target ? [target] : Object.keys(PUBLISHERS);

for (const t of targets) {
    buildForPublisher(t, PUBLISHERS[t]);
}

console.log('\n🎉 Done!');
