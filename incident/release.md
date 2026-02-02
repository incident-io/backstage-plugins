# How to release

## First-time setup

Login to npm (if not already logged in):

```shell
npm login
```

You'll need to install dependencies:

```shell
yarn install
```

## Releasing

Make sure you're on the `master` branch with the latest changes:

```
git checkout master
git pull
```

Use `yarn version` to bump the version number (e.g. `yarn version patch`, or
`minor`, etc.):

```shell
yarn version patch  # or minor, major
```

Commit and push the version change:

```shell
git add package.json
git commit -m "Bump version to $(node -p "require('./package.json').version")"
git push
```

Build the plugin:

```shell
yarn build
```

Since this project uses Yarn 4 (as defined in `.yarnrc.yml`), use `npm publish`
directly instead of `yarn publish`.

```shell
npm publish
```
