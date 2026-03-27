export const TAG_STATUS = '[AG-BRIDGE:STATUS]';
export const TAG_DONE = '[AG-BRIDGE:DONE]';
export const TAG_ERROR = '[AG-BRIDGE:ERROR]';

export function emitStatus(text: string): void {
  console.log(`${TAG_STATUS} ${text}`);
}

export function emitDone(text: string): void {
  console.log(`${TAG_DONE} ${text}`);
}

export function emitError(text: string): void {
  console.error(`${TAG_ERROR} ${text}`);
}
