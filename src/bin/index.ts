#! /usr/bin/env node

import prompts from 'prompts';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import minimist from 'minimist';
import { red, reset, green, lightGreen, lightBlue } from 'kolorist';

// Avoids autoconversion to number of the project name by defining that the args
// non associated with an option ( _ ) needs to be parsed as a string. See #4606
const argv = minimist(process.argv.slice(2), { string: ['_'] });
const cwd = process.cwd();

interface VariantFile {
  path: string;
  action: 'copy' | 'replace';
}

interface VariantConfig {
  files: VariantFile[];
  dependencies: { [key: string]: string };
  devDependencies: { [key: string]: string };
}

interface Framework {
  name: string;
  variants: Variant[];
  color: (str: string) => string;
}

interface Variant {
  name: string;
  color: (str: string) => string;
}

const FRAMEWORKS: Framework[] = [
  {
    name: 'next',
    color: lightBlue,
    variants: [
      {
        name: 'socketio',
        color: green,
      },
      {
        name: 'redis',
        color: red,
      },
      {
        name: 'mongodb',
        color: lightGreen,
      },
      {
        name: 'tailwindcss',
        color: lightBlue,
      },
    ],
  },
  {
    name: 'nuxt3',
    color: lightGreen,
    variants: [
      {
        name: 'socketio',
        color: green,
      },
      {
        name: 'redis',
        color: red,
      },
    ],
  },
];

type RenameFiles = { [key: string]: string };
const renameFiles: RenameFiles = {
  _gitignore: '.gitignore',
};

async function init() {
  let targetDir = formatTargetDir(argv._[0]);

  const defaultTargetDir = 'test-project';

  const result = await prompts(
    [
      {
        type: targetDir ? null : 'text',
        name: 'projectName',
        message: reset('Project name:'),
        initial: defaultTargetDir,
        onState: (state) => {
          targetDir = formatTargetDir(state.value) || defaultTargetDir;
        },
        validate: (dir) =>
          isValidPackageName(dir) || 'Name must be a valid npm package name, (allowed characters: a-z 0-9 - _ ~)',
      },
      {
        type: 'select',
        name: 'framework',
        message: reset('Select a framework:'),
        initial: 0,
        choices: FRAMEWORKS.map((framework) => {
          const frameworkColor = framework.color;
          return {
            title: frameworkColor(framework.name),
            value: framework,
          };
        }),
      },
      {
        type: (framework: Framework) => (framework && framework.variants ? 'multiselect' : null),
        name: 'variants',
        message: reset('Select a variant:'),
        // @ts-ignore
        choices: (framework: Framework) =>
          framework.variants.map((variant) => {
            const variantColor = variant.color;
            return {
              title: variantColor(variant.name),
              value: variant.name,
            };
          }),
      },
    ],
    {
      onCancel: () => {
        throw new Error(red('✖') + ' Operation cancelled');
      },
    },
  ).catch((err) => {
    console.error(red('✖') + ' ' + err.message);
    process.exit(1);
  });

  const { framework, variants }: { framework: Framework; variants: string[] } = result;

  if (variants.length === 0) {
    console.error(red('✖') + ' You must select at least one variant');
    process.exit(1);
  }

  const frameworkDir = path.resolve(__dirname, '../../templates/', framework.name);
  const templateDir = path.resolve(frameworkDir, 'vanilla');

  if (!fs.existsSync(templateDir)) {
    console.error(red('✖') + ' Framework not implemented (yet)');
    process.exit(1);
  }

  const root = path.join(cwd, targetDir!);

  if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true });
  }

  console.log(`\nScaffolding project in ${root}...`);

  const write = (file: string, content?: any) => {
    const targetPath = renameFiles[file] ? path.join(root, renameFiles[file]) : path.join(root, file);
    if (content) {
      fs.writeFileSync(targetPath, content);
    } else {
      copy(path.join(templateDir, file), targetPath);
    }
  };

  const files = fs.readdirSync(templateDir);

  for (const file of files) {
    write(file);
  }

  for (const variant of variants) {
    const variantDir = path.resolve(frameworkDir, variant);

    if (!fs.existsSync(variantDir)) {
      console.error(red('✖') + ` Variant ${variant} not implemented (yet)`);
      continue;
    }

    const config: VariantConfig = JSON.parse(fs.readFileSync(path.join(variantDir, 'config.json'), 'utf8'));

    for (const file of config.files) {
      const filePath = path.resolve(variantDir, file.path);

      if (file.action === 'copy') {
        copy(filePath, path.join(root, file.path));
      } else if (file.action === 'replace') {
        const content = fs.readFileSync(filePath, 'utf8');
        fs.writeFileSync(path.join(root, file.path), content);
      }
    }
  }

  console.log(`\nDone. Now run:\n`);
  console.log(`  cd ${path.relative(cwd, root)}`);
  console.log(`  npm install`);
  console.log(`  npm run dev`);
  console.log();
}

function copy(src: string, dest: string) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    copyDir(src, dest);
  } else {
    fs.copyFileSync(src, dest);
  }
}

function copyDir(srcDir: string, destDir: string) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.resolve(srcDir, file);
    const destFile = path.resolve(destDir, file);
    copy(srcFile, destFile);
  }
}

function formatTargetDir(targetDir?: string) {
  return targetDir?.trim().replace(/\/+$/g, '');
}

function isValidPackageName(projectName: string) {
  return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(projectName);
}

init().catch((e) => console.error);
