/**
 * Colored terminal logger — zero dependencies
 */

const C = {
  green:  s => `\x1b[32m${s}\x1b[0m`,
  yellow: s => `\x1b[33m${s}\x1b[0m`,
  cyan:   s => `\x1b[36m${s}\x1b[0m`,
  red:    s => `\x1b[31m${s}\x1b[0m`,
  bold:   s => `\x1b[1m${s}\x1b[0m`,
  dim:    s => `\x1b[2m${s}\x1b[0m`,
};

export const log = {
  ok:   msg => console.log(C.green(`✅ ${msg}`)),
  info: msg => console.log(C.cyan(`ℹ️  ${msg}`)),
  warn: msg => console.log(C.yellow(`⚠️  ${msg}`)),
  err:  msg => { console.error(C.red(`❌ ${msg}`)); throw new Error('EXIT:' + msg); },
};

export { C };
