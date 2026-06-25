# Angular 22 Upgrade Plan (Native Federation Monorepo)

## Goal

Upgrade this workspace from Angular 21 to Angular 22 with Native Federation support, then verify build, unit tests, and e2e tests across all three applications:

- shell
- mfe-customers
- mfe-accounts

This document is a complete execution runbook so the work can be resumed later without re-analysis.

## Current Baseline (Verified)

- Node: 22.23.1
- npm: 11.17.0
- Angular workspace framework version: 21
- Builders in use: @angular-architects/native-federation:build (all apps)
- Key package state from package.json:
  - @angular/\*: 21.x
  - @angular-architects/native-federation: 21.1.1
  - @softarc/native-federation-node: 3.5.2
  - typescript: ~5.9.2

## Critical Compatibility Facts

1. Angular 22 is available and updatable via Angular CLI.
2. Angular 22 requires TypeScript >=6.0 and <6.1.
3. Native Federation 22 exists, but the package latest tag may still point to 21.x.
4. Because of that tag mismatch, Native Federation must be explicitly pinned to 22.x during upgrade.
5. @softarc/native-federation-node must move to 4.x to stay aligned with federation stack updates.

## Upgrade Strategy

Use a phased approach with hard validation gates after each phase:

1. Prepare and snapshot.
2. Upgrade Angular core/cli/build stack to 22.
3. Upgrade federation packages and TypeScript.
4. Reinstall cleanly.
5. Run migrations/fixes.
6. Validate lint/build/tests/e2e.
7. Capture results and finalize.

## Phase 0 - Preparation

### 0.1 Create safety point

- Ensure all current work is committed or stashed.
- Create a branch:

```bash
git checkout -b chore/upgrade-angular-22
```

### 0.2 Record baseline (optional but recommended)

```bash
node -v
npm -v
npx ng version
```

## Phase 1 - Package Upgrade

### 1.1 Update Angular CLI and Core

```bash
npx ng update @angular/cli@22 @angular/core@22 --allow-dirty
```

Notes:

- Keep --allow-dirty only if needed due to local changes.
- If peer warnings appear, do not force immediately; address explicit package mismatches first.

### 1.2 Update angular-eslint to 22

```bash
npx ng update angular-eslint@22 --allow-dirty
```

### 1.3 Pin Native Federation package to Angular 22 line

```bash
npm install -D @angular-architects/native-federation@22.0.1
```

If 22.0.1 causes issues, use 22.0.0 as fallback.

### 1.4 Align softarc federation runtime package

```bash
npm install @softarc/native-federation-node@^4.0.0
```

### 1.5 Upgrade TypeScript to Angular 22-compatible range

```bash
npm install -D typescript@~6.0.0
```

## Phase 2 - Clean Install

Run a clean reinstall after dependency updates:

```bash
rm -rf node_modules package-lock.json
npm install
```

Windows note:

- If rm is unavailable in the active shell, use:

```bash
rd /s /q node_modules
del package-lock.json
npm install
```

## Phase 3 - Migration and Static Validation

### 3.1 Run Angular migrations if pending

```bash
npx ng update --allow-dirty
```

Apply any remaining migration suggestions package-by-package if listed.

### 3.2 Run formatting and lint

```bash
npm run format
npm run lint
```

If lint auto-fixes files, rerun lint once to ensure clean pass.

## Phase 4 - Build and Test Validation

### 4.1 Build all applications

```bash
npm run build:all
```

### 4.2 Unit tests

```bash
npm run test:all
```

### 4.3 E2E tests

```bash
npm run test:e2e
```

### 4.4 Optional CI-equivalent command

```bash
npm run test:ci
```

## Phase 5 - Runtime Smoke Checks

### 5.1 Start all apps

```bash
npm run start:all
```

### 5.2 Validate manually

1. Open shell at localhost:4200.
2. Navigate to customers remote and verify list/detail flows.
3. Navigate to accounts remote and verify list/detail flows.
4. Confirm no federation loading errors in browser console.
5. Confirm API mocks and i18n still behave as expected.

## Troubleshooting Matrix

### A. Peer dependency conflict on federation packages

- Re-check installed versions:

```bash
npm ls @angular-architects/native-federation @softarc/native-federation-node @angular/build
```

- Ensure these are aligned:
  - @angular/build: 22.x
  - @angular-architects/native-federation: 22.x
  - @softarc/native-federation-node: 4.x

### B. TypeScript range errors

- Ensure TypeScript is 6.0.x:

```bash
npm ls typescript
```

- Reinstall if multiple conflicting versions are pulled.

### C. ng update blocked by dirty repo

- Preferred: commit current changes first.
- Alternative: use --allow-dirty only during upgrade commands.

### D. Unit test warnings about unit-test builder with native federation

- Known warning in this repo context; verify actual test pass/fail status instead of warning text.

## Acceptance Criteria

Upgrade is complete only when all are true:

1. package.json shows Angular 22-aligned stack.
2. Native Federation package is on 22.x.
3. @softarc/native-federation-node is on 4.x.
4. TypeScript is 6.0.x.
5. npm run lint passes.
6. npm run build:all passes.
7. npm run test:all passes.
8. npm run test:e2e passes.
9. Runtime smoke checks across shell/customers/accounts pass.

## Suggested Commit Plan

Use small, reviewable commits:

1. chore: upgrade angular core/cli/build stack to v22
2. chore: align native federation packages with angular 22
3. chore: upgrade typescript to 6.0
4. chore: apply angular 22 migrations
5. test: fix lint/test regressions after angular 22 upgrade

## Rollback Plan

If blocked and quick recovery is needed:

1. Abort current changes:
   - git reset hard only if explicitly approved.
2. Preferred safe rollback:
   - git restore modified files (or checkout clean branch).
   - reinstall from previous lockfile.
3. Keep a notes log of blockers to retry with exact errors.

## Execution Checklist

- [ ] Create branch and snapshot baseline versions
- [ ] Upgrade @angular/cli and @angular/core to 22
- [ ] Upgrade angular-eslint to 22
- [ ] Pin @angular-architects/native-federation to 22.x
- [ ] Upgrade @softarc/native-federation-node to 4.x
- [ ] Upgrade TypeScript to 6.0.x
- [ ] Clean reinstall dependencies
- [ ] Run ng update migration pass
- [ ] Run format and lint
- [ ] Run build:all
- [ ] Run test:all
- [ ] Run test:e2e
- [ ] Run manual federation smoke checks
- [ ] Commit in small logical steps

## Quick Start Commands (Minimal Sequence)

```bash
git checkout -b chore/upgrade-angular-22
npx ng update @angular/cli@22 @angular/core@22 --allow-dirty
npx ng update angular-eslint@22 --allow-dirty
npm install -D @angular-architects/native-federation@22.0.1 typescript@~6.0.0
npm install @softarc/native-federation-node@^4.0.0
rm -rf node_modules package-lock.json
npm install
npx ng update --allow-dirty
npm run lint
npm run build:all
npm run test:all
npm run test:e2e
```
