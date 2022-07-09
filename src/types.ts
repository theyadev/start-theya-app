export interface VariantFile {
  path: string;
}

export interface VariantConfig {
  files: VariantFile[];
  dependencies: { [key: string]: string };
  devDependencies: { [key: string]: string };
}

export interface Framework {
  name: string;
  variants: Variant[];
  color: (str: string) => string;
}

export interface Variant {
  name: string;
  color: (str: string) => string;
}
