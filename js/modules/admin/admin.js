/*
====================================
ADMIN MODULE
====================================

Maintenance controls and future app-level tools.
====================================
*/

function renderAdminView() {
  document.getElementById("viewContainer").innerHTML = `
    <section class="admin-view">
      <div class="view-heading">
        <h3>Admin</h3>
        <p>App maintenance, data controls, and system checks.</p>
      </div>

      <div class="admin-grid">
        <section class="admin-panel">
          <h4>Cash</h4>
          <p>Reset paper trading cash back to the starting balance.</p>
          <button type="button" class="admin-action danger-lite" id="adminResetCash">Reset Cash</button>
        </section>

        <section class="admin-panel">
          <h4>Data Safety</h4>
          <p>ManaSpec stores your data in this browser. Export a backup before risky changes, moving computers, or sharing beta builds.</p>
          <div class="admin-action-row">
            <button type="button" class="admin-action" id="adminExportBackup">Export Backup</button>
            <button type="button" class="admin-action" id="adminImportBackup">Import Backup</button>
          </div>
          <input type="file" id="adminImportBackupFile" accept=".json,application/json" hidden>
        </section>

        <section class="admin-panel muted">
          <h4>Prices</h4>
          <p>Manual refresh jobs, source health, and stale-price checks are planned here.</p>
          <button type="button" class="admin-action" disabled>Run Price Audit</button>
        </section>

        <section class="admin-panel muted">
          <h4>Integrations</h4>
          <p>Future Card Kingdom, TCGplayer, and buylist connectors can be configured here.</p>
          <button type="button" class="admin-action" disabled>Manage Sources</button>
        </section>
      </div>
    </section>
  `;

  document.getElementById("adminResetCash").onclick = () => {
    resetCash();
    renderAdminView();
  };

  document.getElementById("adminExportBackup").onclick = exportAdminBackup;
  document.getElementById("adminImportBackup").onclick = () => {
    const input = document.getElementById("adminImportBackupFile");
    input.value = "";
    input.click();
  };
  document.getElementById("adminImportBackupFile").onchange = handleAdminBackupFileSelected;
}

function exportAdminBackup() {
  try {
    const backup = createManaSpecBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `manaspec-backup-${formatBackupFilenameDate(new Date())}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    showAdminBackupNotice("Backup exported. Your app data was not changed.", "success");
  } catch (err) {
    console.error("Backup export failed", err);
    showAdminBackupNotice("Backup could not be exported.", "warning");
  }
}

function handleAdminBackupFileSelected(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async () => {
    const result = parseManaSpecBackupText(String(reader.result || ""));

    if (!result.ok) {
      console.warn("Backup import validation failed", result.error || result.message);
      showAdminBackupNotice(result.message || "Backup could not be imported. No data was changed.", "warning");
      return;
    }

    await previewAdminBackupRestore(result.backup);
  };
  reader.onerror = () => {
    console.error("Backup file read failed", reader.error);
    showAdminBackupNotice("Backup file could not be read. No data was changed.", "warning");
  };
  reader.readAsText(file);
}

async function previewAdminBackupRestore(backup) {
  const confirmed = await requestAppConfirmation({
    title: "Restore ManaSpec Backup?",
    message: "Importing this backup will replace the current ManaSpec data in this browser. Export your current data first if you might need it.",
    confirmLabel: "Restore This Backup",
    cancelLabel: "Cancel",
    tone: "danger",
    bodyHtml: renderAdminBackupPreview(backup),
  });

  if (!confirmed) {
    showAdminBackupNotice("Import canceled. No data was changed.", "info");
    return;
  }

  try {
    restoreManaSpecBackup(backup);
    showAdminBackupNotice("Backup restored. Reloading ManaSpec...", "success");
    window.setTimeout(() => window.location.reload(), 700);
  } catch (err) {
    console.error("Backup restore failed", err);
    showAdminBackupNotice("Backup could not be imported. No data was changed.", "warning");
  }
}

function renderAdminBackupPreview(backup) {
  const counts = backup.counts || {};
  const data = backup.data || {};
  const exported = backup.exportedAt
    ? new Date(backup.exportedAt).toLocaleString()
    : "Unknown";

  const rows = [
    ["Exported", exported],
    ["Schema", `v${backup.schemaVersion || 1}`],
    ["Positions", counts.positions || 0],
    ["Radar Ideas", counts.radar || 0],
    ["Transactions", counts.transactions || 0],
    ["Thesis / Notes", counts.thesisNotes || 0],
    ["Signals", counts.signals || 0],
    ["Market Observations", counts.marketObservations || 0],
    ["Price Snapshots", counts.priceSnapshots || 0],
    ["Cash", money(data.cash || 0)],
  ];

  return `
    <div class="backup-preview-grid">
      ${rows.map(([label, value]) => `
        <div>
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
        </div>
      `).join("")}
    </div>
    <p class="backup-warning">This restore replaces current local ManaSpec data after confirmation.</p>
  `;
}

function formatBackupFilenameDate(date) {
  const pad = value => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-") + `-${pad(date.getHours())}${pad(date.getMinutes())}`;
}

function showAdminBackupNotice(message, tone) {
  if (typeof showAppNotice === "function") {
    showAppNotice(message, tone);
    return;
  }

  window.alert(message);
}
