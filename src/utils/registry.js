/**
 * Project registry — ~/.rayprism/registry.json
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { REGISTRY_FILE, RAYPRISM_CACHE } from './constants.js';

function ensure() {
  mkdirSync(RAYPRISM_CACHE, { recursive: true });
  if (!existsSync(REGISTRY_FILE)) {
    writeFileSync(REGISTRY_FILE, JSON.stringify({ projects: [] }, null, 2));
  }
}

export function loadRegistry() {
  ensure();
  return JSON.parse(readFileSync(REGISTRY_FILE, 'utf8'));
}

export function saveRegistry(reg) {
  ensure();
  writeFileSync(REGISTRY_FILE, JSON.stringify(reg, null, 2));
}

export function registerProject({ name, branch, path, source, templateVersion }) {
  const reg = loadRegistry();
  reg.projects = reg.projects.filter(p => p.name !== name);
  reg.projects.push({
    name,
    branch,
    path,
    source,
    template_version: templateVersion,
    created: new Date().toISOString(),
  });
  saveRegistry(reg);
}

export function unregisterProject(name) {
  const reg = loadRegistry();
  const before = reg.projects.length;
  reg.projects = reg.projects.filter(p => p.name !== name);
  saveRegistry(reg);
  return reg.projects.length < before;
}
