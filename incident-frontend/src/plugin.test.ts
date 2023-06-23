import { incidentFrontendPlugin } from './plugin';

describe('incident-frontend', () => {
  it('should export plugin', () => {
    expect(incidentFrontendPlugin).toBeDefined();
  });
});
