# Contributing to Qrive

Thanks for helping make Qrive safer and more reliable.

## Before opening a change

- Search existing issues before creating a new one.
- Do not include real file names, item IDs, account details, or sharing links in
  bug reports or fixtures.
- Use a narrowly scoped issue for Google Drive DOM changes. A sanitized DOM
  fixture and a failing regression test are especially useful.
- Report security issues privately as described in [SECURITY.md](SECURITY.md).

## Local development

Qrive requires Node.js 20 or newer and Corepack. The repository pins pnpm and
commits its lockfile.

```powershell
corepack enable
corepack install
pnpm install --frozen-lockfile
pnpm check
```

Use `pnpm dev` while developing, then reload the unpacked extension from
`chrome://extensions`. See [README.md](README.md) for the full test and manual
verification procedure.

## Pull requests

1. Keep the change focused and preserve Qrive's single purpose.
2. Add or update DOM fixture tests for detection and lifecycle changes.
3. Keep all QR generation local and avoid new permissions unless they are
   strictly necessary.
4. Update documentation and privacy disclosures when behavior changes.
5. Run `pnpm check` before opening the pull request.

By contributing, you agree that your contribution is licensed under the
project's [MIT License](LICENSE).
