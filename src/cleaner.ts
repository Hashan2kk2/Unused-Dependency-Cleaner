import fs from 'fs-extra';
import path from 'path';
import { logger } from './logger';

export class Cleaner {
    private rootDir: string;

    constructor(rootDir: string) {
        this.rootDir = path.resolve(rootDir);
    }

    async backupPackageJson() {
        const src = path.join(this.rootDir, 'package.json');
        const dest = path.join(this.rootDir, 'package.json.bak');
        await fs.copy(src, dest);
        logger.info(`Backed up package.json to ${dest}`);
    }

    async removeDependencies(dependenciesToRemove: string[]) {
        if (dependenciesToRemove.length === 0) return;

        await this.backupPackageJson();

        const pkgPath = path.join(this.rootDir, 'package.json');
        const pkg = await fs.readJSON(pkgPath);

        let removedCount = 0;

        ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'].forEach((depType) => {
            if (pkg[depType]) {
                dependenciesToRemove.forEach((dep) => {
                    if (pkg[depType][dep]) {
                        delete pkg[depType][dep];
                        removedCount++;
                    }
                });
                // Cleanup empty objects
                if (Object.keys(pkg[depType]).length === 0) {
                    delete pkg[depType];
                }
            }
        });

        await fs.writeJSON(pkgPath, pkg, { spaces: 2 });
        logger.success(`Removed ${removedCount} unused dependencies.`);
        logger.info('Please run "npm install" or "yarn install" to update your lockfile and node_modules.');
    }
}
