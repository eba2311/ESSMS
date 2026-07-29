import { config } from '../../../config';

describe('Database Configuration', () => {
  it('should have default MongoDB URI', () => {
    expect(config.mongodbUri).toBeDefined();
    expect(config.mongodbUri).toContain('mongodb://');
  });

  it('should have test database URI', () => {
    expect(config.mongodbUriTest).toBeDefined();
    expect(config.mongodbUriTest).toContain('essms_test');
  });

  it('should have port configured', () => {
    expect(config.port).toBe(5002);
  });

  it('should have JWT secrets configured', () => {
    expect(config.jwtSecret).toBeDefined();
    expect(config.jwtRefreshSecret).toBeDefined();
  });
});
