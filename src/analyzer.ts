import fs from 'fs-extra';
import path from 'path';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { logger } from './logger';

export interface AnalyzerOptions {
    rootDir: string;
    checkDevDeps?: boolean;
    ignore?: string[];
}

export interface DependencyUsage {
    name: string;
    isUsed: boolean;
    filesUsedIn: string[];
}

export class Analyzer {
    private rootDir: string;
    private checkDevDeps: boolean;
    private ignore: Set<string>;

    constructor(options: AnalyzerOptions) {
        this.rootDir = path.resolve(options.rootDir);
        this.checkDevDeps = options.checkDevDeps || false;
        this.ignore = new Set(options.ignore || []);
    }

    async getDependencies(): Promise<Record<string, string>> {
        const pkgPath = path.join(this.rootDir, 'package.json');
        if (!fs.existsSync(pkgPath)) {
            throw new Error('package.json not found');
        }
        const pkg = await fs.readJSON(pkgPath);
        let deps = { ...pkg.dependencies };
        if (this.checkDevDeps) {
            deps = { ...deps, ...pkg.devDependencies };
        }
        return deps;
    }

    async getSourceFiles(): Promise<string[]> {
        const { glob } = await import('glob');
        return glob(
            '**/*.{js,jsx,ts,tsx,mjs,cjs}',
            {
                cwd: this.rootDir,
                ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/coverage/**'],
                absolute: true,
            }
        );
    }

    async findUsedDependencies(files: string[]): Promise<Set<string>> {
        const used = new Set<string>();

        for (const file of files) {
            try {
                const content = await fs.readFile(file, 'utf-8');
                const ast = parse(content, {
                    sourceType: 'module',
                    plugins: ['jsx', 'typescript', 'decorators-legacy', 'dynamicImport', 'exportDefaultFrom'],
                    errorRecovery: true,
                });

                traverse(ast, {
                    ImportDeclaration: ({ node }) => {
                        this.addDependency(used, node.source.value);
                    },
                    CallExpression: ({ node }) => {
                        if (
                            (node.callee.type === 'Identifier' && node.callee.name === 'require') ||
                            node.callee.type === 'Import'
                        ) {
                            const arg = node.arguments[0];
                            if (arg && arg.type === 'StringLiteral') {
                                this.addDependency(used, arg.value);
                            }
                        }
                    },
                    ExportNamedDeclaration: ({ node }) => {
                        if (node.source) {
                            this.addDependency(used, node.source.value);
                        }
                    },
                    ExportAllDeclaration: ({ node }) => {
                        if (node.source) {
                            this.addDependency(used, node.source.value);
                        }
                    }
                });
            } catch (err: any) {
                logger.debug(`Failed to parse ${file}: ${err.message}`);
            }
        }

        return used;
    }

    private addDependency(set: Set<string>, importPath: string) {
        if (importPath.startsWith('.')) return; // Local import
        if (path.isAbsolute(importPath)) return; // Absolute path (rare but possible)

        // Handle scoped packages like @scope/pkg and normal pkgs like lodash/fp
        let pkgName = importPath;
        if (importPath.startsWith('@')) {
            const parts = importPath.split('/');
            if (parts.length >= 2) {
                pkgName = `${parts[0]}/${parts[1]}`;
            }
        } else {
            const parts = importPath.split('/');
            if (parts.length > 0) {
                pkgName = parts[0];
            }
        }

        set.add(pkgName);

        // Also add types automatically
        set.add(`@types/${pkgName.replace('@', '').replace('/', '__')}`);
    }

    async analyze(): Promise<DependencyUsage[]> {
        const deps = await this.getDependencies();
        const files = await this.getSourceFiles();
        const usedDeps = await this.findUsedDependencies(files);

        // Special check for config files (simple existence check for now)
        // In a real scenario, we might parse them, but usually devDeps are used there.
        // If checkDevDeps is false, we don't worry too much about build configs unless they use production deps.

        return Object.keys(deps).map((name) => {
            // If ignored, mark as used to prevent deletion
            if (this.ignore.has(name)) {
                return { name, isUsed: true, filesUsedIn: ['(ignored)'] };
            }

            const isUsed = usedDeps.has(name);
            return {
                name,
                isUsed,
                filesUsedIn: [] // TODO: Track which files use it for better reporting
            };
        });
    }
}
