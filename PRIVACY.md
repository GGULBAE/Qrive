# Qrive Privacy Policy

Effective date: July 23, 2026

Qrive is an open-source Chrome extension that creates QR codes for files and
folders that Google Drive already marks as shared. All Qrive processing happens
locally in the user's browser.

## Data Qrive handles

To provide its single purpose, Qrive reads only the following information from
the currently visible Google Drive page:

- the displayed file or folder name;
- whether Google Drive marks the item as shared; and
- an existing Google Drive item link or, when available, a stable item
  identifier exposed by the row.

This information can be user data under the Chrome Web Store User Data Policy
even though Qrive processes it only on the user's device.

## How the data is used

Qrive uses the information solely to:

- decide whether to show its QR button;
- create the requested QR code locally;
- display the item name and link in the Qrive popover;
- copy the link when the user selects **Copy link**; and
- create a PNG file when the user selects **Save PNG**.

Qrive does not inspect file contents, change Google Drive sharing settings, or
grant access to an item. Google Drive's existing sharing permissions continue
to control who can open the link.

## Collection, transmission, sharing, and retention

Qrive does not send the information it handles to the developer or to any
third party. It has no backend, analytics, advertising, telemetry, OAuth flow,
remote QR service, or remote code.

Qrive does not persist Google Drive item information. The generated QR and its
source values exist only as needed in the current page. A copied link remains
in the user's system clipboard according to the operating system's behavior,
and a saved PNG remains wherever the user chooses to store it. Qrive does not
control or receive either artifact.

Qrive does not sell user data, use it for advertising or credit decisions, or
permit humans to read it. No user data is transferred to another party.

## Site access and security

Qrive runs only on `https://drive.google.com/*`. This site access is necessary
to detect shared rows, read the item name and trusted link, and render the QR
button and popover. The extension requests no additional Chrome API
permissions.

Qrive validates candidate links against an allowlist of HTTPS Google Drive and
Google editor hosts. If it cannot find a trusted link or stable item identifier,
it shows an error and does not create, copy, or save a QR code.

## Chrome Web Store Limited Use

Qrive's use of information received from Chrome and Google Drive is limited to
its user-facing single purpose and complies with the Chrome Web Store User Data
Policy, including the Limited Use requirements. The extension uses only data
that is necessary to add a local QR-code action for an already shared Drive
item.

## User choices

Qrive performs no QR action until the user selects its button. Users can remove
the extension at any time from Chrome's extension settings. Because Qrive does
not retain or receive user data, there is no developer-held user record to
access, correct, or delete.

## Changes and contact

Material changes to Qrive's data practices will be disclosed before an updated
version uses them. The effective date above will be updated when this policy
changes.

Questions and privacy requests can be submitted through
[GitHub Issues](https://github.com/GGULBAE/Qrive/issues). Security reports
should use
[GitHub's private vulnerability reporting form](https://github.com/GGULBAE/Qrive/security/advisories/new).

Qrive is an independent open-source project and is not affiliated with,
endorsed by, or sponsored by Google. Google Drive is a trademark of Google LLC.
