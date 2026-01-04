require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function getPolicies() {
  // Create a direct PostgreSQL connection using the Supabase connection details
  // From the debug output, we know the connection URL
  const connectionString = `postgresql://postgres.fsaxrfjuyxetvbnoydns:YOUR_PASSWORD@aws-1-us-east-2.pooler.supabase.com:5432/postgres`;

  const client = new Client({
    connectionString,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Query for RLS policies
    const result = await client.query(`
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `);

    console.log('Current RLS Policies:');
    console.log('===================');

    result.rows.forEach(policy => {
      console.log(`\nTable: ${policy.tablename}`);
      console.log(`Policy: ${policy.policyname}`);
      console.log(`Command: ${policy.cmd}`);
      console.log(`Roles: ${policy.roles.join(', ')}`);
      if (policy.qual) {
        console.log(`Using: ${policy.qual}`);
      }
      if (policy.with_check) {
        console.log(`With Check: ${policy.with_check}`);
      }
      console.log('---');
    });

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

getPolicies();
