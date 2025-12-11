/**
 * Detect runtime environment
 */
export function detectEnvironment(): 'browser' | 'node' | 'unknown' {
  if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
    return 'browser';
  }
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    return 'node';
  }
  return 'unknown';
}

/**
 * Check if fetch API is available
 */
export function isFetchAvailable(): boolean {
  return typeof fetch !== 'undefined';
}

/**
 * Validate runtime environment and provide warnings
 */
export function validateEnvironment(): void {
  const env = detectEnvironment();

  if (!isFetchAvailable()) {
    if (env === 'node') {
      const nodeVersion = process.version;
      console.warn(
        `[OOMOL Fusion SDK] Detected Node.js ${nodeVersion}. ` +
        `The fetch API is natively supported in Node.js 18+. If you are using an older version, please install the node-fetch polyfill.`
      );
    } else {
      console.error('[OOMOL Fusion SDK] fetch API is not available, SDK will not function properly.');
    }
  }
}
