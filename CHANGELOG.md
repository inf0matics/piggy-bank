# Changelog


## v1.6.4

[compare changes](https://github.com/inf0matics/piggy-bank/compare/v1.6.3...v1.6.4)

### 🩹 Fixes

- **dashboard:** Don't poll (and toast "Error") when session expired ([0f71086](https://github.com/inf0matics/piggy-bank/commit/0f71086))

### 💅 Refactors

- Remove Bitcoin onchain & ElectrumX support ([276f4dd](https://github.com/inf0matics/piggy-bank/commit/276f4dd))

### ❤️ Contributors

- Inf0matics <fil@thespielplatz.com>

## v1.6.3

[compare changes](https://github.com/inf0matics/piggy-bank/compare/v1.6.2...v1.6.3)

### 🏡 Chore

- **e2e:** Add Playwright test setup and MCP server ([4904b5c](https://github.com/inf0matics/piggy-bank/commit/4904b5c))
- Update Node to 24 LTS ([c501c07](https://github.com/inf0matics/piggy-bank/commit/c501c07))

### ✅ Tests

- **e2e:** Add Docker-based test environment with LNBits mock ([e074871](https://github.com/inf0matics/piggy-bank/commit/e074871))
- **e2e:** Mock the Kraken rate for hermetic tests ([5e290e2](https://github.com/inf0matics/piggy-bank/commit/5e290e2))
- **e2e:** Run the app on a dedicated port to avoid dev-server collision ([52e6507](https://github.com/inf0matics/piggy-bank/commit/52e6507))
- **e2e:** Prune dangling images in teardown ([3f95eec](https://github.com/inf0matics/piggy-bank/commit/3f95eec))
- **e2e:** Cover Lightning auth, dashboard, deposit and print flows ([8bb0fd4](https://github.com/inf0matics/piggy-bank/commit/8bb0fd4))

### 🤖 CI

- **e2e:** Run Playwright e2e tests on push and PR to main ([62701a7](https://github.com/inf0matics/piggy-bank/commit/62701a7))
- **e2e:** Bump actions to v5 for Node 24 runtime ([5cb4688](https://github.com/inf0matics/piggy-bank/commit/5cb4688))

### ❤️ Contributors

- Inf0matics <fil@thespielplatz.com>

## v1.6.2

[compare changes](https://github.com/thespielplatz/piggy-bank/compare/v1.6.1...v1.6.2)

### 🩹 Fixes

- Always install git into the build stage ([9c5f2a9](https://github.com/thespielplatz/piggy-bank/commit/9c5f2a9))

### ❤️ Contributors

- Thespielplatz <informatics@gmx.net>

## v1.6.1

[compare changes](https://github.com/thespielplatz/piggy-bank/compare/v1.6.0...v1.6.1)

### 🩹 Fixes

- Update node version according to requirements of Nuxt/Vite/OXC ([b3c22e4](https://github.com/thespielplatz/piggy-bank/commit/b3c22e4))

### ❤️ Contributors

- Thespielplatz <informatics@gmx.net>

## v1.6.0

[compare changes](https://github.com/thespielplatz/piggy-bank/compare/v1.5.1...v1.6.0)

### 🚀 Enhancements

- Update to nuxt 4 ([cadb80b](https://github.com/thespielplatz/piggy-bank/commit/cadb80b))

### 🩹 Fixes

- Style and typescript ([37bb776](https://github.com/thespielplatz/piggy-bank/commit/37bb776))
- Split lnurlp and lnurl-address into seperate checks ([0274b14](https://github.com/thespielplatz/piggy-bank/commit/0274b14))

### 🏡 Chore

- Npm audit fix ([a7083a3](https://github.com/thespielplatz/piggy-bank/commit/a7083a3))

### ❤️ Contributors

- Thespielplatz <informatics@gmx.net>

## v1.5.1

[compare changes](https://github.com/thespielplatz/piggy-bank/compare/v1.5.0...v1.5.1)

### 🩹 Fixes

- Update to lnbits api 1.2.1 ([df91ce4](https://github.com/thespielplatz/piggy-bank/commit/df91ce4))

### 🏡 Chore

- Npm audit fix ([7775eab](https://github.com/thespielplatz/piggy-bank/commit/7775eab))

### ❤️ Contributors

- Thespielplatz <informatics@gmx.net>

## v1.5.0

[compare changes](https://github.com/thespielplatz/piggy-bank/compare/v1.4.0...v1.5.0)

### 🚀 Enhancements

- Add keyboard input for index ([5c3aba7](https://github.com/thespielplatz/piggy-bank/commit/5c3aba7))
- Add char to number convertion for  keyboard input ([ff833bf](https://github.com/thespielplatz/piggy-bank/commit/ff833bf))

### ❤️ Contributors

- Thespielplatz <informatics@gmx.net>

## v1.4.0

[compare changes](https://github.com/thespielplatz/piggy-bank/compare/v1.3.8...v1.4.0)

### 🚀 Enhancements

- Add copy 2 clipboard for deposit options ([e66db15](https://github.com/thespielplatz/piggy-bank/commit/e66db15))

### ❤️ Contributors

- Thespielplatz <informatics@gmx.net>

## v1.3.8

[compare changes](https://github.com/thespielplatz/piggy-bank/compare/v1.3.7...v1.3.8)

### 🩹 Fixes

- Use doger blue ([8b9edf5](https://github.com/thespielplatz/piggy-bank/commit/8b9edf5))

### 🏡 Chore

- Remove tailwind bugfix ([519ebb6](https://github.com/thespielplatz/piggy-bank/commit/519ebb6))
- Remove tailwind bugfix" ([aa5c1db](https://github.com/thespielplatz/piggy-bank/commit/aa5c1db))
- Npm audit fix and updates ([98b970f](https://github.com/thespielplatz/piggy-bank/commit/98b970f))
- Add padding to qr codes ([75346d6](https://github.com/thespielplatz/piggy-bank/commit/75346d6))

### ❤️ Contributors

- Thespielplatz <informatics@gmx.net>

## v1.3.7

[compare changes](https://github.com/thespielplatz/piggy-bank/compare/v1.3.6...v1.3.7)

### 🩹 Fixes

- Show electrumx server error only on onchain ([746c3dd](https://github.com/thespielplatz/piggy-bank/commit/746c3dd))
- Temporary fix of nuxtui bug ([5d9de24](https://github.com/thespielplatz/piggy-bank/commit/5d9de24))

### 🏡 Chore

- Update eslint-config package ([c9f47aa](https://github.com/thespielplatz/piggy-bank/commit/c9f47aa))

### ❤️ Contributors

- Thespielplatz <informatics@gmx.net>

## v1.3.6

[compare changes](https://github.com/thespielplatz/piggy-bank/compare/v1.3.5...v1.3.6)

### 🩹 Fixes

- If sats are 0, show value piggy bank value ([75bf8aa](https://github.com/thespielplatz/piggy-bank/commit/75bf8aa))

### 🏡 Chore

- Show error on lnbits key error ([02b3913](https://github.com/thespielplatz/piggy-bank/commit/02b3913))
- Skip electrumx sync if no servers ([1860bc1](https://github.com/thespielplatz/piggy-bank/commit/1860bc1))
- Show no electrumx servers error, if onchain addresses are configured ([5a12e40](https://github.com/thespielplatz/piggy-bank/commit/5a12e40))
- Npm audit fix ([7ca446f](https://github.com/thespielplatz/piggy-bank/commit/7ca446f))
- Switch to @nuxt/eslint ([daa0428](https://github.com/thespielplatz/piggy-bank/commit/daa0428))

### ❤️ Contributors

- Thespielplatz <informatics@gmx.net>

## v1.3.5

[compare changes](https://github.com/thespielplatz/piggy-bank/compare/v1.3.4...v1.3.5)

### 🩹 Fixes

- **dashboard:** Font weight in title ([f232380](https://github.com/thespielplatz/piggy-bank/commit/f232380))

### ❤️ Contributors

- Thespielplatz <informatics@gmx.net>

## v1.3.4

[compare changes](https://github.com/thespielplatz/piggy-bank/compare/v1.3.3...v1.3.4)

### 🩹 Fixes

- **ci:** Install git also for git repos in package-lock.json ([00f7e82](https://github.com/thespielplatz/piggy-bank/commit/00f7e82))

### ❤️ Contributors

- Thespielplatz <informatics@gmx.net>

## v1.3.3

[compare changes](https://github.com/thespielplatz/piggy-bank/compare/v1.3.2...v1.3.3)

### 🩹 Fixes

- **ci:** Install git also for git repos in package-lock.json ([e72e6c4](https://github.com/thespielplatz/piggy-bank/commit/e72e6c4))

### ❤️ Contributors

- Thespielplatz <informatics@gmx.net>

## v1.3.2

[compare changes](https://github.com/thespielplatz/piggy-bank/compare/v1.3.1...v1.3.2)

### 🩹 Fixes

- Add primary color doger blue ([64faa6f](https://github.com/thespielplatz/piggy-bank/commit/64faa6f))
- InfoBox update to nuxtui 3.x ([6c2451e](https://github.com/thespielplatz/piggy-bank/commit/6c2451e))
- Toast colors ([8ceb70c](https://github.com/thespielplatz/piggy-bank/commit/8ceb70c))

### 📖 Documentation

- Add onchain feat documentation ([caf0b08](https://github.com/thespielplatz/piggy-bank/commit/caf0b08))

### 🏡 Chore

- Update to newer nuxt-dev-base & nuxtui 3.x ([586f152](https://github.com/thespielplatz/piggy-bank/commit/586f152))

### 🤖 CI

- Update Dockerfile to newest version ([4b2b782](https://github.com/thespielplatz/piggy-bank/commit/4b2b782))

### ❤️ Contributors

- Thespielplatz <informatics@gmx.net>

## v1.3.1

[compare changes](https://github.com/thespielplatz/piggy-bank/compare/v1.3.0...v1.3.1)

### 🏡 Chore

- Npm audit fix ([9bc4b42](https://github.com/thespielplatz/piggy-bank/commit/9bc4b42))

### 🤖 CI

- Install git in Dockerfile for package ([4d9c602](https://github.com/thespielplatz/piggy-bank/commit/4d9c602))

### ❤️ Contributors

- Thespielplatz <informatics@gmx.net>

## v1.3.0

[compare changes](https://github.com/thespielplatz/piggy-bank/compare/v1.2.12...v1.3.0)

### 🚀 Enhancements

- Add BlockchainData Sync class incl. Task ([09ea24c](https://github.com/thespielplatz/piggy-bank/commit/09ea24c))
- Add onchain sync of user addresses to onchain-sync task ([d4fae8e](https://github.com/thespielplatz/piggy-bank/commit/d4fae8e))
- **ElectrumClient:** Add connection events ([73edab8](https://github.com/thespielplatz/piggy-bank/commit/73edab8))
- **ElectrumConnectionHandler:** Add autoreconnect with interval ([70bc36a](https://github.com/thespielplatz/piggy-bank/commit/70bc36a))
- **BlockChainSync:** Add rotating server list for electrum client in connection handler ([0a9cc02](https://github.com/thespielplatz/piggy-bank/commit/0a9cc02))
- **Dashboard:** Show onchain ([8136a47](https://github.com/thespielplatz/piggy-bank/commit/8136a47))

### 🩹 Fixes

- Add default export to electrum-client-js type ([fadbf08](https://github.com/thespielplatz/piggy-bank/commit/fadbf08))
- **ElectrumConnectionHandler:** Bind with this ([e62b001](https://github.com/thespielplatz/piggy-bank/commit/e62b001))
- Add deleted PiggyQRCode Template ([17880f9](https://github.com/thespielplatz/piggy-bank/commit/17880f9))

### 💅 Refactors

- Colapse lines ([81e4241](https://github.com/thespielplatz/piggy-bank/commit/81e4241))
- Move getScriptHash to own file ([8056442](https://github.com/thespielplatz/piggy-bank/commit/8056442))
- **blockchain sync:** From task to electrumx server subscribe ([15a1294](https://github.com/thespielplatz/piggy-bank/commit/15a1294))
- **ElectrumClient:** Renaming, move ServerVersion to ElectrumClient ([9dfb731](https://github.com/thespielplatz/piggy-bank/commit/9dfb731))
- Add ElectrumConnectionHandler for permanent connection ([26e9621](https://github.com/thespielplatz/piggy-bank/commit/26e9621))
- **ElectrumConnectionHandler:** Add connect error handling & remove protocoll version negotiation ([3c4fcc9](https://github.com/thespielplatz/piggy-bank/commit/3c4fcc9))
- **useBlockchainData:** Move BlockchainData ot utils functions ([ef10036](https://github.com/thespielplatz/piggy-bank/commit/ef10036))

### 📖 Documentation

- Update roadmap ([4727897](https://github.com/thespielplatz/piggy-bank/commit/4727897))

### 🏡 Chore

- Update tsp nuxt modules ([7e39f25](https://github.com/thespielplatz/piggy-bank/commit/7e39f25))
- Add electrumX server to config.json ([da8d244](https://github.com/thespielplatz/piggy-bank/commit/da8d244))
- Remove dirs from lintconfig ([23740a4](https://github.com/thespielplatz/piggy-bank/commit/23740a4))
- Async call in sync plugin code ([fa5934a](https://github.com/thespielplatz/piggy-bank/commit/fa5934a))
- Replace electrum client library ([ba8586b](https://github.com/thespielplatz/piggy-bank/commit/ba8586b))
- **task: OnChainSync:** Change consola style from info to start and success ([e0cb517](https://github.com/thespielplatz/piggy-bank/commit/e0cb517))
- Type BLOCKCHAIN.SCRIPTHASH.GET_BALANCE ([a33981c](https://github.com/thespielplatz/piggy-bank/commit/a33981c))
- Update nuxt-dev-base to 1.1.0 ([a1b77cb](https://github.com/thespielplatz/piggy-bank/commit/a1b77cb))
- Add subscribe ([165276e](https://github.com/thespielplatz/piggy-bank/commit/165276e))
- Extend ElectrumClient with better keepAlive method ([90e8d9f](https://github.com/thespielplatz/piggy-bank/commit/90e8d9f))
- **ElectrumClient:** Add removeAllListeners to prevent memory leaks ([849a3ac](https://github.com/thespielplatz/piggy-bank/commit/849a3ac))
- **ElectrumConnectionHandler:** Subscribe to onEnd event of ElectrumClient ([ea2f2e5](https://github.com/thespielplatz/piggy-bank/commit/ea2f2e5))
- **ElectrumClient:** Stop keepalive on end, close or error ([4c61709](https://github.com/thespielplatz/piggy-bank/commit/4c61709))
- Turn off onchain data sync if not onchain data is configured ([349fdb8](https://github.com/thespielplatz/piggy-bank/commit/349fdb8))
- Remove unused import ([47a18ed](https://github.com/thespielplatz/piggy-bank/commit/47a18ed))
- Eslint fix ([30452e7](https://github.com/thespielplatz/piggy-bank/commit/30452e7))

### ❤️ Contributors

- Thespielplatz <informatics@gmx.net>

## v1.2.12

[compare changes](https://github.com/thespielplatz/piggy-bank/compare/v1.2.11...v1.2.12)

### 💅 Refactors

- **dashboard/api:** Move lnbits functions to a class ([c906de8](https://github.com/thespielplatz/piggy-bank/commit/c906de8))

### 📖 Documentation

- Update readme ([c3cc09d](https://github.com/thespielplatz/piggy-bank/commit/c3cc09d))

### ❤️ Contributors

- Thespielplatz <informatics@gmx.net>

## v1.2.11

[compare changes](https://github.com/thespielplatz/piggy-bank/compare/v1.2.10...v1.2.11)

### 🩹 Fixes

- **InputBox:** Ts type ([e116fcb](https://github.com/thespielplatz/piggy-bank/commit/e116fcb))

### 💅 Refactors

- **Dashboard:** Move functionality to InfoBox and PiggyValue components ([a48fff5](https://github.com/thespielplatz/piggy-bank/commit/a48fff5))

### 🏡 Chore

- **Dashboard:** Move address and lnurl to popup with tab ([484595c](https://github.com/thespielplatz/piggy-bank/commit/484595c))

### ❤️ Contributors

- Thespielplatz <informatics@gmx.net>

## v1.2.10

[compare changes](https://github.com/thespielplatz/piggy-bank/compare/v1.2.9...v1.2.10)

### 🏡 Chore

- Update of nuxt-dev-base ([e168a22](https://github.com/thespielplatz/piggy-bank/commit/e168a22))

### ❤️ Contributors

- Thespielplatz <informatics@gmx.net>

## v1.2.9

[compare changes](https://github.com/thespielplatz/piggy-bank/compare/v1.2.8...v1.2.9)

### 🏡 Chore

- Update of nuxt-dev-base ([fc5960e](https://github.com/thespielplatz/piggy-bank/commit/fc5960e))

### ❤️ Contributors

- Thespielplatz <informatics@gmx.net>

## v1.2.8

[compare changes](https://github.com/thespielplatz/piggy-bank/compare/v1.2.7...v1.2.8)

### 🏡 Chore

- Move nuxt modules to dependencies section ([d7c5315](https://github.com/thespielplatz/piggy-bank/commit/d7c5315))

### ❤️ Contributors

- Thespielplatz <informatics@gmx.net>

## v1.2.7

[compare changes](https://github.com/thespielplatz/piggy-bank/compare/v1.2.6...v1.2.7)

### 🏡 Chore

- Update of nuxt-dev-base ([4853bcd](https://github.com/thespielplatz/piggy-bank/commit/4853bcd))

### ❤️ Contributors

- Thespielplatz <informatics@gmx.net>

## v1.2.6

[compare changes](https://github.com/thespielplatz/piggy-bank/compare/v1.2.5...v1.2.6)

### 💅 Refactors

- Use nuxt-dev-base i/o of local components ([8cc2212](https://github.com/thespielplatz/piggy-bank/commit/8cc2212))

### 🏡 Chore

- Npm audit fix ([28570cc](https://github.com/thespielplatz/piggy-bank/commit/28570cc))

### ❤️ Contributors

- Thespielplatz <informatics@gmx.net>

## v1.2.5

[compare changes](https://github.com/thespielplatz/piggy-bank/compare/v1.2.4...v1.2.5)

### 🏡 Chore

- Change logo from lightning to bitcoin ([d24fea0](https://github.com/thespielplatz/piggy-bank/commit/d24fea0))
- Lint fix ([8328634](https://github.com/thespielplatz/piggy-bank/commit/8328634))

### ❤️ Contributors

- Thespielplatz <informatics@gmx.net>

## v1.2.4

[compare changes](https://github.com/thespielplatz/piggy-bank/compare/v1.2.3...v1.2.4)

### 🩹 Fixes

- Move piggy.png to public folder ([f2bea05](https://github.com/thespielplatz/piggy-bank/commit/f2bea05))
- Turn off experimental feature of appManifest ([2c13067](https://github.com/thespielplatz/piggy-bank/commit/2c13067))

### ❤️ Contributors

- Thespielplatz <informatics@gmx.net>

## v1.2.3

[compare changes](https://github.com/thespielplatz/piggy-bank/compare/v1.2.2...v1.2.3)

### 🩹 Fixes

- **print:** Invert QR Code colors ([17e2d12](https://github.com/thespielplatz/piggy-bank/commit/17e2d12))

### ❤️ Contributors

- Thespielplatz <informatics@gmx.net>

## v1.2.2

[compare changes](https://github.com/thespielplatz/piggy-bank/compare/v1.2.1...v1.2.2)

### 🩹 Fixes

- Remove " from html ([7bc7a34](https://github.com/thespielplatz/piggy-bank/commit/7bc7a34))

### ❤️ Contributors

- Thespielplatz <informatics@gmx.net>

## v1.2.1

[compare changes](https://github.com/thespielplatz/piggy-bank/compare/v1.2.0...v1.2.1)

### 🩹 Fixes

- **print:** Change print: to flex and refactor classes to dashboard ([ae8609c](https://github.com/thespielplatz/piggy-bank/commit/ae8609c))

### ❤️ Contributors

- Thespielplatz <informatics@gmx.net>

## v1.2.0

[compare changes](https://github.com/thespielplatz/piggy-bank/compare/v1.1.3...v1.2.0)

### 🚀 Enhancements

- **dashboard:** Add print layout incl. QR Code for give away ([8fa6b81](https://github.com/thespielplatz/piggy-bank/commit/8fa6b81))

### 📖 Documentation

- **print:** Add print feature description ([6e69ce6](https://github.com/thespielplatz/piggy-bank/commit/6e69ce6))

### 🏡 Chore

- **lint:** Add v-html exception for qr code div ([569c2e1](https://github.com/thespielplatz/piggy-bank/commit/569c2e1))

### ❤️ Contributors

- Thespielplatz <informatics@gmx.net>

## v1.1.3

[compare changes](https://github.com/thespielplatz/piggy-bank/compare/v1.1.2...v1.1.3)

### 📖 Documentation

- Add screenshots ([aec597b](https://github.com/thespielplatz/piggy-bank/commit/aec597b))

### 🤖 CI

- Change docker build from tag push to release ([e06bb35](https://github.com/thespielplatz/piggy-bank/commit/e06bb35))
- Change script name to bump-version ([ed657c7](https://github.com/thespielplatz/piggy-bank/commit/ed657c7))

### ❤️ Contributors

- Thespielplatz <informatics@gmx.net>

## v1.1.2

[compare changes](https://github.com/thespielplatz/piggy-bank/compare/v1.1.1...v1.1.2)

### 🩹 Fixes

- Only stop polling on the first time the piggy banke is opened ([d03bbca](https://github.com/thespielplatz/piggy-bank/commit/d03bbca))

### 💅 Refactors

- Change polling interval to 2sec ([1c7215d](https://github.com/thespielplatz/piggy-bank/commit/1c7215d))

### 📖 Documentation

- Update readme ([b7a72e1](https://github.com/thespielplatz/piggy-bank/commit/b7a72e1))

### 🏡 Chore

- Add lightning symbol to header ([c733496](https://github.com/thespielplatz/piggy-bank/commit/c733496))
- Update piggy layout ([4c8eeaa](https://github.com/thespielplatz/piggy-bank/commit/4c8eeaa))
- Lint ([42e70db](https://github.com/thespielplatz/piggy-bank/commit/42e70db))

### ❤️ Contributors

- Thespielplatz <informatics@gmx.net>

## v1.1.1

[compare changes](https://github.com/thespielplatz/piggy-bank/compare/v1.1.0...v1.1.1)

### 🩹 Fixes

- Button colors ([d6203b5](https://github.com/thespielplatz/piggy-bank/commit/d6203b5))

### 💅 Refactors

- Change error according to nuxt server docs ([10dc5dd](https://github.com/thespielplatz/piggy-bank/commit/10dc5dd))
- Rename imprint to legal notice ([34095cd](https://github.com/thespielplatz/piggy-bank/commit/34095cd))

### ❤️ Contributors

- Thespielplatz <informatics@gmx.net>

## v1.1.0

[compare changes](https://github.com/thespielplatz/piggy-bank/compare/v1.0.0...v1.1.0)

### 🚀 Enhancements

- Add optional imprint ([121dfd1](https://github.com/thespielplatz/piggy-bank/commit/121dfd1))

### 🏡 Chore

- Lint ([2dab34d](https://github.com/thespielplatz/piggy-bank/commit/2dab34d))

### ❤️ Contributors

- Thespielplatz <informatics@gmx.net>

## v0.0.5

[compare changes](https://github.com/thespielplatz/piggy-bank/compare/v0.0.4...v0.0.5)

### 🚀 Enhancements

- Close popup on sats recieved ([2c2499b](https://github.com/thespielplatz/piggy-bank/commit/2c2499b))
- Add notifcation on sats recieved ([aa2dfd3](https://github.com/thespielplatz/piggy-bank/commit/aa2dfd3))

### 🩹 Fixes

- Empty lnurlps ([45e5653](https://github.com/thespielplatz/piggy-bank/commit/45e5653))

### 📦 Build

- Lint no warnings ([423f660](https://github.com/thespielplatz/piggy-bank/commit/423f660))
- Add dockerfile ([6a765ae](https://github.com/thespielplatz/piggy-bank/commit/6a765ae))

### 🏡 Chore

- Lint ([0c1a8d5](https://github.com/thespielplatz/piggy-bank/commit/0c1a8d5))
- Add api in display ([1ebb203](https://github.com/thespielplatz/piggy-bank/commit/1ebb203))
- Lint ([c87ea5d](https://github.com/thespielplatz/piggy-bank/commit/c87ea5d))

### ❤️ Contributors

- Thespielplatz <informatics@gmx.net>

## v0.0.4

[compare changes](https://github.com/thespielplatz/piggy-bank/compare/v0.0.3...v0.0.4)

### 🚀 Enhancements

- Add github and release into footer ([79d63d8](https://github.com/thespielplatz/piggy-bank/commit/79d63d8))

### 🩹 Fixes

- Adjust mobile layout ([1084bd5](https://github.com/thespielplatz/piggy-bank/commit/1084bd5))

### 📦 Build

- Add github pipeline file ([85e4b53](https://github.com/thespielplatz/piggy-bank/commit/85e4b53))

### 🏡 Chore

- Add lightning logo to headline ([241898b](https://github.com/thespielplatz/piggy-bank/commit/241898b))

### ❤️ Contributors

- Thespielplatz <informatics@gmx.net>

## v0.0.3

[compare changes](https://github.com/thespielplatz/piggy-bank/compare/v0.0.2...v0.0.3)

### 🚀 Enhancements

- Add name to piggy bank ([157dcfb](https://github.com/thespielplatz/piggy-bank/commit/157dcfb))
- Add lnurlp / lnaddress ([cb67906](https://github.com/thespielplatz/piggy-bank/commit/cb67906))
- Display eur rate and eur value ([abd2bb3](https://github.com/thespielplatz/piggy-bank/commit/abd2bb3))
- Show lnurlp popup ([3e59c18](https://github.com/thespielplatz/piggy-bank/commit/3e59c18))
- Show address ([eefaad8](https://github.com/thespielplatz/piggy-bank/commit/eefaad8))
- Add 5 sec polling ([1e5957e](https://github.com/thespielplatz/piggy-bank/commit/1e5957e))
- Add last payment, incl. comment ([0fd6568](https://github.com/thespielplatz/piggy-bank/commit/0fd6568))

### 📖 Documentation

- Add config.json example ([5efe2fb](https://github.com/thespielplatz/piggy-bank/commit/5efe2fb))
- Update features ([b5d2798](https://github.com/thespielplatz/piggy-bank/commit/b5d2798))

### 🏡 Chore

- Change name in example ([6c4b703](https://github.com/thespielplatz/piggy-bank/commit/6c4b703))
- Change numbers font to tektur ([471e79a](https://github.com/thespielplatz/piggy-bank/commit/471e79a))
- Eslint ([d60f4d6](https://github.com/thespielplatz/piggy-bank/commit/d60f4d6))

### ❤️ Contributors

- Thespielplatz <informatics@gmx.net>

## v0.0.2


### 🚀 Enhancements

- Keypad display ([fad10d3](https://github.com/thespielplatz/piggy-bank/commit/fad10d3))
- Add dashboard/piggy ([9097dba](https://github.com/thespielplatz/piggy-bank/commit/9097dba))
- Load data from lnbits ([89f5aa4](https://github.com/thespielplatz/piggy-bank/commit/89f5aa4))

### 📖 Documentation

- Add headline to licence ([18fa4b3](https://github.com/thespielplatz/piggy-bank/commit/18fa4b3))
- Add roadmap and features ([70470fa](https://github.com/thespielplatz/piggy-bank/commit/70470fa))

### 📦 Build

- Add bump patch npm scripts ([3fbbcc9](https://github.com/thespielplatz/piggy-bank/commit/3fbbcc9))

### 🏡 Chore

- Inital commit & nuxt init ([afa765b](https://github.com/thespielplatz/piggy-bank/commit/afa765b))
- Add index page ([a984e94](https://github.com/thespielplatz/piggy-bank/commit/a984e94))
- Add colors and font ([3fcf758](https://github.com/thespielplatz/piggy-bank/commit/3fcf758))
- Setup auth, config and dev user ([7dcc5e2](https://github.com/thespielplatz/piggy-bank/commit/7dcc5e2))
- Use users from config ([0a09679](https://github.com/thespielplatz/piggy-bank/commit/0a09679))
- Adjust layout for mobile ([3557b22](https://github.com/thespielplatz/piggy-bank/commit/3557b22))
- Prevent zoom and draging ([2f9fabd](https://github.com/thespielplatz/piggy-bank/commit/2f9fabd))
- Disable del and enter if code is empty ([6e68c3b](https://github.com/thespielplatz/piggy-bank/commit/6e68c3b))
- Add eslint ([f9d596c](https://github.com/thespielplatz/piggy-bank/commit/f9d596c))
- Eslint fixes ([e246ea4](https://github.com/thespielplatz/piggy-bank/commit/e246ea4))
- Adjust piggy and layout ([fa96536](https://github.com/thespielplatz/piggy-bank/commit/fa96536))
- Eslint ([78e59d4](https://github.com/thespielplatz/piggy-bank/commit/78e59d4))
- Add changelogen ([2590043](https://github.com/thespielplatz/piggy-bank/commit/2590043))

### 🎨 Styles

- Change default color ([26e5868](https://github.com/thespielplatz/piggy-bank/commit/26e5868))

### ❤️ Contributors

- Thespielplatz <informatics@gmx.net>

