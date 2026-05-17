# Testing Guide

## Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage

# E2E (Maestro — requires CLI)
npm run test:e2e
```

## Test Structure

```
tests/
  unit/          Utility functions, schemas, sync queue
  components/    UI component tests
  screens/       Screen-level smoke tests
  fixtures/      Mock data (trips, activities, users)
  mocks/         Configured in setup.ts
  utils/         renderWithProviders helper
  e2e/           Maestro flows (onboarding, login, trips, sign-out)
```

## Mocking Strategy

Tests run **without Supabase credentials**. The following are mocked in `tests/setup.ts`:

- `react-native-reanimated`
- `react-native-mmkv` (in-memory Map)
- `expo-secure-store`
- `expo-haptics`, `expo-blur`, `expo-linear-gradient`, `expo-image`
- `expo-router`
- `@react-native-community/netinfo`
- `react-native-maps`, `expo-image-picker`

## Phase 2 coverage

| Area | Tests |
|------|--------|
| Budget utils | `tests/unit/budget.test.ts` |
| Packing utils | `tests/unit/packing.test.ts` |
| Budget UI | `tests/components/BudgetProgressBar.test.tsx` |
| Sync queue | `tests/unit/syncQueue.test.ts` |
| Trip / Home screens | `tests/screens/*.test.tsx` |

Trip hooks are mocked in screen tests to avoid MMKV initialization issues.

## Stable Test IDs

| testID | Component |
|--------|-----------|
| `login-button` | Login submit |
| `create-trip-button` | FAB on My Trips |
| `trip-card` | Trip list card |
| `add-activity-button` | Add activity in timeline |
| `activity-card` | Activity card |
| `sign-out-button` | Profile sign out |

## Adding Regression Tests

1. Add unit tests for new utility functions in `tests/unit/`
2. Add component tests for new shared components in `tests/components/`
3. Use `renderWithProviders` from `tests/utils/renderWithProviders.tsx`
4. Assign `testID` props using constants from `constants/testIds.ts`

## Coverage

Coverage is collected from:

- `utils/**`
- `services/**`
- `features/**/schemas/**`
- `components/**`

Run `npm run test:coverage` and check the `coverage/` directory.

## CI

GitHub Actions runs lint, typecheck, and tests on every push/PR to `main`.
