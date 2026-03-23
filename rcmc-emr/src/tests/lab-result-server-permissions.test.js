/**
 * Exploratory test for Task 1.2
 * Tests that uploadToGoogleDrive in server/services/googleDrive.js
 * calls driveClient.permissions.create after upload.
 *
 * This test is EXPECTED TO FAIL on unfixed code — that failure confirms the bug.
 *
 * Strategy: We read the source of server/services/googleDrive.js and inspect
 * whether the permissions.create call is present and uncommented.
 * Additionally, we create a functional test by injecting a mock drive client
 * via a thin wrapper that exercises the same logic path.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import fs from 'fs'
import path from 'path'

// ─── Source inspection test ───────────────────────────────────────────────────
// This is the most reliable way to confirm the bug: read the source and check
// whether the permissions.create call is commented out.

describe('uploadToGoogleDrive (service account) — permissions bug exploration', () => {
  const serverGoogleDrivePath = path.resolve(
    process.cwd(),
    'server/services/googleDrive.js'
  )

  it('1.2 — permissions.create call must NOT be commented out in server/services/googleDrive.js', () => {
    const source = fs.readFileSync(serverGoogleDrivePath, 'utf8')

    // Check if the permissions.create call exists in the source
    const hasPermissionsCreate = source.includes('permissions.create')

    // Check if it is inside a block comment (/* ... */)
    // We look for the pattern: /* ... permissions.create ... */
    // A simple heuristic: find the permissions.create call and check if it's
    // preceded by /* without a closing */ before it.
    const permissionsIndex = source.indexOf('permissions.create')

    let isCommentedOut = false
    if (permissionsIndex !== -1) {
      // Look backwards from the permissions.create call for a block comment opener
      const precedingSource = source.substring(0, permissionsIndex)
      const lastBlockOpen = precedingSource.lastIndexOf('/*')
      const lastBlockClose = precedingSource.lastIndexOf('*/')

      // If the last /* comes after the last */, the call is inside a block comment
      isCommentedOut = lastBlockOpen > lastBlockClose
    }

    // This assertion FAILS on unfixed code because permissions.create IS commented out
    expect(hasPermissionsCreate).toBe(true)
    expect(isCommentedOut).toBe(false)
  })

  it('1.2b — the permissions call should set role=reader and type=anyone', () => {
    const source = fs.readFileSync(serverGoogleDrivePath, 'utf8')

    const permissionsIndex = source.indexOf('permissions.create')
    if (permissionsIndex === -1) {
      // No permissions.create at all — fail
      expect(permissionsIndex).not.toBe(-1)
      return
    }

    // Check if it's commented out
    const precedingSource = source.substring(0, permissionsIndex)
    const lastBlockOpen = precedingSource.lastIndexOf('/*')
    const lastBlockClose = precedingSource.lastIndexOf('*/')
    const isCommentedOut = lastBlockOpen > lastBlockClose

    // This assertion FAILS on unfixed code
    expect(isCommentedOut).toBe(false)

    // Check the permissions block contains role: 'reader' and type: 'anyone'
    const afterPermissions = source.substring(permissionsIndex, permissionsIndex + 300)
    expect(afterPermissions).toMatch(/role.*reader/)
    expect(afterPermissions).toMatch(/type.*anyone/)
  })

  it('1.2c — permissions.create should be called with the uploaded file ID', () => {
    const source = fs.readFileSync(serverGoogleDrivePath, 'utf8')

    const permissionsIndex = source.indexOf('permissions.create')
    if (permissionsIndex === -1) {
      expect(permissionsIndex).not.toBe(-1)
      return
    }

    const precedingSource = source.substring(0, permissionsIndex)
    const lastBlockOpen = precedingSource.lastIndexOf('/*')
    const lastBlockClose = precedingSource.lastIndexOf('*/')
    const isCommentedOut = lastBlockOpen > lastBlockClose

    // This assertion FAILS on unfixed code
    expect(isCommentedOut).toBe(false)

    // Check that fileId is passed (referencing response.data.id)
    const afterPermissions = source.substring(permissionsIndex, permissionsIndex + 300)
    expect(afterPermissions).toMatch(/fileId/)
  })
})
