/**
 * 检测运行时环境
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
 * 检查 fetch API 是否可用
 */
export function isFetchAvailable(): boolean {
  return typeof fetch !== 'undefined';
}

/**
 * 验证运行时环境并给出警告
 */
export function validateEnvironment(): void {
  const env = detectEnvironment();

  if (!isFetchAvailable()) {
    if (env === 'node') {
      const nodeVersion = process.version;
      console.warn(
        `[OOMOL Fusion SDK] 检测到 Node.js ${nodeVersion}。` +
        `fetch API 在 Node.js 18+ 中原生支持。如果您使用的是较旧版本,请安装 node-fetch polyfill。`
      );
    } else {
      console.error('[OOMOL Fusion SDK] fetch API 不可用,SDK 将无法正常工作。');
    }
  }
}
