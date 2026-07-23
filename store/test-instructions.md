# Chrome Web Store reviewer instructions

Qrive requires a signed-in Google Drive page with at least one file or folder
that Google Drive already marks as shared. No special test account, OAuth
consent, backend, or paid feature is required.

1. Install the submitted extension.
2. Open `https://drive.google.com/` and sign in with any reviewer-owned test
   account.
3. Open **My Drive** in list view.
4. Locate an item that Google Drive already marks as shared. If needed, create
   a harmless test file and set its sharing before testing Qrive.
5. Confirm that a small QR button appears beside the existing shared
   indicator. Non-shared items should not receive a Qrive button.
6. Select the button. Confirm that the popover shows the item name, QR code,
   **Copy link**, **Save PNG**, and the message that existing Google Drive
   permissions still apply.
7. Compare the copied link with the item's Drive destination and optionally
   scan the QR in a separate profile. Google Drive should enforce the
   pre-existing access policy.
8. Confirm that Escape and an outside click close the popover and that keyboard
   focus returns to the QR button.

Qrive never opens or changes the Google Drive sharing dialog. All QR generation
is local. When no trusted Drive link or stable row item ID is available, Qrive
shows an error and intentionally does not generate a QR code.
