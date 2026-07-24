# Qrive — QR Links for Google Drive

[![CI](https://github.com/GGULBAE/Qrive/actions/workflows/ci.yml/badge.svg)](https://github.com/GGULBAE/Qrive/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[Install Qrive from the Chrome Web Store](https://chromewebstore.google.com/detail/qrive-%E2%80%94-qr-links-for-goog/onpipenoogdnnebljkmengnkgilljelm)

Qrive is an open-source Chrome extension that adds a QR button beside the
existing shared indicator in Google Drive list rows. It creates the QR code
locally and never changes the item's sharing settings.

## What the MVP does

- Detects file and folder rows that Google Drive already marks as shared.
- Inserts one QR button beside the existing shared indicator.
- Shows a Shadow DOM-isolated popover with the item name, QR code, link copy,
  PNG download, and a reminder that existing Google Drive permissions still
  apply.
- Supports Korean and English labels, native button keyboard activation,
  focus return, focus containment, Escape, and outside-click dismissal.
- Rescans Google Drive's single-page application with `MutationObserver`.
  Repeated scans are idempotent, and a virtualized row's name and URL are read
  again before the popover opens.
- Refuses to render a QR code when the row does not expose a trusted link or a
  stable Drive item ID.

Qrive does not use OAuth, a backend, analytics, remote QR services, or remote
code.

## Install from the Chrome Web Store

Install [Qrive — QR Links for Google Drive][chrome-web-store] from the Chrome
Web Store, then open or reload Google Drive. Qrive appears only beside items
that Google Drive already marks as shared.

[chrome-web-store]: https://chromewebstore.google.com/detail/qrive-%E2%80%94-qr-links-for-goog/onpipenoogdnnebljkmengnkgilljelm

## Trust and permission model

The extension runs only on `https://drive.google.com/*` through its declared
content script. It requests no additional Chrome API permissions.
Chrome may still show a site-access warning because the content-script match
allows Qrive to read and update the Google Drive page DOM. Qrive's manifest
does not request access to other sites.

For a row that Google Drive marks as shared, Qrive prefers an existing HTTPS
URL for a Drive file/folder or Google Docs, Sheets, Slides, or Forms item. If no
URL exists, it may build `https://drive.google.com/open?id=...` only from an
explicit row-level `data-drive-id`, `data-item-id`, or `data-id` value that
matches a strict stable-ID format. Qrive does not infer an ID from arbitrary
text. If neither source is trustworthy, the popover explains the problem and
does not create, copy, or save a QR code.

Opening the QR destination is still governed by the item's current Google
Drive sharing policy. A recipient without access will continue to see
Google's access-request or sign-in flow. Qrive never reads or changes the
sharing policy.

## Development setup

Prerequisites:

- Node.js 20 or newer
- Corepack

The repository pins pnpm in `package.json` and commits `pnpm-lock.yaml`.

```powershell
corepack enable
corepack install
pnpm install --frozen-lockfile
pnpm check
```

Useful commands:

```powershell
pnpm dev          # rebuild TypeScript while files change
pnpm typecheck
pnpm lint
pnpm test
pnpm build        # create the unpacked extension in dist/
pnpm package      # create artifacts/qrive-v<version>.zip
pnpm store-assets # regenerate Chrome Web Store screenshots and promo images
```

The `dev` command watches TypeScript. Reload the extension from
`chrome://extensions` after each rebuild. Static manifest, locale, or icon
changes require restarting `pnpm dev` or running `pnpm build`.

## Load the unpacked extension

1. Run `pnpm build`.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Choose this repository's `dist` directory.
6. Open or reload a Google Drive list and look for Qrive's QR icon beside an
   existing shared icon.

For a non-destructive smoke test, use a file or folder that is already shared.
Open the Qrive popover, compare its copied URL with the row URL, scan the QR in
a separate browser profile, and confirm that Google Drive enforces the
pre-existing access policy. Do not change the sharing dialog during this test.

## Architecture

- `src/drive-dom.ts` contains shared-state detection, allowlisted link
  validation, item-name extraction, and row discovery.
- `src/row-controller.ts` owns idempotent button overlays and virtualized-row
  refresh behavior.
- `src/popover.ts` owns the local QR, copy/download actions, positioning, and
  focus behavior.
- `src/content-script.ts` batches SPA mutations into animation-frame scans.
- `tests/` uses DOM fixtures to cover shared-row detection, trusted link
  extraction, duplicate prevention, and row reuse.
- `scripts/` builds, creates icons, and produces a reproducibly ordered release
  archive.

Each injected button and the popover use an open Shadow Root for style
isolation and testability. Buttons are mounted outside Google Drive's managed
row subtree and positioned beside the shared indicator. This prevents Drive's
DOM reconciliation from repeatedly removing and recreating them. Qrive does
not monkey-patch Google Drive code.

## Known DOM dependency

Google Drive does not publish a stable extension API for its file-list DOM.
Qrive therefore depends on accessibility roles, shared-label text, item links,
and a small set of row data attributes currently exposed by the page. Google
can change any of these without notice.

The selectors and accepted English/Korean shared labels are intentionally
conservative. This reduces false QR codes but may cause Qrive to omit a button
after a Drive UI update. When that happens, capture a sanitized DOM fixture
with file names, IDs, and account information removed, add a regression test,
then update `src/drive-dom.ts`.

Qrive currently observes English `Shared`/`Shared with…` and Korean
`공유됨`/`공유된 항목`/`공유 사용자…` indicators. Other Drive UI languages are
not yet supported.

## Privacy

All QR rendering happens inside the browser with a bundled library. Item names
and URLs are used only in the current page to render the popover, copy the URL,
or create the requested PNG. Qrive has no network client, storage, telemetry,
advertising, OAuth flow, or backend. Google Drive itself continues to receive
normal browser requests when a user opens Drive or follows a link.

See the full [Privacy Policy](PRIVACY.md) for the data categories handled
locally, retention, sharing, site access, and Chrome Web Store Limited Use
statement.

## Contributing and security

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) and the
[Code of Conduct](CODE_OF_CONDUCT.md) before opening a pull request. Report
vulnerabilities privately according to [SECURITY.md](SECURITY.md); never post
real Drive links, item IDs, file names, or account data in a public issue.

## Release and Chrome Web Store deployment

1. Update the version in `package.json` and `manifest.json`.
2. Run `corepack install` and `pnpm install --frozen-lockfile`.
3. Run `pnpm check`.
4. Run `pnpm store-assets` and `pnpm package`.
5. Inspect the generated ZIP and load its uncompressed contents in a clean
   Chrome profile.
6. Upload the ZIP in the Chrome Web Store developer dashboard.
7. Complete the listing and privacy fields from the version-controlled
   [store submission kit](store/README.md), then submit for review.

No publishing credential belongs in this repository.

Qrive is an independent open-source project and is not affiliated with,
endorsed by, or sponsored by Google. Google Drive is a trademark of Google LLC.

## License

[MIT](LICENSE)
