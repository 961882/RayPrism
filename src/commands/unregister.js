/**
 * rayprism unregister <name> — Remove project from registry
 */

import { unregisterProject } from '../utils/registry.js';
import { log } from '../utils/logger.js';

export async function unregister(name) {
  const removed = unregisterProject(name);
  if (removed) {
    log.ok(`已从注册表移除: ${name}`);
  } else {
    log.warn(`注册表中未找到: ${name}`);
  }
}
