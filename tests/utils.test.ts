import { detectEnvironment, isFetchAvailable, validateEnvironment } from '../src/utils';

describe('Utils', () => {
  describe('detectEnvironment', () => {
    it('应该检测到 Node.js 环境', () => {
      const env = detectEnvironment();
      expect(env).toBe('node');
    });
  });

  describe('isFetchAvailable', () => {
    it('应该检查 fetch API 是否可用', () => {
      const available = isFetchAvailable();
      // Node.js 18+ 应该有 fetch
      expect(typeof available).toBe('boolean');
    });
  });

  describe('validateEnvironment', () => {
    it('应该能够执行环境验证而不抛出错误', () => {
      expect(() => validateEnvironment()).not.toThrow();
    });
  });
});
