# ManaSpec Beta Deployment

ManaSpec closed beta uses the existing vanilla HTML/CSS/JavaScript app. React migration, build tooling, backend services, accounts, database storage, and shared server state are out of scope for this beta path.

## Deployment Target

- Host: GitHub Pages
- Branch: `main`
- Source: repository root
- Expected beta URL after Pages is enabled: `https://courtjester15.github.io/ManaSpec/`
- Current app version shown in the UI: `v0.9.0-alpha.1`
- Backup schema: `manaspec-localstorage-backup` schema version `1`

GitHub Pages should be configured in the repository settings:

1. Open the GitHub repository: `courtjester15/ManaSpec`.
2. Go to Settings -> Pages.
3. Set Source to "Deploy from a branch".
4. Set Branch to `main` and folder to `/ (root)`.
5. Save and wait for Pages to publish.

No build command is required. The root `index.html` is the app entry point.

## Readiness Audit

The current root app is suitable for GitHub Pages project hosting.

- `index.html` uses relative local asset paths: `css/style.css`, `js/...`, and `assets/images/manaspeclogo.png`.
- `css/style.css` imports local CSS files with relative `./...` paths.
- There are no internal JSON or runtime file fetches that depend on the domain root.
- Scryfall API calls use absolute HTTPS URLs.
- The app uses button-driven view switching inside one static page, not path-based routing.
- There are no `history.pushState`, `replaceState`, or hash-routing requirements.
- GitHub Pages HTTPS is compatible with the current Scryfall HTTPS requests.
- The external Pico CSS dependency loads from jsDelivr over HTTPS.

Because assets are relative, they should resolve correctly from a project Pages subpath such as `/ManaSpec/`. Avoid changing local references to root-relative paths like `/css/style.css`; that would break project Pages hosting.

## Local Data Behavior

ManaSpec stores beta user data in each tester's browser `localStorage`. Data is scoped to the URL origin.

For the expected Pages URL, the browser origin is:

```text
https://courtjester15.github.io
```

This means beta data should survive normal app updates as long as testers keep using the same Pages URL and do not clear site data. Changing to a custom domain, different GitHub account, different repository name, or a different host origin would create a separate localStorage area.

The app currently uses these localStorage keys for user data and UI state:

- `specs`
- `radar`
- `transactions`
- `cardNotes`
- `thesisNotes`
- `signals`
- `cash`
- `priceSnapshots`
- `priceRefreshStatus`
- `marketObservations`
- `cardDetailNotesExpanded`
- `manaspec_pre_import_backup`

Do not rename storage keys during beta deployment work. If a future update must rename a key, write a one-time migration and document it before testers open the updated app.

## Backup And Restore

The Admin -> Data Safety panel is the beta safety net.

Export Backup:

- Creates a timestamped JSON file.
- Includes Positions, Radar, Transactions, card notes, archived thesis notes, signals, cash, price snapshots, price refresh status, and market observations.
- Does not change app data.

Import Backup:

- Uses a local JSON file picker.
- Validates that the file looks like a ManaSpec backup.
- Requires confirmation before replacing browser data.
- Stores an emergency pre-import backup in `manaspec_pre_import_backup` before restore.

Tester rule: export a backup before major testing, before opening a newly updated beta build, and before importing any other backup.

## Update Workflow

For normal beta updates:

1. Commit changes to `main`.
2. Push `main` to GitHub.
3. Wait for GitHub Pages to publish the new static files.
4. Open `https://courtjester15.github.io/ManaSpec/`.
5. Hard refresh if the browser appears to show old files.

Tester localStorage should remain in place across these updates. If a tester reports missing or strange data after an update, have them stop testing, export the current state if possible, and restore their last known-good backup from Admin -> Data Safety.

## Smoke Test

After Pages publishes, run this closed-beta smoke test from the Pages URL:

1. Open `https://courtjester15.github.io/ManaSpec/`.
2. Confirm the logo, Pico CSS, app CSS, and module scripts load with no missing-asset console errors.
3. Search for a card.
4. Add one exact printing to Radar.
5. Add or edit a note from Card Detail.
6. Open Positions, Radar, Signals, Transactions, History, and Admin.
7. Add a manual Market Check if practical.
8. Export a JSON backup from Admin.
9. Refresh the page and confirm data persists.
10. In a clean browser profile if practical, import the backup and confirm the restored data appears.

## Known Risks

- GitHub Pages is public static hosting. Treat the beta URL as a trusted-tester handoff, not access control.
- localStorage is per browser and per device. It does not sync across testers, devices, profiles, or browsers.
- Clearing site data deletes ManaSpec beta data unless the tester has exported a backup.
- Browser privacy tools or strict storage settings can clear localStorage.
- Scryfall search and price refresh require network access.
- The app does not currently define a custom Content Security Policy. GitHub Pages does not add a CSP that blocks the current script, style, image, localStorage, or Scryfall API usage.

## Tester Handoff Checklist

- Send the Pages URL: `https://courtjester15.github.io/ManaSpec/`.
- Tell testers their data stays in their own browser.
- Ask testers to use the same URL every time.
- Ask testers to export a backup before serious testing and before major updates.
- Ask testers not to clear site data unless they have a backup.
- Keep React migration explicitly out of closed beta deployment work.
