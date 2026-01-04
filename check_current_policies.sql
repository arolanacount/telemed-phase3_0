-- Check what policies currently exist on clinicians table
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'clinicians'
ORDER BY policyname;
