import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";

export default function Table({
  columns = [],
  data = [],
  rowKey = "id",
  onRowClick,
  onRowDoubleClick,
  isRowExpanded,
  renderExpandedRow,
  enableSorting = true,
  defaultSort = null,
  enablePagination = true,
  defaultPageSize = 10,
  pageSizeOptions = [10, 20, 50],
  stickyHeader = true,
  maxHeight = "max-h-[36rem]",
  layout = "panel",
  preset = "gestion",
  minWidth = "min-w-[760px]",
  emptyMessage = "No hay registros para mostrar.",
  emptyColSpan,
  wrapperClassName,
  tableClassName,
  headerRowClassName,
  headerCellClassName,
  bodyRowClassName,
  bodyCellClassName,
  expandedRowClassName = "",
  expandedRowCellClassName = "",
}) {
  const colCount = emptyColSpan || columns.length;

  const layoutClasses = {
    panel: "bg-black/20 rounded-3xl overflow-hidden shadow-md p-6",
    embedded: "bg-transparent rounded-none overflow-hidden shadow-none p-0",
  };

  const presetClasses = {
    gestion: {
      table: "w-full text-left",
      headerRow: "bg-black/10 text-sm text-[var(--ins-text-gray)] rounded-tl-3xl rounded-tr-3xl",
      headerCell: "py-4 px-4 font-bold uppercase tracking-wider",
      stickyHeaderCell: "",
      bodyRow: "border-b border-black/10 align-top hover:bg-black/5 transition-colors",
      bodyCell: "py-4 px-4 text-[var(--ins-text-white)]",
    },
    compact: {
      table: "w-full text-left text-sm",
      headerRow: "bg-black/5 text-[10px] uppercase tracking-[0.22em] text-[var(--ins-text-gray)] rounded-tl-3xl rounded-tr-3xl",
      headerCell: "px-5 py-3 font-bold",
      stickyHeaderCell: "",
      bodyRow: "border-t border-black/5 align-top",
      bodyCell: "px-5 py-3 text-[var(--ins-text-white)]",
    },
    compactMuted: {
      table: "w-full text-left",
      headerRow: "bg-black/20 text-xs uppercase tracking-wider text-[var(--ins-text-gray)] rounded-tl-3xl rounded-tr-3xl",
      headerCell: "px-4 py-3",
      stickyHeaderCell: "",
      bodyRow: "border-t border-black/10",
      bodyCell: "px-4 py-3 text-[var(--ins-text-white)]",
    },
  };

  const resolvedPreset = presetClasses[preset] || presetClasses.gestion;
  const resolvedWrapperClass = wrapperClassName || layoutClasses[layout] || layoutClasses.panel;
  const resolvedTableClass = tableClassName || resolvedPreset.table;
  const resolvedHeaderRowClass = headerRowClassName || resolvedPreset.headerRow;
  const resolvedHeaderCellClass = headerCellClassName || resolvedPreset.headerCell;
  const resolvedBodyRowClass = bodyRowClassName || resolvedPreset.bodyRow;
  const resolvedBodyCellClass = bodyCellClassName || resolvedPreset.bodyCell;
  const resolvedStickyHeaderCellClass = resolvedPreset.stickyHeaderCell || "overflow-hidden";
  const normalizedPageSizeOptions = Array.from(new Set([defaultPageSize, ...pageSizeOptions]))
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((left, right) => left - right);

  const [sortConfig, setSortConfig] = useState(defaultSort);
  const [pageSize, setPageSize] = useState(normalizedPageSizeOptions[0] || 10);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setSortConfig(defaultSort);
  }, [defaultSort]);

  useEffect(() => {
    setPageSize(normalizedPageSizeOptions[0] || 10);
  }, [defaultPageSize]);

  const resolveRowKey = (row, index) => {
    if (typeof rowKey === "function") return rowKey(row, index);
    return row?.[rowKey] ?? index;
  };

  const resolveSortValue = (column, row, index) => {
    if (typeof column.sortValue === "function") return column.sortValue(row, index);
    if (typeof column.sortAccessor === "function") return column.sortAccessor(row, index);
    if (column.key) return row?.[column.key];
    return undefined;
  };

  const getSortableColumn = (column) => {
    if (!enableSorting || column.sortable === false || !column.header) return false;
    return data.some((row, index) => {
      const value = resolveSortValue(column, row, index);
      return value !== undefined && value !== null && value !== "";
    });
  };

  const compareValues = (leftValue, rightValue) => {
    if (leftValue === rightValue) return 0;
    if (leftValue === undefined || leftValue === null || leftValue === "") return 1;
    if (rightValue === undefined || rightValue === null || rightValue === "") return -1;

    const leftDate = typeof leftValue === "string" ? Date.parse(leftValue) : Number.NaN;
    const rightDate = typeof rightValue === "string" ? Date.parse(rightValue) : Number.NaN;
    if (!Number.isNaN(leftDate) && !Number.isNaN(rightDate)) return leftDate - rightDate;

    if (typeof leftValue === "number" && typeof rightValue === "number") {
      return leftValue - rightValue;
    }

    if (typeof leftValue === "boolean" && typeof rightValue === "boolean") {
      return Number(leftValue) - Number(rightValue);
    }

    return String(leftValue).localeCompare(String(rightValue), "es", {
      numeric: true,
      sensitivity: "base",
    });
  };

  const sortedData = useMemo(() => {
    if (!sortConfig?.key) return data;

    const targetColumn = columns.find((column) => column.key === sortConfig.key);
    if (!targetColumn || !getSortableColumn(targetColumn)) return data;

    const directionFactor = sortConfig.direction === "desc" ? -1 : 1;

    return [...data].sort((leftRow, rightRow) => {
      const leftValue = resolveSortValue(targetColumn, leftRow, 0);
      const rightValue = resolveSortValue(targetColumn, rightRow, 0);
      return compareValues(leftValue, rightValue) * directionFactor;
    });
  }, [columns, data, sortConfig]);

  const totalItems = sortedData.length;
  const totalPages = enablePagination ? Math.max(1, Math.ceil(totalItems / pageSize)) : 1;

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setPage(1);
  }, [pageSize, totalItems]);

  const pageStart = enablePagination ? (page - 1) * pageSize : 0;
  const visibleData = enablePagination ? sortedData.slice(pageStart, pageStart + pageSize) : sortedData;
  const hasRows = Array.isArray(visibleData) && visibleData.length > 0;
  const canPaginate = enablePagination && totalItems > pageSize;
  const currentStart = totalItems === 0 ? 0 : pageStart + 1;
  const currentEnd = totalItems === 0 ? 0 : pageStart + visibleData.length;

  const handleSortToggle = (column) => {
    if (!getSortableColumn(column)) return;

    setSortConfig((currentSort) => {
      if (currentSort?.key !== column.key) {
        return { key: column.key, direction: "asc" };
      }
      if (currentSort.direction === "asc") {
        return { key: column.key, direction: "desc" };
      }
      return null;
    });
    setPage(1);
  };

  const renderSortIcon = (column) => {
    const isSortable = getSortableColumn(column);
    if (!isSortable) return null;
    if (sortConfig?.key !== column.key) return <ArrowUpDown size={14} className="opacity-70" />;
    if (sortConfig.direction === "desc") return <ArrowDown size={14} className="text-[var(--secondary-color)]" />;
    return <ArrowUp size={14} className="text-[var(--secondary-color)]" />;
  };

  const pageButtons = totalPages <= 7
    ? Array.from({ length: totalPages }, (_value, index) => index + 1)
    : [1, page - 1, page, page + 1, totalPages].filter((value, index, values) => value >= 1 && value <= totalPages && values.indexOf(value) === index);

  return (
    <div className={resolvedWrapperClass}>
      <div className={`overflow-auto tdt-scrollbar ${maxHeight}`.trim()}>
        <table className={`${resolvedTableClass} ${minWidth}`.trim()}>
          <thead>
            <tr className={resolvedHeaderRowClass}>
              {columns.map((column) => (
                <th
                  key={column.key || column.header}
                  className={`${resolvedHeaderCellClass} ${stickyHeader ? `sticky top-0 z-20 ${resolvedStickyHeaderCellClass}` : ""} ${column.headerClassName || ""}`.trim()}
                  aria-sort={sortConfig?.key === column.key ? (sortConfig.direction === "desc" ? "descending" : "ascending") : "none"}
                >
                  <button
                    type="button"
                    className={`inline-flex w-full items-center gap-2 ${column.headerClassName?.includes("text-right") ? "justify-end" : "justify-start"} ${getSortableColumn(column) ? "cursor-pointer" : "cursor-default"}`.trim()}
                    onClick={() => handleSortToggle(column)}
                    disabled={!getSortableColumn(column)}
                  >
                    <span>{column.header}</span>
                    {renderSortIcon(column)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {!hasRows ? (
              <tr>
                <td colSpan={colCount} className="py-10 text-center text-[var(--ins-text-gray)]">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              visibleData.map((row, visibleIndex) => {
                const rowIndex = pageStart + visibleIndex;
                const clickable = typeof onRowClick === "function";
                const doubleClickable = typeof onRowDoubleClick === "function";
                const expanded = typeof isRowExpanded === "function" ? isRowExpanded(row, rowIndex) : false;
                const expandedContent = typeof renderExpandedRow === "function" ? renderExpandedRow(row, rowIndex) : null;
                const resolvedKey = resolveRowKey(row, rowIndex);

                return [
                  <tr
                    key={resolvedKey}
                    className={`${resolvedBodyRowClass} ${clickable || doubleClickable ? "cursor-pointer" : ""}`.trim()}
                    onClick={clickable ? () => onRowClick(row, rowIndex) : undefined}
                    onDoubleClick={doubleClickable ? () => onRowDoubleClick(row, rowIndex) : undefined}
                  >
                    {columns.map((column) => (
                      <td
                        key={`${column.key || column.header}-${resolvedKey}`}
                        className={`${resolvedBodyCellClass} ${column.cellClassName || ""}`.trim()}
                        title={typeof column.getTitle === "function" ? column.getTitle(row, rowIndex) : undefined}
                      >
                        {typeof column.render === "function"
                          ? column.render(row, rowIndex)
                          : row?.[column.key]}
                      </td>
                    ))}
                  </tr>,
                  expanded && expandedContent ? (
                    <tr key={`${resolvedKey}-expanded`} className={expandedRowClassName}>
                      <td colSpan={colCount} className={expandedRowCellClassName}>
                        {expandedContent}
                      </td>
                    </tr>
                  ) : null,
                ];
              })
            )}
          </tbody>
        </table>
      </div>

      {(enableSorting || enablePagination) && totalItems > 0 ? (
        <div className="mt-4 flex flex-col gap-3 border-t border-[var(--white-color)]/8 pt-4 text-xs text-[var(--ins-text-gray)] md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              Mostrando {currentStart}-{currentEnd} de {totalItems} registros
            </span>
            {canPaginate ? (
              <label className="flex items-center gap-2">
                <span>Por página</span>
                <select
                  value={pageSize}
                  onChange={(event) => setPageSize(Number(event.target.value))}
                  className="rounded-lg border border-[var(--white-color)]/10 bg-[var(--black-color)]/30 px-2 py-1 text-[var(--ins-text-white)] outline-none"
                >
                  {normalizedPageSizeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>

          {canPaginate ? (
            <div className="flex items-center gap-1 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                disabled={page === 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--white-color)]/10 bg-[var(--black-color)]/20 text-[var(--ins-text-white)] transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Página anterior"
              >
                <ChevronLeft size={14} />
              </button>
              {pageButtons.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  className={`min-w-8 rounded-lg border px-2.5 py-1.5 transition-colors ${page === pageNumber ? "border-[var(--secondary-color)] bg-[var(--secondary-color)]/15 text-[var(--ins-text-white)]" : "border-[var(--white-color)]/10 bg-[var(--black-color)]/20 text-[var(--ins-text-gray)] hover:text-[var(--ins-text-white)]"}`}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
                disabled={page === totalPages}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--white-color)]/10 bg-[var(--black-color)]/20 text-[var(--ins-text-white)] transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Página siguiente"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
