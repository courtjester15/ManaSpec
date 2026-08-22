# ManaSpec backup restore

ManaSpec stores application data in browser `localStorage`. Use the Admin screen to export a private JSON backup before moving devices or clearing browser data. Real backups can contain portfolio, transaction, and notes data and must not be committed to the public repository.

## Restore on another workstation

1. Transfer the private backup outside the repository using an appropriate secure channel.
2. Clone the repository and open ManaSpec through its normal served URL. Do not open `index.html` with `file://`.
3. Open **Admin**.
4. Choose **Import Backup** and select the private JSON export.
5. Review the displayed record counts and confirm **Restore backup**.

The vanilla and React apps share the backup format. Browser storage is origin-specific, so repeat the import when using a different host or port.
