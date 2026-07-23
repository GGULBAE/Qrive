# Qrive 0.1.0 publishing checklist

## Repository and release

- [ ] `package.json` and `manifest.json` both contain version `0.1.0`.
- [ ] `pnpm install --frozen-lockfile` succeeds with the pinned pnpm version.
- [ ] `pnpm check` and `pnpm audit --audit-level high` pass.
- [ ] `pnpm store-assets` regenerates the committed store images.
- [ ] `pnpm package` creates `artifacts/qrive-v0.1.0.zip`.
- [ ] The package contains only the manifest, bundled content script, icons,
      and locales.
- [ ] The unpacked package passes a clean-profile smoke test on Google Drive.
- [ ] Commit and push the release source, then create and push tag `v0.1.0`.

## Developer account

- [ ] Register the Chrome Web Store developer account and pay Google's
      one-time registration fee.
- [ ] Enable two-step verification on the publisher account.
- [ ] Confirm the publisher display name and verified contact email.
- [ ] Complete any trader/non-trader declaration presented by the dashboard.

## Store listing

- [ ] Upload `artifacts/qrive-v0.1.0.zip`.
- [ ] Use `listing-en.md` for the default English listing.
- [ ] Add the Korean localization from `listing-ko.md`.
- [ ] Select the Productivity category.
- [ ] Upload `assets/icons/icon-128.png` as the store icon.
- [ ] Upload the 1280×800 screenshots from `store/assets/`.
- [ ] Upload `store/assets/small-promo-440x280.png`.
- [ ] Upload `store/assets/marquee-1400x560.png` if the field is available.
- [ ] Set the homepage and support URLs from the listing files.

## Privacy and review

- [ ] Enter the single-purpose, site-access, remote-code, and data-use answers
      from `privacy-answers.md`.
- [ ] Set the privacy policy URL to
      `https://github.com/GGULBAE/Qrive/blob/master/PRIVACY.md`.
- [ ] Paste `test-instructions.md` into the reviewer instructions.
- [ ] Choose public or unlisted visibility and distribution regions.
- [ ] Choose automatic or deferred publishing after review.
- [ ] Preview every localized listing and verify the screenshots contain no
      real account or file data.
- [ ] Submit for review only after the publisher confirms the final listing,
      distribution, and legal declarations.
