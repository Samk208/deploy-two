#!/usr/bin/env node
/**
 * Database Backup and Snapshot Script
 * Creates point-in-time backups of critical shop data tables
 * and provides restore functionality for emergency recovery
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { existsSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env.local');
config({ path: envPath });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Tables to backup (in dependency order)
const BACKUP_TABLES = [
  'profiles',
  'products', 
  'shops',
  'influencer_shop_products'
];

/**
 * Create timestamp-based backup tables
 */
async function createBackupTables(timestamp = null) {
  const backupTime = timestamp || new Date().toISOString().slice(0, 19).replace(/[:-]/g, '_');
  const results = {
    timestamp: backupTime,
    tables: [],
    errors: []
  };

  console.log(`📦 Creating backup tables with timestamp: ${backupTime}`);

  for (const tableName of BACKUP_TABLES) {
    const backupTableName = `${tableName}_backup_${backupTime}`;
    
    try {
      // Check if source table exists
      const { data: tableExists } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .maybeSingle();

      if (!tableExists) {
        console.log(`⚠️  Table ${tableName} does not exist, skipping`);
        continue;
      }

      // Create backup table with data
      const { error } = await supabase.rpc('sql', {
        query: `CREATE TABLE ${backupTableName} AS SELECT * FROM ${tableName};`
      });

      if (error) {
        console.error(`❌ Failed to backup ${tableName}:`, error.message);
        results.errors.push({ table: tableName, error: error.message });
      } else {
        console.log(`✅ Backed up ${tableName} → ${backupTableName}`);
        results.tables.push({ original: tableName, backup: backupTableName });
      }
    } catch (err) {
      console.error(`❌ Error backing up ${tableName}:`, err.message);
      results.errors.push({ table: tableName, error: err.message });
    }
  }

  return results;
}

/**
 * List available backup sets
 */
async function listBackups() {
  try {
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', '%_backup_%');

    if (error) {
      console.error('❌ Failed to list backups:', error);
      return [];
    }

    // Group by timestamp
    const backupGroups = {};
    tables.forEach(({ table_name }) => {
      const match = table_name.match(/^(.+)_backup_(.+)$/);
      if (match) {
        const [, tableName, timestamp] = match;
        if (!backupGroups[timestamp]) {
          backupGroups[timestamp] = [];
        }
        backupGroups[timestamp].push(tableName);
      }
    });

    return Object.entries(backupGroups).map(([timestamp, tables]) => ({
      timestamp,
      tables,
      formatted_time: timestamp.replace(/_/g, ':').replace('T', ' ')
    }));
  } catch (err) {
    console.error('❌ Error listing backups:', err.message);
    return [];
  }
}

/**
 * Restore from backup tables
 */
async function restoreFromBackup(timestamp, options = {}) {
  const { dryRun = false, tables = BACKUP_TABLES } = options;
  
  console.log(`🔄 ${dryRun ? 'DRY RUN: ' : ''}Restoring from backup: ${timestamp}`);
  
  const results = {
    timestamp,
    restored: [],
    errors: [],
    dryRun
  };

  for (const tableName of tables.reverse()) { // Reverse order for restore
    const backupTableName = `${tableName}_backup_${timestamp}`;
    
    try {
      // Check if backup table exists
      const { data: backupExists } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', backupTableName)
        .maybeSingle();

      if (!backupExists) {
        console.log(`⚠️  Backup table ${backupTableName} not found, skipping`);
        continue;
      }

      if (dryRun) {
        console.log(`🔍 Would restore ${tableName} from ${backupTableName}`);
        results.restored.push({ table: tableName, backup: backupTableName });
        continue;
      }

      // Disable foreign key checks temporarily
      await supabase.rpc('sql', { query: 'SET session_replication_role = replica;' });

      // Clear current table
      const { error: truncateError } = await supabase.rpc('sql', {
        query: `TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE;`
      });

      if (truncateError) {
        console.error(`❌ Failed to truncate ${tableName}:`, truncateError.message);
        results.errors.push({ table: tableName, error: truncateError.message });
        continue;
      }

      // Restore from backup
      const { error: restoreError } = await supabase.rpc('sql', {
        query: `INSERT INTO ${tableName} SELECT * FROM ${backupTableName};`
      });

      // Re-enable foreign key checks
      await supabase.rpc('sql', { query: 'SET session_replication_role = DEFAULT;' });

      if (restoreError) {
        console.error(`❌ Failed to restore ${tableName}:`, restoreError.message);
        results.errors.push({ table: tableName, error: restoreError.message });
      } else {
        console.log(`✅ Restored ${tableName} from ${backupTableName}`);
        results.restored.push({ table: tableName, backup: backupTableName });
      }
    } catch (err) {
      console.error(`❌ Error restoring ${tableName}:`, err.message);
      results.errors.push({ table: tableName, error: err.message });
    }
  }

  return results;
}

/**
 * Cleanup old backup tables
 */
async function cleanupOldBackups(daysOld = 7) {
  console.log(`🧹 Cleaning up backups older than ${daysOld} days`);
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  const cutoffTimestamp = cutoffDate.toISOString().slice(0, 19).replace(/[:-]/g, '_');

  const backups = await listBackups();
  const oldBackups = backups.filter(backup => backup.timestamp < cutoffTimestamp);

  const results = {
    cutoffDate: cutoffDate.toISOString(),
    deleted: [],
    errors: []
  };

  for (const backup of oldBackups) {
    for (const tableName of backup.tables) {
      const backupTableName = `${tableName}_backup_${backup.timestamp}`;
      
      try {
        const { error } = await supabase.rpc('sql', {
          query: `DROP TABLE IF EXISTS ${backupTableName};`
        });

        if (error) {
          console.error(`❌ Failed to delete ${backupTableName}:`, error.message);
          results.errors.push({ table: backupTableName, error: error.message });
        } else {
          console.log(`🗑️  Deleted old backup: ${backupTableName}`);
          results.deleted.push(backupTableName);
        }
      } catch (err) {
        console.error(`❌ Error deleting ${backupTableName}:`, err.message);
        results.errors.push({ table: backupTableName, error: err.message });
      }
    }
  }

  return results;
}

/**
 * Export backup data to JSON files
 */
async function exportBackupToJson(timestamp, outputDir = './backups') {
  console.log(`📁 Exporting backup ${timestamp} to JSON files`);
  
  const results = {
    timestamp,
    exported: [],
    errors: []
  };

  // Create output directory if it doesn't exist
  try {
    if (!existsSync(outputDir)) {
      await import('fs').then(fs => fs.promises.mkdir(outputDir, { recursive: true }));
    }
  } catch (err) {
    console.error(`❌ Failed to create output directory:`, err.message);
    return results;
  }

  for (const tableName of BACKUP_TABLES) {
    const backupTableName = `${tableName}_backup_${timestamp}`;
    const outputFile = join(outputDir, `${backupTableName}.json`);
    
    try {
      // Check if backup table exists
      const { data: tableExists } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', backupTableName)
        .maybeSingle();

      if (!tableExists) {
        console.log(`⚠️  Backup table ${backupTableName} not found, skipping`);
        continue;
      }

      // Export data
      const { data, error } = await supabase.from(backupTableName).select('*');

      if (error) {
        console.error(`❌ Failed to export ${backupTableName}:`, error.message);
        results.errors.push({ table: backupTableName, error: error.message });
        continue;
      }

      // Write to JSON file
      writeFileSync(outputFile, JSON.stringify(data, null, 2));
      console.log(`✅ Exported ${backupTableName} → ${outputFile}`);
      results.exported.push({ table: backupTableName, file: outputFile, records: data.length });
      
    } catch (err) {
      console.error(`❌ Error exporting ${backupTableName}:`, err.message);
      results.errors.push({ table: backupTableName, error: err.message });
    }
  }

  return results;
}

/**
 * Get backup statistics
 */
async function getBackupStats() {
  const backups = await listBackups();
  
  const stats = {
    total_backup_sets: backups.length,
    latest_backup: backups.length > 0 ? backups[backups.length - 1] : null,
    oldest_backup: backups.length > 0 ? backups[0] : null,
    backup_sets: backups,
    table_sizes: {}
  };

  // Get table sizes for current tables
  for (const tableName of BACKUP_TABLES) {
    try {
      const { data, error } = await supabase.from(tableName).select('*', { count: 'exact', head: true });
      if (!error) {
        stats.table_sizes[tableName] = data?.length || 0;
      }
    } catch (err) {
      stats.table_sizes[tableName] = 'Error';
    }
  }

  return stats;
}

/**
 * CLI Interface
 */
async function main() {
  const command = process.argv[2];
  const args = process.argv.slice(3);

  switch (command) {
    case 'create':
      const timestamp = args[0] || null;
      const backupResult = await createBackupTables(timestamp);
      console.log('\n📊 Backup Summary:');
      console.log(`✅ Tables backed up: ${backupResult.tables.length}`);
      console.log(`❌ Errors: ${backupResult.errors.length}`);
      if (backupResult.errors.length > 0) {
        console.log('Errors:', backupResult.errors);
      }
      break;

    case 'list':
      const backups = await listBackups();
      console.log('\n📋 Available Backup Sets:');
      if (backups.length === 0) {
        console.log('No backups found');
      } else {
        backups.forEach(backup => {
          console.log(`📦 ${backup.timestamp} (${backup.formatted_time})`);
          console.log(`   Tables: ${backup.tables.join(', ')}`);
        });
      }
      break;

    case 'restore':
      const restoreTimestamp = args[0];
      const dryRun = args.includes('--dry-run');
      if (!restoreTimestamp) {
        console.error('❌ Please specify backup timestamp');
        console.error('Usage: node backup-script.mjs restore <timestamp> [--dry-run]');
        process.exit(1);
      }
      const restoreResult = await restoreFromBackup(restoreTimestamp, { dryRun });
      console.log('\n📊 Restore Summary:');
      console.log(`✅ Tables restored: ${restoreResult.restored.length}`);
      console.log(`❌ Errors: ${restoreResult.errors.length}`);
      if (restoreResult.errors.length > 0) {
        console.log('Errors:', restoreResult.errors);
      }
      break;

    case 'cleanup':
      const days = parseInt(args[0]) || 7;
      const cleanupResult = await cleanupOldBackups(days);
      console.log('\n📊 Cleanup Summary:');
      console.log(`🗑️  Deleted: ${cleanupResult.deleted.length} backup tables`);
      console.log(`❌ Errors: ${cleanupResult.errors.length}`);
      break;

    case 'export':
      const exportTimestamp = args[0];
      const outputDir = args[1] || './backups';
      if (!exportTimestamp) {
        console.error('❌ Please specify backup timestamp');
        console.error('Usage: node backup-script.mjs export <timestamp> [output-dir]');
        process.exit(1);
      }
      const exportResult = await exportBackupToJson(exportTimestamp, outputDir);
      console.log('\n📊 Export Summary:');
      console.log(`📁 Files exported: ${exportResult.exported.length}`);
      console.log(`❌ Errors: ${exportResult.errors.length}`);
      break;

    case 'stats':
      const stats = await getBackupStats();
      console.log('\n📊 Backup Statistics:');
      console.log(`Total backup sets: ${stats.total_backup_sets}`);
      if (stats.latest_backup) {
        console.log(`Latest backup: ${stats.latest_backup.timestamp} (${stats.latest_backup.formatted_time})`);
      }
      console.log('\nCurrent table sizes:');
      Object.entries(stats.table_sizes).forEach(([table, count]) => {
        console.log(`  ${table}: ${count} records`);
      });
      break;

    default:
      console.log('🔧 Database Backup and Restore Tool');
      console.log('\nUsage:');
      console.log('  node backup-script.mjs <command> [options]');
      console.log('\nCommands:');
      console.log('  create [timestamp]          Create new backup tables');
      console.log('  list                        List available backups');
      console.log('  restore <timestamp>         Restore from backup');
      console.log('  restore <timestamp> --dry-run   Test restore without changes');
      console.log('  cleanup [days]              Delete backups older than N days (default: 7)');
      console.log('  export <timestamp> [dir]    Export backup to JSON files');
      console.log('  stats                       Show backup statistics');
      console.log('\nExamples:');
      console.log('  node backup-script.mjs create');
      console.log('  node backup-script.mjs restore 2025_01_08T10_30_00 --dry-run');
      console.log('  node backup-script.mjs cleanup 14');
      break;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Script execution failed:', error);
    process.exit(1);
  });
}

export {
    cleanupOldBackups, createBackupTables, exportBackupToJson,
    getBackupStats, listBackups,
    restoreFromBackup
};

