import prompts from 'prompts';
import { red, reset, green, lightGreen, lightBlue } from 'kolorist';
import { isValidPackageName } from './utils';
import { Framework } from './types';
import { FRAMEWORKS } from './config';

export default async function (target_dir?: string) {
  const default_target_dir = 'test-project';

  const result: { projectName: string; framework: Framework; variants: string[] } = await prompts(
    [
      {
        type: target_dir ? null : 'text',
        name: 'projectName',
        message: reset('Project name:'),
        initial: default_target_dir,
        onState: (state) => {
          target_dir = state.value || default_target_dir;
        },
        validate: (dir) =>
          isValidPackageName(dir) || 'Name must be a valid npm package name, (allowed characters: a-z 0-9 - _ ~)',
      },
      {
        type: 'select',
        name: 'framework',
        message: reset('Select a framework:'),
        initial: 0,
        choices: FRAMEWORKS.map((f) => {
          const framework_color = f.color;
          return {
            title: framework_color(f.name),
            value: f,
          };
        }),
      },
      {
        type: (f: Framework) => (f && f.variants ? 'multiselect' : null),
        name: 'variants',
        message: reset('Select a variant:'),
        choices: (f: Framework) =>
          f.variants.map((variant) => {
            const variant_color = variant.color;
            return {
              title: variant_color(variant.name),
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

  if (result.variants.length === 0) {
    console.error(red('✖') + ' You must select at least one variant');
    process.exit(1);
  }

  return { target_dir, ...result };
}
