#! /usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import minimist from 'minimist';
import { red } from 'kolorist';
import { VariantConfig } from '../types';
import prompt from '../prompt';
import { copy } from '../utils';

// Avoids autoconversion to number of the project name by defining that the args
// non associated with an option ( _ ) needs to be parsed as a string. See #4606
const argv = minimist(process.argv.slice(2), { string: ['_'] });
const cwd = process.cwd();

/**
 * Copy every files from the variant into the new project
 * @param variant name of the variant
 * @param framework_dir path to the framework dir
 * @param template_dir path to the template dir
 * @param root path to the new project root
 * @returns config of the variant if exists, null otherwise
 */
function importVariant(variant: string, framework_dir: string, template_dir: string, root: string) {
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
    const filePath = path.resolve(variant_dir, file.path);
    
    copy(filePath, root);
  }

  return config;
}

async function init() {
  const { target_dir, framework, variants } = await prompt(argv._[0]);

  const framework_dir = path.resolve(__dirname, '../../templates/', framework.name);
  const template_dir = path.resolve(framework_dir, 'vanilla');

  if (!fs.existsSync(template_dir)) {
    console.error(red('✖') + ' Framework not implemented (yet)');
    process.exit(1);
  }

  const root = path.join(cwd, target_dir!);

  if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true });
  }

  console.log(`\nScaffolding project in ${root}...`);

  const files = fs.readdirSync(template_dir);

  for (const file of files.filter((f) => f !== 'package.json')) {
    copy(path.resolve(template_dir, file), root);
  }

  // Get the package json of the template
  const package_json = JSON.parse(fs.readFileSync(path.join(template_dir, 'package.json'), 'utf8'));

  // Add every files of the variants in the project
  // and update the package json with the new dependencies
  for (const variant of variants) {
    const config = importVariant(variant, framework_dir, template_dir, root);

    if (!config) continue;

    package_json.dependencies = { ...package_json.dependencies, ...config.dependencies };
    package_json.devDependencies = { ...package_json.devDependencies, ...config.devDependencies };
  }

  fs.writeFileSync(path.resolve(root, 'package.json'), JSON.stringify(package_json, null, 2));

  console.log(`\nDone. Now run:\n`);
  console.log(`  cd ${path.relative(cwd, root)}`);
  console.log(`  npm install`);
  console.log(`  npm run dev`);
  console.log();
}

init().catch(console.error);
