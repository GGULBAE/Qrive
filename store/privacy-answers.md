# Chrome Web Store privacy answers

These answers describe Qrive version 0.1.1. Recheck them against the current
code and dashboard wording before every submission.

## Single purpose

Add a local QR-code action to Google Drive items already marked as shared,
without changing their sharing permissions.

## Permission and site-access justification

Qrive declares no Chrome API permissions. Its content script runs only on
`https://drive.google.com/*` so it can detect visible list rows that Google
Drive marks as shared, read the displayed item name and trusted Drive link,
and render the QR button and popover. This access is required for the
extension's only feature and is not used on any other site.

## Remote code

**No.** Qrive does not use remote code. Its JavaScript and QR library are
bundled in the submitted extension package.

## Data types handled

The Chrome Web Store policy treats local page processing as data handling.
Disclose the following category in the dashboard:

- **Website content:** displayed Drive file or folder names, sharing
  indicators, links, and stable item identifiers needed for the QR action.

Do not select personally identifiable information, health information,
financial and payment information, authentication information, personal
communications, location, web history, or user activity: Qrive does not handle
those data types. The current Drive item URL is a hyperlink in the visible
page, so it is disclosed as website content rather than web history. Qrive
does not read browser history or the contents of Drive files.

Keep every disclosure consistent with the live dashboard definitions,
`PRIVACY.md`, and the submitted extension behavior.

## Data-use certifications

Certify all statements that match the current dashboard wording:

- Data is used only to provide Qrive's single, user-facing purpose.
- Data is not sold to third parties.
- Data is not used or transferred for purposes unrelated to the single
  purpose.
- Data is not used or transferred for creditworthiness or lending.
- Data is not used or transferred for personalized advertising.
- Humans are not allowed to read the data.

Qrive does not transmit or retain this data. Clipboard contents and downloaded
PNG files are created only at the user's request and remain under the user's
control.

## Privacy policy URL

https://github.com/GGULBAE/Qrive/blob/master/PRIVACY.md
