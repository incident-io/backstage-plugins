import { createPlugin, createRoutableExtension } from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const incidentFrontendPlugin = createPlugin({
  id: 'incident-frontend',
  routes: {
    root: rootRouteRef,
  },
});

export const IncidentFrontendPage = incidentFrontendPlugin.provide(
  createRoutableExtension({
    name: 'IncidentFrontendPage',
    component: () =>
      import('./components/ExampleComponent').then(m => m.ExampleComponent),
    mountPoint: rootRouteRef,
  }),
);
