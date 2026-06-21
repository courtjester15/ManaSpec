/*
====================================
STANDARD TABLE UI
====================================

Shared renderer for financial tables.
Modules provide columns and row behavior; this owns the markup contract.
====================================
*/

function renderStandardTable(container, config) {
  if (!container) return;

  const rows = config.rows || [];
  container.className = ["ms-table", config.tableClass].filter(Boolean).join(" ");

  if (!rows.length) {
    container.innerHTML = `<div class="empty-state">${config.emptyText || "No rows."}</div>`;
    return;
  }

  container.innerHTML = `
    <div class="ms-table__header" role="row">
      ${config.columns.map(column => renderStandardTableHeader(column, config)).join("")}
    </div>
    <div class="ms-table__body">
      ${rows.map((row, index) => renderStandardTableRow(row, index, config)).join("")}
    </div>
  `;

  bindStandardTableEvents(container, rows, config);
}

function renderTablePageSizeControl(idPrefix) {
  return `
    <label class="table-page-size-control" for="${idPrefix}TablePageSize">
      <span>Rows</span>
      <select id="${idPrefix}TablePageSize" aria-label="Rows per page">
        <option value="25">25</option>
        <option value="50">50</option>
        <option value="100">100</option>
      </select>
    </label>
  `;
}

function initTablePageSizeControl(idPrefix, onChange) {
  const control = document.getElementById(`${idPrefix}TablePageSize`);
  if (!control) return;

  control.value = String(getStandardTablePageSize(idPrefix));
  control.addEventListener("change", () => {
    localStorage.setItem(getStandardTablePageSizeKey(idPrefix), control.value);
    if (typeof onChange === "function") onChange();
  });
}

function paginateStandardRows(rows, idPrefix) {
  return rows.slice(0, getStandardTablePageSize(idPrefix));
}

function getStandardTableShownCount(rows, idPrefix) {
  return Math.min(rows.length, getStandardTablePageSize(idPrefix));
}

function getStandardTablePageSize(idPrefix) {
  const saved = Number(localStorage.getItem(getStandardTablePageSizeKey(idPrefix)) || 25);
  return [25, 50, 100].includes(saved) ? saved : 25;
}

function getStandardTablePageSizeKey(idPrefix) {
  return `tablePageSize:${idPrefix}`;
}

function renderStandardTableHeader(column, config) {
  const classes = ["ms-table__head-cell", getStandardAlignClass(column.align), column.headerClass]
    .filter(Boolean)
    .join(" ");

  if (!column.sortKey) {
    return `<span class="${classes}">${msEscapeHtml(column.label || "")}</span>`;
  }

  const active = config.sortState?.field === column.sortKey;
  const arrow = active ? (config.sortState.direction === "asc" ? " ^" : " v") : "";
  return `
    <button type="button" class="ms-table__sort ${classes}${active ? " active" : ""}" data-ms-sort="${msEscapeAttr(column.sortKey)}">
      ${msEscapeHtml(column.label || "")}${arrow}
    </button>
  `;
}

function renderStandardTableRow(row, index, config) {
  const rowId = config.getRowId ? config.getRowId(row) : index;
  const cells = config.columns.map(column => renderStandardTableCell(row, index, column)).join("");
  return `
    <div class="ms-table__row ${config.rowClass || ""}" role="row" data-ms-row="${index}" data-row-id="${msEscapeAttr(rowId)}">
      ${cells}
    </div>
  `;
}

function renderStandardTableCell(row, index, column) {
  const extraClass = typeof column.className === "function" ? column.className(row, index) : column.className;
  const classes = ["ms-table__cell", getStandardAlignClass(column.align), extraClass]
    .filter(Boolean)
    .join(" ");
  const tooltipValue = column.title ? column.title(row, index) : "";
  const tooltip = tooltipValue ? ` data-ms-tooltip="${msEscapeAttr(tooltipValue)}"` : "";

  if (column.type === "link") {
    return `
      <button type="button" class="link-action ${classes}" data-ms-action="${msEscapeAttr(column.action || "primary")}" data-ms-row="${index}"${tooltip}>
        ${msEscapeHtml(column.value ? column.value(row, index) : "")}
      </button>
    `;
  }

  if (column.type === "input") {
    return `
      <input class="ms-table__input ${classes}" name="${msEscapeAttr(column.name || column.key || "")}" type="${column.inputType || "text"}" value="${msEscapeAttr(column.value ? column.value(row, index) : "")}" data-ms-input="${msEscapeAttr(column.name || column.key || "")}" data-ms-row="${index}" ${column.inputAttrs || ""}>
    `;
  }

  if (column.type === "editable" || column.type === "editableWithSuffix") {
    const name = column.name || column.key || "";
    const value = column.value ? column.value(row, index) : "";
    const displayValue = value === "" || value === null || value === undefined
      ? (column.placeholder || "-")
      : value;
    const suffix = column.type === "editableWithSuffix" ? column.suffix || "" : "";
    const emptyClass = value === "" || value === null || value === undefined ? " empty" : "";
    return `
      <label class="ms-table__editable ${classes}${emptyClass}" data-ms-editable-cell>
        <button type="button" class="ms-table__editable-display" data-ms-edit="${msEscapeAttr(name)}" data-ms-row="${index}" aria-label="Edit ${msEscapeAttr(column.label || name)}">
          <span>${msEscapeHtml(displayValue)}</span>
          ${suffix ? `<em>${msEscapeHtml(suffix)}</em>` : ""}
        </button>
        <span class="ms-table__editable-input-wrap">
          <input class="ms-table__input" name="${msEscapeAttr(name)}" type="${column.inputType || "text"}" value="${msEscapeAttr(value)}" data-ms-input="${msEscapeAttr(name)}" data-ms-row="${index}" data-ms-original-value="${msEscapeAttr(value)}" ${column.inputAttrs || ""}>
          ${suffix ? `<span>${msEscapeHtml(suffix)}</span>` : ""}
        </span>
      </label>
    `;
  }

  if (column.type === "inputWithSuffix") {
    return `
      <label class="ms-table__input-wrap ${classes}">
        <input class="ms-table__input" name="${msEscapeAttr(column.name || column.key || "")}" type="${column.inputType || "text"}" value="${msEscapeAttr(column.value ? column.value(row, index) : "")}" data-ms-input="${msEscapeAttr(column.name || column.key || "")}" data-ms-row="${index}" ${column.inputAttrs || ""}>
        <span>${msEscapeHtml(column.suffix || "")}</span>
      </label>
    `;
  }

  if (column.type === "stepper") {
    const name = column.name || column.key || "";
    const value = column.value ? column.value(row, index) : "";
    const min = column.min ?? "";
    const max = column.max ?? "";
    const step = column.step ?? 1;
    return `
      <div class="ms-table__stepper ${classes}" data-ms-stepper="${msEscapeAttr(name)}" data-ms-row="${index}" data-min="${msEscapeAttr(min)}" data-max="${msEscapeAttr(max)}" data-step="${msEscapeAttr(step)}">
        <button type="button" class="ms-table__stepper-btn" data-ms-step="-1" aria-label="Decrease ${msEscapeAttr(column.label || name)}">-</button>
        <input class="ms-table__stepper-input" name="${msEscapeAttr(name)}" type="text" inputmode="numeric" pattern="[0-9]*" value="${msEscapeAttr(value)}" data-ms-input="${msEscapeAttr(name)}" data-ms-row="${index}">
        <button type="button" class="ms-table__stepper-btn" data-ms-step="1" aria-label="Increase ${msEscapeAttr(column.label || name)}">+</button>
      </div>
    `;
  }

  if (column.type === "actions") {
    return `
      <div class="${classes} row-actions">
        ${(column.actions || []).map(action => {
          const actionClass = ["ms-btn--table", action.className || ""].filter(Boolean).join(" ");
          return `
          <button type="button" class="${actionClass}" data-ms-action="${msEscapeAttr(action.action)}" data-ms-row="${index}">
            ${msEscapeHtml(action.label)}
          </button>
        `;
        }).join("")}
      </div>
    `;
  }

  if (column.type === "badge") {
    const badgeClass = column.badgeClass ? column.badgeClass(row, index) : "";
    return `<span class="${classes}"><mark class="status-pill ${badgeClass}">${msEscapeHtml(column.value ? column.value(row, index) : "")}</mark></span>`;
  }

  const value = column.html ? column.html(row, index) : msEscapeHtml(column.value ? column.value(row, index) : "");
  return `<span class="${classes}"${tooltip}>${value}</span>`;
}

function bindStandardTableEvents(container, rows, config) {
  container.querySelectorAll("[data-ms-sort]").forEach(button => {
    button.addEventListener("click", () => {
      if (typeof config.onSort === "function") config.onSort(button.dataset.msSort);
    });
  });

  container.querySelectorAll("[data-ms-action]").forEach(control => {
    control.addEventListener("click", event => {
      event.stopPropagation();
      preserveViewportDuring(() => {
        const row = rows[Number(control.dataset.msRow)];
        if (row && typeof config.onAction === "function") {
          config.onAction(control.dataset.msAction, row, event);
        }
      });
    });
  });

  container.querySelectorAll("[data-ms-input]").forEach(input => {
    input.addEventListener("click", event => event.stopPropagation());
    input.addEventListener("keydown", event => {
      event.stopPropagation();
      if (event.key === "Enter") {
        event.preventDefault();
        input.blur();
      }
      if (event.key === "Escape") {
        const cell = input.closest("[data-ms-editable-cell]");
        if (cell) cell.classList.remove("editing");
        input.blur();
      }
    });
    input.addEventListener("blur", event => {
      const cell = input.closest("[data-ms-editable-cell]");
      if (!cell?.classList.contains("editing")) return;
      cell.classList.remove("editing");
      if (event.target.value === input.dataset.msOriginalValue) return;
      preserveViewportDuring(() => {
        const row = rows[Number(input.dataset.msRow)];
        if (row && typeof config.onInputChange === "function") {
          config.onInputChange(input.dataset.msInput, row, event.target.value, event);
        }
      });
    });
    input.addEventListener("change", event => {
      if (input.closest("[data-ms-editable-cell]")) return;
      preserveViewportDuring(() => {
        const row = rows[Number(input.dataset.msRow)];
        if (row && typeof config.onInputChange === "function") {
          config.onInputChange(input.dataset.msInput, row, event.target.value, event);
        }
      });
    });
  });

  container.querySelectorAll("[data-ms-edit]").forEach(button => {
    button.addEventListener("click", event => {
      event.stopPropagation();
      const cell = button.closest("[data-ms-editable-cell]");
      const input = cell?.querySelector("[data-ms-input]");
      if (!cell || !input) return;
      cell.classList.add("editing");
      input.focus();
      input.select();
    });
  });

  container.querySelectorAll("[data-ms-step]").forEach(button => {
    button.addEventListener("click", event => {
      event.stopPropagation();
      preserveViewportDuring(() => {
        const stepper = button.closest("[data-ms-stepper]");
        const input = stepper?.querySelector("[data-ms-input]");
        const row = rows[Number(stepper?.dataset.msRow)];
        if (!stepper || !input || !row || typeof config.onInputChange !== "function") return;

        const step = Number(stepper.dataset.step || 1) * Number(button.dataset.msStep || 0);
        const min = stepper.dataset.min === "" ? -Infinity : Number(stepper.dataset.min);
        const max = stepper.dataset.max === "" ? Infinity : Number(stepper.dataset.max);
        const current = Number(input.value || 0);
        const next = Math.min(max, Math.max(min, current + step));
        input.value = String(next);
        config.onInputChange(stepper.dataset.msStepper, row, input.value, event);
      });
    });
  });

  if (typeof config.onRowClick === "function") {
    container.querySelectorAll(".ms-table__row").forEach(rowEl => {
      rowEl.addEventListener("click", event => {
        if (event.target.closest("button, input, select, textarea")) return;
        const row = rows[Number(rowEl.dataset.msRow)];
        if (row) config.onRowClick(row, event);
      });
    });
  }
}

function preserveViewportDuring(callback) {
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  callback();
  requestAnimationFrame(() => window.scrollTo(scrollX, scrollY));
}

function getStandardAlignClass(align) {
  if (align === "center") return "ms-table__cell--center";
  if (align === "money" || align === "number") return "ms-table__cell--money";
  if (align === "actions") return "ms-table__cell--actions";
  return "";
}

function updateStandardSort(sortState, field, defaultDirection = "asc") {
  if (sortState.field === field) {
    sortState.direction = sortState.direction === "asc" ? "desc" : "asc";
  } else {
    sortState.field = field;
    sortState.direction = defaultDirection;
  }
}

function sortRowsByField(rows, sortState, getValue) {
  const direction = sortState.direction === "asc" ? 1 : -1;
  return rows.sort((a, b) => compareStandardSortValues(getValue(a, sortState.field), getValue(b, sortState.field)) * direction);
}

function compareStandardSortValues(left, right) {
  if (typeof left === "number" || typeof right === "number") {
    return Number(left || 0) - Number(right || 0);
  }

  return String(left || "").localeCompare(String(right || ""), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function msEscapeAttr(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function msEscapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
