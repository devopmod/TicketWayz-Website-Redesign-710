import React, { useEffect, useRef, useState } from 'react';

const SchemaPage = () => {
  const [schema, setSchema] = useState(null);
  const lastText = useRef('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/src/lib/schema.json?_=' + Date.now());
        if (!res.ok) return;
        const text = await res.text();
        if (text !== lastText.current) {
          lastText.current = text;
          setSchema(JSON.parse(text));
        }
      } catch (err) {
        console.error('Failed to load schema', err);
      }
    };

    load();
    const id = setInterval(load, 1000);
    return () => clearInterval(id);
  }, []);

  if (!schema) {
    return <div className="p-4">Loading schema...</div>;
  }

  return (
    <div className="p-4">
      {schema.tables.map((table) => (
        <div key={table.name} className="mb-6">
          <h2 className="font-bold text-xl mb-2">{table.name}</h2>
          <h3 className="font-semibold">Columns</h3>
          <ul className="list-disc pl-5 mb-2">
            {table.columns.map((col) => (
              <li key={col.name}>
                {col.name} ({col.type})
              </li>
            ))}
          </ul>
          {table.foreignKeys.length > 0 && (
            <>
              <h3 className="font-semibold">Foreign Keys</h3>
              <ul className="list-disc pl-5">
                {table.foreignKeys.map((fk, idx) => (
                  <li key={idx}>
                    {fk.column} → {fk.references.table}.{fk.references.column}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default SchemaPage;
