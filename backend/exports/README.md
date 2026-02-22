# Graduation Exports

This directory contains CSV exports of graduated students (4th year, 8th semester).

## Automatic Export Process

When 4th year students complete semester 8 and get promoted:
1. **Export**: Student data is automatically exported to a timestamped CSV file
2. **Delete**: Students are removed from the active database
3. **Archive**: CSV files serve as permanent physical records

## CSV File Format

Each export includes:
- Roll No
- Name
- Year/Semester
- Branch/Section
- Total Late Days
- Excuse Days Used
- Total Fines
- Graduation Date
- Late History Count

## File Naming Convention

```
graduated_students_YYYY-MM-DDTHH-MM-SS.csv
```

Example: `graduated_students_2026-02-22T17-30-45.csv`

## Storage Recommendations

1. **Backup**: Copy CSV files to external storage monthly
2. **Archive**: Move files older than 1 year to permanent archive
3. **Access Control**: Restrict access to authorized faculty only
4. **Retention**: Keep records for minimum 5 years as per institutional policy

## Notes

- CSV files are auto-generated during semester promotion
- Files are excluded from git via `.gitignore`
- Manual deletion of graduated students is NOT recommended (use promotion workflow)
