#! /usr/bin/env node

import prompts from 'prompts';
import fs from 'node:fs';
import path from 'node:path';
import minimist from 'minimist';
import { red, reset, green, lightGreen, lightBlue } from 'kolorist';

// Avoids autoconversion to number of the project name by defining that the args
// non associated with an option ( _ ) needs to be parsed as a string. See #4606
const argv = minimist(process.argv.slice(2), { string: ['_'] });
const cwd = process.cwd();

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
    name: 'nextjs',
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
        name: 'variant',
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

  const { framework, variant }: { framework: Framework; variant: string[] } = result;

  if (variant.length === 0) {
    console.error(red('✖') + ' You must select at least one variant');
    process.exit(1);
  }

  console.log(targetDir);
}

function formatTargetDir(targetDir?: string) {
  return targetDir?.trim().replace(/\/+$/g, '');
}

function isValidPackageName(projectName: string) {
  return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(projectName);
}

init().catch((e) => console.error);
