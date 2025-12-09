import {
  OomolFusionError,
  TaskSubmitError,
  TaskTimeoutError,
  TaskCancelledError,
  TaskFailedError,
  NetworkError,
} from '../src/errors';

describe('Errors', () => {
  describe('OomolFusionError', () => {
    it('应该创建基础错误', () => {
      const error = new OomolFusionError('测试错误');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(OomolFusionError);
      expect(error.message).toBe('测试错误');
      expect(error.name).toBe('OomolFusionError');
    });
  });

  describe('TaskSubmitError', () => {
    it('应该创建任务提交错误', () => {
      const error = new TaskSubmitError('提交失败', 400, 'Bad Request');
      expect(error).toBeInstanceOf(OomolFusionError);
      expect(error).toBeInstanceOf(TaskSubmitError);
      expect(error.message).toBe('提交失败');
      expect(error.statusCode).toBe(400);
      expect(error.response).toBe('Bad Request');
      expect(error.name).toBe('TaskSubmitError');
    });
  });

  describe('TaskTimeoutError', () => {
    it('应该创建任务超时错误', () => {
      const error = new TaskTimeoutError('session123', 'test-service', 5000);
      expect(error).toBeInstanceOf(OomolFusionError);
      expect(error).toBeInstanceOf(TaskTimeoutError);
      expect(error.sessionID).toBe('session123');
      expect(error.service).toBe('test-service');
      expect(error.timeout).toBe(5000);
      expect(error.name).toBe('TaskTimeoutError');
      expect(error.message).toContain('session123');
      expect(error.message).toContain('5000');
    });
  });

  describe('TaskCancelledError', () => {
    it('应该创建任务取消错误', () => {
      const error = new TaskCancelledError('session123', 'test-service');
      expect(error).toBeInstanceOf(OomolFusionError);
      expect(error).toBeInstanceOf(TaskCancelledError);
      expect(error.sessionID).toBe('session123');
      expect(error.service).toBe('test-service');
      expect(error.name).toBe('TaskCancelledError');
      expect(error.message).toContain('session123');
    });
  });

  describe('TaskFailedError', () => {
    it('应该创建任务失败错误', () => {
      const error = new TaskFailedError('任务执行失败', 'session123', 'test-service', 'failed');
      expect(error).toBeInstanceOf(OomolFusionError);
      expect(error).toBeInstanceOf(TaskFailedError);
      expect(error.message).toBe('任务执行失败');
      expect(error.sessionID).toBe('session123');
      expect(error.service).toBe('test-service');
      expect(error.state).toBe('failed');
      expect(error.name).toBe('TaskFailedError');
    });
  });

  describe('NetworkError', () => {
    it('应该创建网络错误', () => {
      const originalError = new Error('连接失败');
      const error = new NetworkError('网络请求失败', originalError);
      expect(error).toBeInstanceOf(OomolFusionError);
      expect(error).toBeInstanceOf(NetworkError);
      expect(error.message).toBe('网络请求失败');
      expect(error.originalError).toBe(originalError);
      expect(error.name).toBe('NetworkError');
    });

    it('应该在没有原始错误的情况下创建', () => {
      const error = new NetworkError('网络请求失败');
      expect(error).toBeInstanceOf(NetworkError);
      expect(error.originalError).toBeUndefined();
    });
  });
});
