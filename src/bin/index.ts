#! /usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import minimist from 'minimist';
import { red } from 'kolorist';
import { VariantConfig } from '../types';
import prompt from '../prompt';
import { copy } from '../utils';

// Avoids autoconversion to number of the project name by defining that the args
// non associated with an option ( _ ) needs to be parsed as a string
const argv = minimist(process.argv.slice(2), { string: ['_'] });
const cwd = process.cwd();

/**
 * Copy every files from the variant into the new project
 * @param variant name of the variant
 * @param framework_dir path to the framework dir
 * @param template_dir path to the template dir
 * @param project_dir path to the new project dir
 * @returns config of the variant if exists, null otherwise
 */
function importVariant(variant: string, framework_dir: string, template_dir: string, project_dir: string) {
  // Get the path to the variant dir
  const variant_dir = path.resolve(framework_dir, variant);

  // If the path doesn't exist, return null
  if (!fs.existsSync(variant_dir)) {
    console.error(red('✖') + ` Variant ${variant} not implemented (yet)`);
    return null;
  }

  // Get the config file of the variant
  const config: VariantConfig = JSON.parse(fs.readFileSync(path.join(variant_dir, 'config.json'), 'utf8'));

  // Copy every files from the variant into the new project
  for (const file of config.files) {
    const file_path = path.resolve(variant_dir, file.path);
    const output_path = path.resolve(project_dir, file.path);

    copy(file_path, output_path);
  }

  return config;
}

async function init() {
  const { target_dir, framework, variants } = await prompt(argv._[0]);

  // Defines path to the frameworks templates (located in /templates)
  const framework_dir = path.resolve(__dirname, '../../templates/', framework.name);

  // Defines path to the default variant
  const template_dir = path.resolve(framework_dir, 'vanilla');

  if (!fs.existsSync(template_dir)) {
    console.error(red('✖') + ' Framework not implemented (yet)');
    process.exit(1);
  }

  // Defines path to the new created project
  const project_dir = path.join(cwd, target_dir!);

  // If path doesn't exist, creates it
  if (!fs.existsSync(project_dir)) {
    fs.mkdirSync(project_dir, { recursive: true });
  }

  console.log(`\nScaffolding project in ${project_dir}...`);

  // Copy every files from main variant in new project
  const files = fs.readdirSync(template_dir);

  for (const file of files.filter((f) => f !== 'package.json')) {
    const file_path = path.join(template_dir, file);
    const output_path = path.join(project_dir, file);

    copy(file_path, output_path);
  }

  // Get the package json of the template
  const package_json = JSON.parse(fs.readFileSync(path.join(template_dir, 'package.json'), 'utf8'));

  // Add every files of the variants in the project
  // and update the package json with the new dependencies
  for (const variant of variants) {
    const config = importVariant(variant, framework_dir, template_dir, project_dir);

    if (!config) continue;

    package_json.dependencies = { ...package_json.dependencies, ...config.dependencies };
    package_json.devDependencies = { ...package_json.devDependencies, ...config.devDependencies };
  }

  // Write the package.json in the new project
  fs.writeFileSync(path.resolve(project_dir, 'package.json'), JSON.stringify(package_json, null, 2));

  console.log(`\nDone. Now run:\n`);
  console.log(`  cd ${path.relative(cwd, project_dir)}`);
  console.log(`  npm install`);
  console.log(`  npm run dev`);
  console.log();
}

init().catch(console.error);
