import fs from 'fs';
import supabase from './supabase.js';

const fileUrl = new URL('./schema.json', import.meta.url);
let lastSchema = '';

async function fetchSchema() {
  const { data: tables, error: tableError } = await supabase
    .from('pg_catalog.pg_tables')
    .select('tablename')
    .eq('schemaname', 'public');

  if (tableError || !tables) {
    console.error('Failed to load tables', tableError);
    return null;
  }

  const schema = { tables: [] };

  for (const { tablename } of tables) {
    const { data: columns, error: colError } = await supabase
      .from('information_schema.columns')
      .select('column_name,data_type')
      .eq('table_name', tablename)
      .order('ordinal_position');

    if (colError || !columns) {
      console.error('Failed to load columns for', tablename, colError);
      continue;
    }

    const { data: fkConstraints, error: fkError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name')
      .eq('table_name', tablename)
      .eq('constraint_type', 'FOREIGN KEY');

    const foreignKeys = [];

    if (!fkError && fkConstraints && fkConstraints.length > 0) {
      const constraintNames = fkConstraints.map((c) => c.constraint_name);

      const { data: keyUsage } = await supabase
        .from('information_schema.key_column_usage')
        .select('constraint_name,column_name')
        .in('constraint_name', constraintNames);

      const { data: columnUsage } = await supabase
        .from('information_schema.constraint_column_usage')
        .select('constraint_name,table_name,column_name')
        .in('constraint_name', constraintNames);

      for (const name of constraintNames) {
        const source = keyUsage?.find((k) => k.constraint_name === name);
        const target = columnUsage?.find((k) => k.constraint_name === name);
        if (source && target) {
          foreignKeys.push({
            column: source.column_name,
            references: {
              table: target.table_name,
              column: target.column_name,
            },
          });
        }
      }
    }

    schema.tables.push({
      name: tablename,
      columns: columns.map((c) => ({ name: c.column_name, type: c.data_type })),
      foreignKeys,
    });
  }

  return schema;
}

async function updateSchema() {
  const schema = await fetchSchema();
  if (!schema) return;

  const schemaStr = JSON.stringify(schema, null, 2);
  if (schemaStr !== lastSchema) {
    fs.writeFileSync(fileUrl, schemaStr);
    lastSchema = schemaStr;
    console.log('Schema updated');
  }
}

updateSchema();
setInterval(updateSchema, 1000);
