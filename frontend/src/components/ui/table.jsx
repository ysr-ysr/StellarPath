export function Table({ children }) {
  return <div className="overflow-x-auto rounded-lg border"><table className="w-full text-sm">{children}</table></div>;
}

export function Th({ children }) {
  return <th className="whitespace-nowrap border-b bg-muted/60 px-4 py-3 text-left font-semibold">{children}</th>;
}

export function Td({ children, className = '' }) {
  return <td className={`border-b px-4 py-3 align-top ${className}`}>{children}</td>;
}
