/**
 * Transaction Manager
 * 
 * Ensures atomic imports with rollback capability.
 * Tracks all operations within a transaction and provides rollback on errors.
 * 
 * Note: Supabase client doesn't support explicit transactions, so this implements
 * application-level transaction simulation with manual rollback capability.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7
 */

import { supabase } from '../../lib/supabase.js';

/**
 * Transaction status
 */
export const TransactionStatus = {
  PENDING: 'pending',
  COMMITTED: 'committed',
  ROLLED_BACK: 'rolled_back',
  FAILED: 'failed'
};

/**
 * Transaction operation types
 */
export const OperationType = {
  INSERT: 'insert',
  UPDATE: 'update',
  DELETE: 'delete'
};

/**
 * Create a new transaction context
 * 
 * @returns {Object} Transaction context
 */
export function createTransaction() {
  return {
    id: generateTransactionId(),
    startTime: new Date(),
    operations: [],
    status: TransactionStatus.PENDING,
    insertedIds: new Map(), // table -> array of IDs
    updatedRecords: new Map(), // table -> array of {id, oldData}
    deletedRecords: new Map() // table -> array of records
  };
}

/**
 * Generate a unique transaction ID
 * 
 * @returns {string} Transaction ID
 */
function generateTransactionId() {
  return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Begin a transaction
 * 
 * @returns {Object} Transaction context
 */
export function beginTransaction() {
  const transaction = createTransaction();
  
  logTransactionEvent(transaction, 'BEGIN', 'Transaction started');
  
  return transaction;
}

/**
 * Execute an operation within a transaction
 * 
 * @param {Object} transaction - Transaction context
 * @param {Function} operation - Async operation to execute
 * @returns {Promise<any>} Operation result
 */
export async function executeInTransaction(transaction, operation) {
  if (transaction.status !== TransactionStatus.PENDING) {
    throw new Error(`Cannot execute operation: transaction is ${transaction.status}`);
  }

  try {
    const result = await operation(transaction);
    return result;
  } catch (error) {
    // Mark transaction as failed but don't rollback yet
    // Caller should decide whether to rollback
    throw error;
  }
}

/**
 * Track an insert operation
 * 
 * @param {Object} transaction - Transaction context
 * @param {string} table - Table name
 * @param {Array} insertedRecords - Inserted records with IDs
 */
export function trackInsert(transaction, table, insertedRecords) {
  const ids = insertedRecords.map(r => r.id).filter(Boolean);
  
  if (!transaction.insertedIds.has(table)) {
    transaction.insertedIds.set(table, []);
  }
  
  transaction.insertedIds.get(table).push(...ids);
  
  transaction.operations.push({
    type: OperationType.INSERT,
    table,
    recordCount: insertedRecords.length,
    timestamp: new Date()
  });
  
  logTransactionEvent(transaction, 'INSERT', `Inserted ${insertedRecords.length} records into ${table}`);
}

/**
 * Track an update operation
 * 
 * @param {Object} transaction - Transaction context
 * @param {string} table - Table name
 * @param {Array} updatedRecords - Updated records with old data
 */
export function trackUpdate(transaction, table, updatedRecords) {
  if (!transaction.updatedRecords.has(table)) {
    transaction.updatedRecords.set(table, []);
  }
  
  transaction.updatedRecords.get(table).push(...updatedRecords);
  
  transaction.operations.push({
    type: OperationType.UPDATE,
    table,
    recordCount: updatedRecords.length,
    timestamp: new Date()
  });
  
  logTransactionEvent(transaction, 'UPDATE', `Updated ${updatedRecords.length} records in ${table}`);
}

/**
 * Track a delete operation
 * 
 * @param {Object} transaction - Transaction context
 * @param {string} table - Table name
 * @param {Array} deletedRecords - Deleted records
 */
export function trackDelete(transaction, table, deletedRecords) {
  if (!transaction.deletedRecords.has(table)) {
    transaction.deletedRecords.set(table, []);
  }
  
  transaction.deletedRecords.get(table).push(...deletedRecords);
  
  transaction.operations.push({
    type: OperationType.DELETE,
    table,
    recordCount: deletedRecords.length,
    timestamp: new Date()
  });
  
  logTransactionEvent(transaction, 'DELETE', `Deleted ${deletedRecords.length} records from ${table}`);
}

/**
 * Commit a transaction
 * 
 * @param {Object} transaction - Transaction context
 * @returns {Object} Commit result
 */
export function commitTransaction(transaction) {
  if (transaction.status !== TransactionStatus.PENDING) {
    throw new Error(`Cannot commit: transaction is ${transaction.status}`);
  }

  transaction.status = TransactionStatus.COMMITTED;
  transaction.endTime = new Date();
  
  logTransactionEvent(transaction, 'COMMIT', 'Transaction committed successfully');
  
  return {
    success: true,
    transactionId: transaction.id,
    duration: transaction.endTime - transaction.startTime,
    operationCount: transaction.operations.length
  };
}

/**
 * Rollback a transaction by deleting inserted records and restoring updated records
 * 
 * @param {Object} transaction - Transaction context
 * @returns {Promise<Object>} Rollback result
 */
export async function rollbackTransaction(transaction) {
  if (transaction.status === TransactionStatus.ROLLED_BACK) {
    return { success: true, message: 'Transaction already rolled back' };
  }

  logTransactionEvent(transaction, 'ROLLBACK', 'Starting transaction rollback');

  const rollbackErrors = [];

  try {
    // Rollback in reverse order of operations
    const reversedOps = [...transaction.operations].reverse();

    for (const op of reversedOps) {
      try {
        if (op.type === OperationType.INSERT) {
          // Delete inserted records
          await rollbackInserts(transaction, op.table);
        } else if (op.type === OperationType.UPDATE) {
          // Restore old values
          await rollbackUpdates(transaction, op.table);
        } else if (op.type === OperationType.DELETE) {
          // Re-insert deleted records
          await rollbackDeletes(transaction, op.table);
        }
      } catch (error) {
        rollbackErrors.push({
          operation: op,
          error: error.message
        });
      }
    }

    transaction.status = TransactionStatus.ROLLED_BACK;
    transaction.endTime = new Date();

    logTransactionEvent(transaction, 'ROLLBACK', 'Transaction rolled back successfully');

    return {
      success: rollbackErrors.length === 0,
      transactionId: transaction.id,
      duration: transaction.endTime - transaction.startTime,
      operationCount: transaction.operations.length,
      errors: rollbackErrors
    };
  } catch (error) {
    transaction.status = TransactionStatus.FAILED;
    
    logTransactionEvent(transaction, 'ROLLBACK_FAILED', `Rollback failed: ${error.message}`);

    return {
      success: false,
      transactionId: transaction.id,
      error: error.message,
      errors: rollbackErrors
    };
  }
}

/**
 * Rollback insert operations by deleting inserted records
 * 
 * @param {Object} transaction - Transaction context
 * @param {string} table - Table name
 */
async function rollbackInserts(transaction, table) {
  const ids = transaction.insertedIds.get(table) || [];
  
  if (ids.length === 0) return;

  const { error } = await supabase
    .from(table)
    .delete()
    .in('id', ids);

  if (error) {
    throw new Error(`Failed to rollback inserts in ${table}: ${error.message}`);
  }

  logTransactionEvent(transaction, 'ROLLBACK_INSERT', `Deleted ${ids.length} records from ${table}`);
}

/**
 * Rollback update operations by restoring old values
 * 
 * @param {Object} transaction - Transaction context
 * @param {string} table - Table name
 */
async function rollbackUpdates(transaction, table) {
  const records = transaction.updatedRecords.get(table) || [];
  
  if (records.length === 0) return;

  // Restore each record to its old state
  for (const record of records) {
    const { id, oldData } = record;
    
    const { error } = await supabase
      .from(table)
      .update(oldData)
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to rollback update in ${table} for record ${id}: ${error.message}`);
    }
  }

  logTransactionEvent(transaction, 'ROLLBACK_UPDATE', `Restored ${records.length} records in ${table}`);
}

/**
 * Rollback delete operations by re-inserting deleted records
 * 
 * @param {Object} transaction - Transaction context
 * @param {string} table - Table name
 */
async function rollbackDeletes(transaction, table) {
  const records = transaction.deletedRecords.get(table) || [];
  
  if (records.length === 0) return;

  const { error } = await supabase
    .from(table)
    .insert(records);

  if (error) {
    throw new Error(`Failed to rollback deletes in ${table}: ${error.message}`);
  }

  logTransactionEvent(transaction, 'ROLLBACK_DELETE', `Re-inserted ${records.length} records into ${table}`);
}

/**
 * Log a transaction event for audit purposes
 * 
 * @param {Object} transaction - Transaction context
 * @param {string} event - Event type
 * @param {string} message - Event message
 */
function logTransactionEvent(transaction, event, message) {
  const logEntry = {
    transactionId: transaction.id,
    event,
    message,
    timestamp: new Date().toISOString(),
    status: transaction.status
  };

  // In production, this should write to a database audit log table
  console.log('[Transaction]', logEntry);
}

/**
 * Get transaction summary
 * 
 * @param {Object} transaction - Transaction context
 * @returns {Object} Transaction summary
 */
export function getTransactionSummary(transaction) {
  const duration = transaction.endTime 
    ? transaction.endTime - transaction.startTime 
    : Date.now() - transaction.startTime;

  const operationsByType = {
    [OperationType.INSERT]: 0,
    [OperationType.UPDATE]: 0,
    [OperationType.DELETE]: 0
  };

  transaction.operations.forEach(op => {
    operationsByType[op.type] += op.recordCount;
  });

  return {
    transactionId: transaction.id,
    status: transaction.status,
    startTime: transaction.startTime,
    endTime: transaction.endTime,
    duration,
    totalOperations: transaction.operations.length,
    operationsByType,
    tablesAffected: getAffectedTables(transaction)
  };
}

/**
 * Get list of tables affected by transaction
 * 
 * @param {Object} transaction - Transaction context
 * @returns {Array} Array of table names
 */
function getAffectedTables(transaction) {
  const tables = new Set();
  
  transaction.operations.forEach(op => {
    tables.add(op.table);
  });
  
  return Array.from(tables);
}

/**
 * Format transaction summary for display
 * 
 * @param {Object} transaction - Transaction context
 * @returns {string} Formatted summary
 */
export function formatTransactionSummary(transaction) {
  const summary = getTransactionSummary(transaction);
  
  const lines = [
    `Transaction ID: ${summary.transactionId}`,
    `Status: ${summary.status}`,
    `Duration: ${(summary.duration / 1000).toFixed(2)}s`,
    `Total Operations: ${summary.totalOperations}`,
    ``,
    `Operations by Type:`,
    `  Inserts: ${summary.operationsByType[OperationType.INSERT]}`,
    `  Updates: ${summary.operationsByType[OperationType.UPDATE]}`,
    `  Deletes: ${summary.operationsByType[OperationType.DELETE]}`,
    ``,
    `Tables Affected: ${summary.tablesAffected.join(', ')}`
  ];

  return lines.join('\n');
}

/**
 * Execute a function within a transaction with automatic rollback on error
 * 
 * @param {Function} fn - Async function to execute
 * @returns {Promise<any>} Function result
 */
export async function withTransaction(fn) {
  const transaction = beginTransaction();

  try {
    const result = await fn(transaction);
    commitTransaction(transaction);
    return result;
  } catch (error) {
    await rollbackTransaction(transaction);
    throw error;
  }
}

/**
 * Insert records with transaction tracking
 * 
 * @param {Object} transaction - Transaction context
 * @param {string} table - Table name
 * @param {Array} records - Records to insert
 * @returns {Promise<Array>} Inserted records with IDs
 */
export async function transactionalInsert(transaction, table, records) {
  const { data, error } = await supabase
    .from(table)
    .insert(records)
    .select();

  if (error) {
    throw new Error(`Insert failed in ${table}: ${error.message}`);
  }

  trackInsert(transaction, table, data);
  
  return data;
}

/**
 * Update records with transaction tracking
 * 
 * @param {Object} transaction - Transaction context
 * @param {string} table - Table name
 * @param {Array} records - Records to update (must include id and oldData)
 * @returns {Promise<Array>} Updated records
 */
export async function transactionalUpdate(transaction, table, records) {
  const results = [];

  for (const record of records) {
    const { id, oldData, ...updateData } = record;

    const { data, error } = await supabase
      .from(table)
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      throw new Error(`Update failed in ${table} for record ${id}: ${error.message}`);
    }

    results.push(data[0]);
  }

  trackUpdate(transaction, table, records);
  
  return results;
}

/**
 * Delete records with transaction tracking
 * 
 * @param {Object} transaction - Transaction context
 * @param {string} table - Table name
 * @param {Array} ids - IDs of records to delete
 * @returns {Promise<Array>} Deleted records
 */
export async function transactionalDelete(transaction, table, ids) {
  // First, fetch the records to be deleted (for rollback)
  const { data: recordsToDelete, error: fetchError } = await supabase
    .from(table)
    .select('*')
    .in('id', ids);

  if (fetchError) {
    throw new Error(`Failed to fetch records for deletion in ${table}: ${fetchError.message}`);
  }

  // Now delete them
  const { error: deleteError } = await supabase
    .from(table)
    .delete()
    .in('id', ids);

  if (deleteError) {
    throw new Error(`Delete failed in ${table}: ${deleteError.message}`);
  }

  trackDelete(transaction, table, recordsToDelete);
  
  return recordsToDelete;
}

/**
 * Check if transaction is in a valid state for operations
 * 
 * @param {Object} transaction - Transaction context
 * @returns {boolean} True if transaction can accept operations
 */
export function isTransactionActive(transaction) {
  return transaction.status === TransactionStatus.PENDING;
}

/**
 * Get transaction duration in milliseconds
 * 
 * @param {Object} transaction - Transaction context
 * @returns {number} Duration in milliseconds
 */
export function getTransactionDuration(transaction) {
  const endTime = transaction.endTime || new Date();
  return endTime - transaction.startTime;
}
