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

        <section class="admin-panel muted">
          <h4>Data</h4>
          <p>Import, export, backups, and localStorage repair tools can live here next.</p>
          <button type="button" class="admin-action" disabled>Export Backup</button>
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
}
