import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  EditModule,
  FormatModule,
  InteractionModule,
  KeybindingsModule,
  ResizeColumnsModule,
  ResizeTableModule,
  SortModule,
  Tabulator,
  TooltipModule,
} from "tabulator-tables";

Tabulator.registerModule([
  EditModule,
  FormatModule,
  InteractionModule,
  KeybindingsModule,
  ResizeColumnsModule,
  ResizeTableModule,
  SortModule,
  TooltipModule,
]);

const INTERACTIVE_SELECTOR = "button,input,select,a,textarea,label,[role='button']";

function compareValues(left, right) {
  if (typeof left === "number" && typeof right === "number") return left - right;
  return String(left ?? "").localeCompare(String(right ?? ""), undefined, { numeric: true });
}

function cloneRows(rows) {
  return rows.map(row => ({ ...row }));
}

function columnSignature(columns) {
  return columns.map(column => [
    column.key,
    column.label,
    column.align,
    column.width,
    column.minWidth,
    column.widthGrow,
    column.widthShrink,
    column.sort === false,
    column.editor || "",
  ].join(":")).join("|");
}

function makeTextNode(value, className = "") {
  const span = document.createElement("span");
  span.className = className;
  span.textContent = String(value ?? "");
  return span;
}

function assignDefined(target, options) {
  for (const [key, value] of Object.entries(options)) {
    if (value !== undefined) target[key] = value;
  }
  return target;
}

export function TabulatorTable({
  columns,
  rows,
  empty = "No rows yet.",
  onRowClick,
  tableClass = "",
  ariaLabel = "Data table",
  initialSort,
}) {
  const mountRef = useRef(null);
  const tableRef = useRef(null);
  const columnsRef = useRef(columns);
  const onRowClickRef = useRef(onRowClick);
  const rootsRef = useRef(new Set());
  const rowsRef = useRef(rows);
  const signature = useMemo(() => columnSignature(columns), [columns]);
  const signatureRef = useRef(signature);

  columnsRef.current = columns;
  onRowClickRef.current = onRowClick;

  function cleanupCellRoots() {
    for (const root of rootsRef.current) root.unmount();
    rootsRef.current.clear();
  }

  function currentColumn(key) {
    return columnsRef.current.find(column => column.key === key);
  }

  function makeColumn(column) {
    const definition = {
      title: column.label,
      field: column.key,
      headerSort: column.sort !== false,
      headerHozAlign: column.align === "money" ? "right" : column.align === "actions" ? "center" : column.align || "left",
      hozAlign: column.align === "money" ? "right" : column.align === "actions" ? "center" : column.align || "left",
      resizable: false,
      cssClass: [column.align, column.className].filter(Boolean).join(" "),
      tooltip: column.title ? cell => currentColumn(column.key)?.title?.(cell.getRow().getData()) : false,
    };

    assignDefined(definition, {
      width: column.width,
      minWidth: column.minWidth,
      widthGrow: column.widthGrow,
      widthShrink: column.widthShrink,
      sorter: column.sortValue
        ? (_left, _right, leftRow, rightRow) => {
          const active = currentColumn(column.key);
          return compareValues(active?.sortValue?.(leftRow.getData()), active?.sortValue?.(rightRow.getData()));
        }
        : undefined,
      cellClick: column.onCellClick ? (_event, cell) => currentColumn(column.key)?.onCellClick?.(cell.getRow().getData(), cell) : undefined,
    });

    if (column.render) {
      definition.formatter = cell => {
        const host = document.createElement("div");
        host.className = "ms-tabulator-cell-content";
        const root = createRoot(host);
        rootsRef.current.add(root);
        root.render(currentColumn(column.key)?.render?.(cell.getRow().getData(), cell));
        cell.getElement().dataset.label = column.label;
        return host;
      };
    } else if (column.format) {
      definition.formatter = cell => {
        cell.getElement().dataset.label = column.label;
        return makeTextNode(currentColumn(column.key)?.format?.(cell.getRow().getData(), cell.getValue()), column.formatClass || "");
      };
    } else {
      definition.formatter = cell => {
        cell.getElement().dataset.label = column.label;
        return makeTextNode(cell.getValue());
      };
    }

    if (column.editor) {
      definition.editor = column.editor;
      assignDefined(definition, { editorParams: column.editorParams });
      definition.editable = column.editable ?? true;
      definition.cellEdited = cell => {
        const active = currentColumn(column.key);
        active?.onEdit?.(cell.getRow().getData(), cell.getValue(), cell.getOldValue());
      };
    }

    return definition;
  }

  function makeColumns() {
    return columnsRef.current.map(makeColumn);
  }

  useLayoutEffect(() => {
    const defaultSort = initialSort || (() => {
      const column = columnsRef.current.find(item => item.sort !== false);
      return column ? [{ column: column.key, dir: "asc" }] : [];
    })();
    const table = new Tabulator(mountRef.current, {
      data: cloneRows(rowsRef.current),
      columns: makeColumns(),
      index: "id",
      layout: "fitColumns",
      layoutColumnsOnNewData: true,
      placeholder: empty,
      initialSort: defaultSort,
      rowHeight: 27,
      columnHeaderVertAlign: "middle",
      movableColumns: false,
      reactiveData: false,
    });

    table.on("rowClick", (event, row) => {
      if (!onRowClickRef.current || event.target.closest(INTERACTIVE_SELECTOR)) return;
      onRowClickRef.current(row.getData());
    });
    tableRef.current = table;

    return () => {
      cleanupCellRoots();
      table.destroy();
      tableRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!tableRef.current || rowsRef.current === rows) return;
    rowsRef.current = rows;
    cleanupCellRoots();
    tableRef.current.replaceData(cloneRows(rows));
  }, [rows]);

  useEffect(() => {
    if (!tableRef.current || signatureRef.current === signature) return;
    signatureRef.current = signature;
    cleanupCellRoots();
    tableRef.current.setColumns(makeColumns());
  }, [signature]);

  return <div className={`ms-tabulator ${tableClass}`} role="region" aria-label={ariaLabel} ref={mountRef} />;
}
