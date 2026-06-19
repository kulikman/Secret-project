## [1.4.0](https://github.com/kulikman/Secret-project/compare/v1.3.0...v1.4.0) (2026-06-19)

### ✨ Features

* add awakening map review list ([4d0b38f](https://github.com/kulikman/Secret-project/commit/4d0b38fa6ad7f6b8ca3b67953e9f924bec819865))

### 📝 Docs

* record supabase project reference ([eb75be7](https://github.com/kulikman/Secret-project/commit/eb75be784e7b581240e2aba503045b5003ad85b8))

## [1.3.0](https://github.com/kulikman/Secret-project/compare/v1.2.0...v1.3.0) (2026-06-17)

### ✨ Features

* add awakening map presentation foundation ([7b3c29b](https://github.com/kulikman/Secret-project/commit/7b3c29b378ae5f7e122728b32408eef52544520f))
* add request ids to api responses ([f230f76](https://github.com/kulikman/Secret-project/commit/f230f7680b4d32e18a8145beb14c0b66d898a67b))

## [1.2.0](https://github.com/kulikman/Secret-project/compare/v1.1.1...v1.2.0) (2026-06-17)

### ✨ Features

* add admin moderation and remove payments ([109679a](https://github.com/kulikman/Secret-project/commit/109679aab4467e5ad4e42c3f51ab14e70054ee35))

## [1.1.1](https://github.com/kulikman/Secret-project/compare/v1.1.0...v1.1.1) (2026-06-16)

### 🐛 Bug Fixes

* mark public api surfaces for knip ([8235c3d](https://github.com/kulikman/Secret-project/commit/8235c3da20708444d12ab0e9ec7c7cdbb0e23a6d))

## [1.1.0](https://github.com/kulikman/Secret-project/compare/v1.0.1...v1.1.0) (2026-06-16)

### ✨ Features

* implement secret bureau archive foundation ([ffc3f49](https://github.com/kulikman/Secret-project/commit/ffc3f49e083a0990d20a008b796612f6f0a65c76))

## [1.0.1](https://github.com/kulikman/Secret-project/compare/v1.0.0...v1.0.1) (2026-06-16)

### 🐛 Bug Fixes

* override vulnerable transitive dependencies ([c441631](https://github.com/kulikman/Secret-project/commit/c441631a7327a7ba82814062c713df6cb25b64e0))

## 1.0.0 (2026-06-16)

### 🐛 Bug Fixes

* avoid gitleaks false positive in api key example ([02d42f0](https://github.com/kulikman/Secret-project/commit/02d42f040081d99ad7ba31152b36abfdbe91ed99))

## [0.3.2](https://github.com/kulikman/Secret-project/compare/v0.3.1...v0.3.2) (2026-05-27)

### 🐛 Bug Fixes

* allow template build without backend env ([a2312b0](https://github.com/kulikman/Secret-project/commit/a2312b0b83fadac57d8c90754662ea4c13573670))

### ♻️ Refactoring

* harden api key verification ([22aafb4](https://github.com/kulikman/Secret-project/commit/22aafb442dab77892f1342e0ddc88d2e278043c1))
* move non-stripe logic into feature layers ([2ee4a55](https://github.com/kulikman/Secret-project/commit/2ee4a55524014ecec59621b904bd34676c30a012))

### 📝 Docs

* correct cron example auth comment ([ece9bc1](https://github.com/kulikman/Secret-project/commit/ece9bc1272d2c780242f3941ad337e9943b1ec3a))
* include build in template qa checklist ([afe6ae8](https://github.com/kulikman/Secret-project/commit/afe6ae809b2e4792dacd088a80d57ece04024573))

## [0.3.1](https://github.com/kulikman/Secret-project/compare/v0.3.0...v0.3.1) (2026-05-16)

### 🐛 Bug Fixes

* **deps:** bump next to 16.2.6 and override fast-uri for audit gate ([0e439e3](https://github.com/kulikman/Secret-project/commit/0e439e301a7dd331eba50961005a8e15ef2c7fac))

## [0.3.0](https://github.com/kulikman/Secret-project/compare/v0.2.0...v0.3.0) (2026-05-16)

### ✨ Features

* wire all stub features — auth onboarding, stripe plans, email, usage, cron, org ui ([14e1ddf](https://github.com/kulikman/Secret-project/commit/14e1ddffb0bc88da2b7a23ed40de26b52bb91441))

### 🐛 Bug Fixes

* **ci:** use github-hosted runners and fix settings link types ([c0403db](https://github.com/kulikman/Secret-project/commit/c0403dbe434edb24a28ac7cdf1b3f40248fdb984))

### 📝 Docs

* **docs:** add commit & push protocol to claude.md ([1eb7c0f](https://github.com/kulikman/Secret-project/commit/1eb7c0fb2104e808013e87390f55308952cf787a))

## [0.2.0](https://github.com/kulikman/Secret-project/compare/v0.1.0...v0.2.0) (2026-05-05)

### ✨ Features

* add analytics, onboarding, plan limits, notifications, API keys, CI/CD, and docs ([dc015f2](https://github.com/kulikman/Secret-project/commit/dc015f2010dcef025070dcf21dc57e69dd575246))

### 🐛 Bug Fixes

* **build:** avoid prerendering auth-gated settings ([c49b09b](https://github.com/kulikman/Secret-project/commit/c49b09b395b32dacef0c63551e25414d0c91cca1))
* **ci:** anchor release-please to current sha to avoid graphql timeout ([86d0f4f](https://github.com/kulikman/Secret-project/commit/86d0f4f8da4c9a6d9ac4f0592492d48ae7678d44))
* **ci:** commit missing devdeps and [@public](https://github.com/public) tags; fix release workflow pnpm version ([b136f88](https://github.com/kulikman/Secret-project/commit/b136f8864fab77d7cfc11c7f3a135436724aea4d))
* **ci:** upgrade release-please-action to v5 with manifest mode ([7461509](https://github.com/kulikman/Secret-project/commit/74615099769cf3efb73322a1c7ed23505526c870))
* **ci:** use pnpm exec instead of pnpm dlx for semantic-release ([1ff5e6b](https://github.com/kulikman/Secret-project/commit/1ff5e6b551211215204da8373d22dceb866811c5))
* resolve lint and ts errors from dc015f2 (imports, process.env, entities) ([91330e8](https://github.com/kulikman/Secret-project/commit/91330e8195233f60284067cb83dab2acae80acee))
* resolve remaining ts, knip, and lint errors after dc015f2 ([76a430d](https://github.com/kulikman/Secret-project/commit/76a430db836d6d5a5d25b69131e1ab31f677d782))

# Changelog

All notable changes to this project will be documented in this file.

This file is auto-generated by [semantic-release](https://github.com/semantic-release/semantic-release)
based on [Conventional Commits](https://www.conventionalcommits.org/).

<!-- semantic-release will prepend new entries above this line -->
