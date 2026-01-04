// Script to convert CSV RLS policies to SQL statements
const fs = require('fs');
const path = require('path');

function convertCsvToPolicies() {
  const csvPath = path.join(__dirname, 'supabase/schema_references/Supabase Snippet Public RLS Policies.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf8');

  const lines = csvContent.split('\n');
  const policies = [];

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse the entire CSV properly, handling multiline quoted fields
    const fields = parseCompleteCsv(lines, i);
    if (!fields || fields.length < 8) continue;

    const [schemaname, tablename, policyname, permissive, roles, cmd, using_condition, check_condition] = fields;

    // Build the CREATE POLICY statement
    let sql = `CREATE POLICY "${policyname}"\n`;
    sql += `  ON ${tablename} FOR ${cmd}\n`;
    sql += `  TO ${roles.replace('{', '').replace('}', '').replace(/"/g, '')}\n`;

    if (using_condition && using_condition !== 'null') {
      sql += `  USING (${using_condition})\n`;
    }

    if (check_condition && check_condition !== 'null') {
      sql += `  WITH CHECK (${check_condition})\n`;
    }

    sql += ';\n';

    policies.push({
      table: tablename,
      policy: sql
    });

    // Skip lines that were consumed by multiline parsing
    i += fields.consumedLines || 0;
  }

  // Group policies by table
  const policiesByTable = {};
  policies.forEach(p => {
    if (!policiesByTable[p.table]) {
      policiesByTable[p.table] = [];
    }
    policiesByTable[p.table].push(p.policy);
  });

  // Generate the complete SQL file
  let sqlOutput = `-- Current RLS Policies from Remote Database
-- Generated from Supabase CSV export
-- Date: ${new Date().toISOString()}

`;

  Object.keys(policiesByTable).sort().forEach(table => {
    sqlOutput += `-- Policies for ${table} table\n`;
    policiesByTable[table].forEach(policy => {
      sqlOutput += policy + '\n';
    });
    sqlOutput += '\n';
  });

  // Write to file
  const outputPath = path.join(__dirname, 'supabase/migrations/current_rls_policies.sql');
  fs.writeFileSync(outputPath, sqlOutput);

  console.log(`Converted ${policies.length} policies for ${Object.keys(policiesByTable).length} tables`);
  console.log(`Output saved to: ${outputPath}`);

  return policies.length;
}

function parseCompleteCsv(lines, startIndex) {
  let currentLine = startIndex;
  let combinedLine = '';
  let inQuotes = false;
  let fields = [];
  let consumedLines = 0;

  // Combine multiline CSV row
  while (currentLine < lines.length) {
    const line = lines[currentLine];
    combinedLine += line;

    // Count quotes to see if we're still in a quoted field
    const quoteCount = (line.match(/"/g) || []).length;
    const openQuotes = quoteCount % 2 !== 0;

    if (!openQuotes) {
      // We have a complete CSV row
      break;
    }

    combinedLine += '\n'; // Preserve line breaks
    currentLine++;
    consumedLines++;
  }

  // Now parse the combined line
  const parsedFields = [];
  let current = '';
  inQuotes = false;
  let i = 0;

  while (i < combinedLine.length) {
    const char = combinedLine[i];

    if (char === '"') {
      if (!inQuotes) {
        inQuotes = true;
        i++;
        continue;
      } else if (inQuotes && combinedLine[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
        continue;
      } else {
        // End of quoted field
        inQuotes = false;
        i++;
        continue;
      }
    } else if (char === ',' && !inQuotes) {
      parsedFields.push(current.trim());
      current = '';
      i++;
      continue;
    } else {
      current += char;
      i++;
    }
  }

  // Add the last field
  parsedFields.push(current.trim());

  parsedFields.consumedLines = consumedLines;
  return parsedFields;
}

function parseCsvLine(line) {
  // Split by comma but be careful about quoted fields
  const fields = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (char === '"') {
      if (!inQuotes) {
        // Starting a quoted field
        inQuotes = true;
        i++;
        continue;
      } else if (inQuotes && line[i + 1] === '"') {
        // Escaped quote inside quoted field
        current += '"';
        i += 2;
        continue;
      } else {
        // Ending a quoted field
        inQuotes = false;
        i++;
        continue;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator outside quotes
      fields.push(current.trim());
      current = '';
      i++;
      continue;
    } else {
      current += char;
      i++;
    }
  }

  // Add the last field
  fields.push(current.trim());

  return fields;
}

convertCsvToPolicies();
