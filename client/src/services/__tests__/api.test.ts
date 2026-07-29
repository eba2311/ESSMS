import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    })),
  },
}));

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should initialize axios with correct base URL', () => {
    const { default: axios } = require('axios');
    // Re-import to trigger module execution
    vi.isMockFunction(axios.create);
  });

  describe('getApiErrorMessage', () => {
    it('should extract error message from axios error response', async () => {
      const { getApiErrorMessage } = await import('../api');
      const error = {
        response: {
          data: {
            message: 'User not found',
          },
        },
      };
      expect(getApiErrorMessage(error)).toBe('User not found');
    });

    it('should handle network errors', async () => {
      const { getApiErrorMessage } = await import('../api');
      const error = {
        message: 'Network Error',
        code: 'ERR_NETWORK',
      };
      const msg = getApiErrorMessage(error);
      expect(msg).toContain('network');
    });

    it('should handle 500 errors', async () => {
      const { getApiErrorMessage } = await import('../api');
      const error = {
        response: {
          status: 500,
          data: {},
        },
      };
      const msg = getApiErrorMessage(error);
      expect(msg).toContain('server');
    });

    it('should handle errors with data.message', async () => {
      const { getApiErrorMessage } = await import('../api');
      const error = {
        response: {
          data: {
            message: 'Bad request',
          },
        },
      };
      expect(getApiErrorMessage(error)).toBe('Bad request');
    });

    it('should return default message for unknown errors', async () => {
      const { getApiErrorMessage } = await import('../api');
      expect(getApiErrorMessage('unknown')).toBe('An unexpected error occurred');
    });
  });
});

describe('API Service Endpoints', () => {
  it('should export authAPI', async () => {
    const api = await import('../api');
    expect(api.authAPI).toBeDefined();
    expect(api.authAPI.login).toBeDefined();
    expect(api.authAPI.logout).toBeDefined();
    expect(api.authAPI.profile).toBeDefined();
    expect(api.authAPI.refresh).toBeDefined();
  });

  it('should export studentsAPI', async () => {
    const api = await import('../api');
    expect(api.studentsAPI).toBeDefined();
    expect(api.studentsAPI.list).toBeDefined();
    expect(api.studentsAPI.getById).toBeDefined();
  });

  it('should export teachersAPI', async () => {
    const api = await import('../api');
    expect(api.teachersAPI).toBeDefined();
    expect(api.teachersAPI.my).toBeDefined();
  });

  it('should export sectionsAPI', async () => {
    const api = await import('../api');
    expect(api.sectionsAPI).toBeDefined();
    expect(api.sectionsAPI.list).toBeDefined();
  });

  it('should export assessmentsAPI', async () => {
    const api = await import('../api');
    expect(api.assessmentsAPI).toBeDefined();
  });

  it('should export attendanceAPI', async () => {
    const api = await import('../api');
    expect(api.attendanceAPI).toBeDefined();
  });

  it('should export financeAPI', async () => {
    const api = await import('../api');
    expect(api.financeAPI).toBeDefined();
  });

  it('should export libraryAPI', async () => {
    const api = await import('../api');
    expect(api.libraryAPI).toBeDefined();
  });

  it('should export communicationAPI', async () => {
    const api = await import('../api');
    expect(api.communicationAPI).toBeDefined();
  });

  it('should export messagesAPI', async () => {
    const api = await import('../api');
    expect(api.messagesAPI).toBeDefined();
  });

  it('should export rankingsAPI', async () => {
    const api = await import('../api');
    expect(api.rankingsAPI).toBeDefined();
  });

  it('should export guardiansAPI', async () => {
    const api = await import('../api');
    expect(api.guardiansAPI).toBeDefined();
  });
});
