import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('reports healthy', () => {
    expect(new HealthController().check()).toEqual({ status: 'ok' });
  });
});
