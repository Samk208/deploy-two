# Pre-Deploy Backup

- **Status**: Completed
- **Initiated by**: Developer
- **When**: 2025-10-12_11-58-06

## What was backed up

- **Schema**: `public`
- **Schema**: `storage`
- **Schema**: `auth`
- **Format**: Custom format (`.dump`) via `pg_dump -Fc`
- **Output directory**: `Backup/`

## Files created

- `Backup/public-2025-10-12_11-58-06.dump`
- `Backup/storage-2025-10-12_11-58-06.dump`
- `Backup/auth-2025-10-12_11-58-06.dump`

## How to run (PowerShell)

Ensure `SUPABASE_DB_URL` is set in your environment (e.g. via `.env.local`) and `pg_dump` is installed and on PATH (from PostgreSQL client tools).

```powershell
$ts = (Get-Date).ToString('yyyy-MM-dd_HH-mm-ss')
$outDir = "Backup"
if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

pg_dump "$env:SUPABASE_DB_URL" -n public  -Fc -f "$outDir/public-$ts.dump"
pg_dump "$env:SUPABASE_DB_URL" -n storage -Fc -f "$outDir/storage-$ts.dump"
pg_dump "$env:SUPABASE_DB_URL" -n auth    -Fc -f "$outDir/auth-$ts.dump"
```

## Post-run checklist

- Confirm 3 files exist under `Backup/`
- Verify `.dump` files are ignored by git (covered in `.gitignore`)
- Update this document with the actual timestamp and file list

## Notes

- This operation is read-only to the database.
- Use `pg_restore` to restore individual schemas/tables if ever needed.
