# Automated release setup

Qrive releases are driven by version tags. Pushing a tag such as `v0.1.2`
starts `.github/workflows/release.yml`, which:

1. verifies that the tag, `package.json`, and `manifest.json` versions match;
2. installs locked dependencies and runs the full check and dependency audit;
3. creates the reproducible extension ZIP and SHA-256 checksum;
4. creates or updates the matching GitHub Release; and
5. uploads and submits the package through Chrome Web Store API v2 when the
   Google Cloud repository variables below are configured.

If the Google Cloud variables are absent, the GitHub Release still succeeds and
the Chrome Web Store job is skipped.

## One-time Chrome Web Store setup

Use Workload Identity Federation rather than storing a service-account JSON key
or OAuth refresh token in GitHub.

1. Enable **Chrome Web Store API** in a Google Cloud project.
2. Create a dedicated Google Cloud service account.
3. In Chrome Web Store Developer Dashboard, open the publisher account settings
   and add that service-account email. Chrome Web Store currently permits one
   linked service account per publisher.
4. Configure a GitHub Workload Identity Pool and provider restricted to the
   `GGULBAE/Qrive` repository, then grant that identity permission to impersonate
   the service account.
5. In **GitHub repository settings → Secrets and variables → Actions →
   Variables**, add:

   - `GCP_WORKLOAD_IDENTITY_PROVIDER`: full provider resource name, for example
     `projects/123456789/locations/global/workloadIdentityPools/github/providers/qrive`
   - `GCP_SERVICE_ACCOUNT`: the linked service-account email
   - `CWS_PUBLISHER_ID`: the publisher ID shown under Chrome Web Store
     Developer Dashboard → Publisher → Settings

The public Qrive item ID is committed in the workflow. Authentication uses the
short-lived GitHub OIDC token and the `chromewebstore` OAuth scope.

Official setup references:

- <https://developer.chrome.com/docs/webstore/service-accounts>
- <https://developer.chrome.com/docs/webstore/using-api>
- <https://github.com/google-github-actions/auth#workload-identity-federation-through-a-service-account>

## Create a release

Choose a new version higher than the currently published version:

```bash
pnpm release:version 0.1.2
pnpm check
git add package.json manifest.json
git commit -m "chore: release v0.1.2"
git tag v0.1.2
git push origin master v0.1.2
```

Review and update the version-controlled store listing, privacy answers,
reviewer instructions, and submission record whenever a change affects them.
The API submits the package using the existing public visibility and automatic
publishing-after-approval settings. API submission does not bypass Chrome Web
Store review.
