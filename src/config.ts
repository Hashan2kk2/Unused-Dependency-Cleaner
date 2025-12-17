import fs from 'fs-extra';
import path from 'path';

export interface Config {
    ignore: string[];
}

export const loadConfig = async (rootDir: string, ignoreFile?: string): Promise<Config> => {
    const defaultIgnore = ['@types/node', 'typescript', 'ts-node'];
    let config: Config = { ignore: [...defaultIgnore] };

    const possibleConfigFiles = ignoreFile
        ? [ignoreFile]
        : ['.unusedignore', '.unusedrc.json'];

    for (const file of possibleConfigFiles) {
        const filePath = path.resolve(rootDir, file);
        if (await fs.pathExists(filePath)) {
            try {
                const content = await fs.readFile(filePath, 'utf-8');
                // Handle line-separated ignore file (like .gitignore)
                if (!file.endsWith('.json')) {
                    const lines = content.split('\n')
                        .map(l => l.trim())
                        .filter(l => l && !l.startsWith('#'));
                    config.ignore.push(...lines);
                } else {
                    const jsonConfig = JSON.parse(content);
                    if (jsonConfig.ignore && Array.isArray(jsonConfig.ignore)) {
                        config.ignore.push(...jsonConfig.ignore);
                    }
                }
            } catch (e) {
                console.warn('Failed to parse config file:', file);
            }
        }
    }

    return config;
};
