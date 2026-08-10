import React from 'react';
import clsx from 'clsx';

export function Table({ columns, data, rowKey, empty, className, onRowClick }) {
  if (!data || data.length === 0) {
    return empty || null;
  }

  return (
    <div className={clsx('w-full overflow-x-auto', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            {columns.map((col) => (
              <th
                key={col.key}
                className={clsx('py-2.5 px-3 font-medium text-text-muted whitespace-nowrap', col.className)}
                style={col.align ? { textAlign: col.align } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={rowKey ? rowKey(row, i) : i}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={clsx(
                'border-b border-border/60 transition-colors',
                onRowClick && 'cursor-pointer hover:bg-bg-hover',
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={clsx('py-2.5 px-3 text-text', col.cellClassName)}
                  style={col.align ? { textAlign: col.align } : undefined}
                >
                  {col.render ? col.render(row[col.key], row, i) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;