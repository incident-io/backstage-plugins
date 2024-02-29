# incident.io

[incident]: https://incident.io

Use this plugin to display ongoing and historic incidents against Backstage
components, and to provide quick links to open new incidents for that service
inside of [incident.io][incident].

## How it works

[importer]: https://github.com/incident/catalog-importer

Once you've configured the [catalog-importer][importer] to sync your Backstage
catalog into incident.io, you can visit your incident.io dashboard to create a
custom field that is powered by the Backstage Component catalog type.

We recommend creating a multi-select field called something like "Affected
services" or "Impacted components".

Remember the custom field ID (taken from the incident.io dashboard) as you'll
need it later -- you'll find it after `custom-field` in the URL (e.g.
https://app.incident.io/~/settings/custom-fields/01GD0ECMPR9WF330S1PHSRDVB7/edit)
or in the responses from our API.

## Install the plugin

The file paths mentioned in the following steps are relative to your app's root
directory — for example, the directory created by following the [Getting
Started](https://backstage.io/docs/getting-started/) guide and creating your app
with `npx @backstage/create-app`.

First, install the incident plugin via a CLI:

```bash
# From your Backstage app root directory
yarn add --cwd packages/app @incident-io/backstage
```

Next, add the plugin to `EntityPage.tsx` in
`packages/app/src/components/catalog` by adding the following code snippets.

Add the following imports to the top of the file:

```ts
import { EntityIncidentCard } from "@incident-io/backstage";
```

Find `const overviewContent` in `EntityPage.tsx`, and add the following snippet
inside the outermost `Grid` defined there, just before the closing `</Grid>`
tag:

```ts
<Grid item md={6}>
  <EntityIncidentCard />
</Grid>
```

If you want to include the list of incidents in places like the page for a
system, it's worth noting that `overviewContent` isn't reused on every page.
You may find you need to make more edits to `EntityPage`, based on your setup.

## Configure the plugin

[api-keys]: https://app.incident.io/settings/api-keys/
[api-docs]: https://api-docs.incident.io/

First, provide the [API key][api-keys] that the client will use to make
requests to the [incident.io API][api-docs].

Add the proxy configuration in `app-config.yaml`:

```yaml
proxy:
  ...
  '/incident/api':
    target: https://api.incident.io
    headers:
      Authorization: Bearer ${INCIDENT_API_KEY}
```

Finally, for any of the custom fields you've configured in incident that are
powered by Backstage catalog types, fill out the following details within
`app-config.yaml`:

```yaml
incident:
  fields:
    api: "<id-of-api-custom-field>"
    component: "<id-of-component-custom-field>"
    system: "<id-of-system-custom-field>"
    domain: "<id-of-domain-custom-field>"
```

If you don't have a custom field set up for one of these entities, then you
can omit that field completely. If you try and include the `EntityIncidentCard`
on the page for an entity which doesn't have the configuration, we'll show you
an error that directs you to update your config.
