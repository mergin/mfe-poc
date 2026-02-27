/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-angular'],

  rules: {
    // Scopes reflect the three projects in this monorepo + shared concerns
    'scope-enum': [
      2,
      'always',
      [
        'shell', // projects/shell
        'customers', // projects/mfe-customers
        'accounts', // projects/mfe-accounts
        'mocks', // mocks/ (shared MSW handlers & fixture data)
        'deps', // dependency updates
        'ci', // CI/CD pipeline
        'release', // version bumps / changelogs
      ],
    ],

    // Allow omitting a scope (e.g. "chore: bump node version")
    'scope-empty': [0],
  },
};
