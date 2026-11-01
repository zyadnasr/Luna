import type { ReactNode } from "react";

export function Table({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)]">
      <table className="w-full min-w-[28rem] text-start text-sm">
        <thead className="bg-[rgba(128,128,96,0.08)]">
          <tr>
            {headers.map((header) => (
              <th className="px-4 py-3 font-semibold" scope="col" key={header}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr className="border-t border-[var(--color-border)]" key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td className="px-4 py-3" key={cellIndex}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
