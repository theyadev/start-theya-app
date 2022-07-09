import fs from 'node:fs';
import path from 'node:path';

/**
 * Copy a file to it's destination, if it's a folder executes 'copyDir'
 * @param src path to copy
 * @param dest path to copy to
 */
export function copy(src: string, dest: string) {
  const stat = fs.statSync(src);

  if (stat.isDirectory()) {
    return copyDir(src, dest);
  }

  return fs.copyFileSync(src, dest);
}

/**
 * executes 'copy' for each file in a directory
 * @param src_dir path of folder to copy
 * @param dest_dir path to copy to
 */
export function copyDir(src_dir: string, dest_dir: string) {
  fs.mkdirSync(dest_dir, { recursive: true });
  for (const file of fs.readdirSync(src_dir)) {
    const src_file = path.resolve(src_dir, file);
    const dest_file = path.resolve(dest_dir, file);
    copy(src_file, dest_file);
  }
}

export function isValidPackageName(projectName: string) {
  return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(projectName);
}
