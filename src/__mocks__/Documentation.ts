export default class Documentation {
  [x: string]: unknown;
  composes: string[] = [];
  descriptors: Record<string, unknown> = {};

  getPropDescriptor(name: string): unknown {
    return this.descriptors[name] || (this.descriptors[name] = {});
  }
  addComposes(name: string): void {
    this.composes.push(name);
  }
  set(key: string, value: unknown): void {
    this[key] = value;
  }
}
