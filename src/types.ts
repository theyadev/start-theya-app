interface VariantEnvironnement {
  name: string;
  value: string;
}

export interface VariantConfig {
  dependencies: { [key: string]: string };
  devDependencies: { [key: string]: string };
  environnement: VariantEnvironnement[];
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
