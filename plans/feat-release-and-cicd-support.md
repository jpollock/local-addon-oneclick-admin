# feat: Implement Release and CI/CD Support (Simplified)

**Date:** 2025-12-05
**Status:** Ready for Implementation
**Type:** Enhancement

## Overview

Add tag-triggered GitHub releases to local-addon-oneclick-admin with minimal infrastructure. Since this addon is pure TypeScript with no native dependencies, we use a single universal package instead of multi-platform builds.

## Proposed Solution

Minimal release infrastructure:
1. Tag-triggered release workflow (reuses existing CI)
2. Single universal .tgz package
3. CHANGELOG.md for version history

**What we're NOT doing (and why):**
- No multi-platform builds (pure TypeScript, no native deps)
- No Git hooks (CI already enforces quality, small team)
- No GitHub templates (defer until external contributors)
- No separate INSTALL.md/CONTRIBUTING.md (README is sufficient)

## Implementation

### Step 1: Update ci.yml to Support Reuse

Add `workflow_call` trigger to existing CI workflow (1 line change):

**File: `.github/workflows/ci.yml`**
```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  workflow_call:  # <-- ADD THIS LINE
```

This allows the release workflow to reuse the existing CI jobs.

---

### Step 2: Create release.yml

**File: `.github/workflows/release.yml`**
```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  ci:
    uses: ./.github/workflows/ci.yml

  release:
    needs: ci
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - run: npm pack
      - uses: softprops/action-gh-release@v1
        with:
          files: "*.tgz"
          generate_release_notes: true
```

That's ~25 lines. Simple and effective.

---

### Step 3: Create CHANGELOG.md

**File: `CHANGELOG.md`**
```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Tag-triggered GitHub release workflow
- CHANGELOG.md for version tracking

## [0.1.0] - 2025-XX-XX

### Added
- Initial release
- Automatic one-click admin login for new Local sites
- WordPress CLI integration for user authentication
```

---

## Release Process

After implementation, creating a release is simple:

```bash
# Update CHANGELOG.md with changes
# Bump version in package.json
npm version patch  # or minor/major

# Push tag to trigger release
git push origin v0.1.1
```

GitHub Actions will:
1. Run full CI (lint, typecheck, test, build)
2. Create .tgz package
3. Publish GitHub release with auto-generated notes

---

## Files Changed

| File | Action | Lines |
|------|--------|-------|
| `.github/workflows/ci.yml` | Modify | +1 |
| `.github/workflows/release.yml` | Create | ~25 |
| `CHANGELOG.md` | Create | ~25 |

**Total: ~51 lines across 3 files**

---

## Acceptance Criteria

- [ ] `workflow_call` trigger added to ci.yml
- [ ] release.yml created and triggers on v* tags
- [ ] CHANGELOG.md created with Keep a Changelog format
- [ ] Test release with tag push (e.g., v0.1.1)
- [ ] GitHub release created with .tgz attachment

---

## References

- Existing CI: `.github/workflows/ci.yml`
- [softprops/action-gh-release](https://github.com/softprops/action-gh-release)
- [Keep a Changelog](https://keepachangelog.com/)
