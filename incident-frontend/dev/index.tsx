import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { incidentFrontendPlugin, IncidentFrontendPage } from '../src/plugin';

createDevApp()
  .registerPlugin(incidentFrontendPlugin)
  .addPage({
    element: <IncidentFrontendPage />,
    title: 'Root Page',
    path: '/incident-frontend'
  })
  .render();
