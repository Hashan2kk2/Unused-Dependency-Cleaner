import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { Analyzer } from './analyzer';
import { Cleaner } from './cleaner';
import { loadConfig } from './config';
import { logger } from './logger';

export const cli = new Command();

cli
    .name('unused-dep-clean')
    .description('A CLI tool to scan and remove unused npm dependencies')
    .version('1.0.0');

cli
    .command('scan')
    .description('Scan project for unused dependencies')
    .option('--dev', 'Check devDependencies as well')
    .option('--ignore <file>', 'Path to custom ignore file')
    .option('--verbose', 'Enable verbose logging')
    .action(async (options) => {
        const rootDir = process.cwd();
        const config = await loadConfig(rootDir, options.ignore);

        if (options.verbose) {
            logger.debug(`Loaded config with ignores: ${config.ignore.join(', ')}`);
        }

        const spinner = ora('Scanning project...').start();

        try {
            const analyzer = new Analyzer({
                rootDir,
                checkDevDeps: options.dev,
                ignore: config.ignore
            });

            const results = await analyzer.analyze();
            spinner.stop();

            const unused = results.filter(r => !r.isUsed);

            if (unused.length === 0) {
                logger.success('No unused dependencies found!');
            } else {
                logger.warn(`Found ${unused.length} unused dependencies:`);
                unused.forEach(dep => {
                    console.log(chalk.red(`- ${dep.name}`));
                });
            }
        } catch (err: any) {
            spinner.fail('Scan failed');
            logger.error(err.message);
            if (options.verbose) console.error(err);
            process.exit(1);
        }
    });

cli
    .command('clean [packageName]')
    .description('Remove unused dependencies (or a specific one if packageName is provided)')
    .option('--dry-run', 'Simulate removal without modifying files')
    .option('--dev', 'Check devDependencies as well')
    .option('--ignore <file>', 'Path to custom ignore file')
    .option('--verbose', 'Enable verbose logging')
    .action(async (packageName, options) => {
        const rootDir = process.cwd();
        const config = await loadConfig(rootDir, options.ignore);

        if (options.verbose) {
            logger.debug(`Loaded config with ignores: ${config.ignore.join(', ')}`);
        }

        const spinner = ora('Analyzing project...').start();

        try {
            const analyzer = new Analyzer({
                rootDir,
                checkDevDeps: options.dev,
                ignore: config.ignore
            });

            const results = await analyzer.analyze();
            spinner.stop();

            let unused = results.filter(r => !r.isUsed).map(r => r.name);

            if (packageName) {
                if (unused.includes(packageName)) {
                    unused = [packageName];
                    logger.info(`Targeting specific dependency: ${packageName}`);
                } else {
                    logger.warn(`Dependency '${packageName}' is either used or not found.`);
                    return;
                }
            }

            if (unused.length === 0) {
                logger.success('No unused dependencies found to clean.');
                return;
            }

            logger.warn(`Found ${unused.length} unused dependencies:`);
            unused.forEach(dep => console.log(chalk.red(`- ${dep}`)));

            if (options.dryRun) {
                logger.info('Dry run enabled. No changes made.');
            } else {
                const cleaner = new Cleaner(rootDir);
                await cleaner.removeDependencies(unused);
            }

        } catch (err: any) {
            spinner.fail('Cleanup failed');
            logger.error(err.message);
            if (options.verbose) console.error(err);
            process.exit(1);
        }
    });
