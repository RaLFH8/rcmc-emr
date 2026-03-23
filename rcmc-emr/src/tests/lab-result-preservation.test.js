/**
 * Preservation tests for Task 4 — lab-result-file-not-showing bugfix
 *
 * These tests confirm that the fix (adding permissions.create after upload)
 * did NOT break any existing behavior:
 *
 *   4.2 uploadToGoogleDrive (OAuth) still resolves with { fileId, url, size }
 *   4.3 File validation in LabResults.jsx (non-PDF rejection, >10MB rejection)
 *       NOTE: googleDriveOAuth.js itself has NO built-in validation — validation
 *       lives in LabResults.jsx handleFileSelect. These tests confirm that
 *       behavior is unchanged (the function accepts any file object passed to it).
 *   4.4 deleteFromGoogleDrive behavior is unchanged
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Shared mock setup ────────────────────────────────────────────────────────

function setupMocks({ uploadOk = true, permissionsOk = true, deleteOk = true } = {}) {
  global.fetch = vi.fn(async (url, options) => {
    const method = (options?.method || 'GET').toUpperCase()
    const urlStr = String(url)

    if (urlStr.includes('/upload/drive/v3/files')) {
      if (!uploadOk) {
        return { ok: false, json: async () => ({ error: { message: 'Upload failed' } }) }
      }
      return {
        ok: true,
        json: async () => ({
          id: 'file-id-abc',
          name: 'test.pdf',
          webViewLink: 'https://drive.google.com/file/d/file-id-abc/view',
          webContentLink: 'https://drive.google.com/uc?id=file-id-abc',
          size: '2048',
        }),
      }
    }

    if (urlStr.includes('/permissions') && method === 'POST') {
      if (!permissionsOk) {
        return { ok: false, json: async () => ({ error: { message: 'Permission denied' } }) }
      }
      return { ok: true, json: async () => ({ id: 'anyone', role: 'reader', type: 'anyone' }) }
    }

    // DELETE for deleteFromGoogleDrive
    if (method === 'DELETE') {
      if (!deleteOk) {
        return { ok: false, status: 500, json: async () => ({ error: { message: 'Delete failed' } }) }
      }
      return { ok: true, status: 204, json: async () => ({}) }
    }

    return { ok: false, json: async () => ({ error: { message: 'unexpected call' } }) }
  })

  global.FileReader = class {
    readAsArrayBuffer(_file) {
      this.result = new ArrayBuffer(2048)
      Promise.resolve().then(() => {
        if (this.onload) this.onload({ target: this })
      })
    }
  }

  global.btoa = (str) => Buffer.from(str, 'binary').toString('base64')

  global.window = global.window || {}
  global.window.google = {
    accounts: {
      oauth2: {
        initTokenClient: vi.fn(({ callback }) => ({
          requestAccessToken: () => {
            callback({ access_token: 'fake-token' })
          },
        })),
        revoke: vi.fn(),
      },
    },
  }
}

// ─── 4.2 Return value preservation ───────────────────────────────────────────

describe('4.2 — uploadToGoogleDrive (OAuth) return value preservation', () => {
  let uploadToGoogleDrive

  beforeEach(async () => {
    setupMocks()
    vi.resetModules()
    const mod = await import('../lib/googleDriveOAuth.js')
    uploadToGoogleDrive = mod.uploadToGoogleDrive
  })

  it('resolves with { fileId, url, size } after a successful upload', async () => {
    const file = { name: 'result.pdf', type: 'application/pdf', size: 2048 }
    const metadata = { testName: 'CBC', patientId: 'p-001', testDate: '2025-01-15' }

    const result = await uploadToGoogleDrive(file, metadata)

    expect(result).toHaveProperty('fileId')
    expect(result).toHaveProperty('url')
    expect(result).toHaveProperty('size')
    expect(result.fileId).toBe('file-id-abc')
    expect(result.url).toBe('https://drive.google.com/file/d/file-id-abc/view')
    // size comes from result.size (Drive API) or falls back to file.size
    expect(result.size).toBeTruthy()
  })

  it('still resolves with { fileId, url, size } even when the permissions call fails', async () => {
    // Permission failure should NOT cause the upload to reject
    setupMocks({ permissionsOk: false })
    vi.resetModules()
    const mod = await import('../lib/googleDriveOAuth.js')
    uploadToGoogleDrive = mod.uploadToGoogleDrive

    const file = { name: 'result.pdf', type: 'application/pdf', size: 2048 }
    const metadata = { testName: 'Urinalysis', patientId: 'p-002', testDate: '2025-01-16' }

    // Should resolve, not reject
    const result = await uploadToGoogleDrive(file, metadata)

    expect(result).toHaveProperty('fileId', 'file-id-abc')
    expect(result).toHaveProperty('url')
    expect(result).toHaveProperty('size')
  })

  it('rejects when the upload itself fails', async () => {
    setupMocks({ uploadOk: false })
    vi.resetModules()
    const mod = await import('../lib/googleDriveOAuth.js')
    uploadToGoogleDrive = mod.uploadToGoogleDrive

    const file = { name: 'result.pdf', type: 'application/pdf', size: 2048 }
    const metadata = { testName: 'X-Ray', patientId: 'p-003', testDate: '2025-01-17' }

    await expect(uploadToGoogleDrive(file, metadata)).rejects.toThrow()
  })
})

// ─── 4.3 File validation behavior ────────────────────────────────────────────
//
// NOTE: googleDriveOAuth.js has NO built-in file validation.
// Validation (PDF-only, 10MB limit) lives in LabResults.jsx handleFileSelect.
// These tests confirm the CURRENT behavior of uploadToGoogleDrive:
// it accepts any file object passed to it without throwing a validation error.
// This is the correct behavior to preserve — the UI layer owns validation.

describe('4.3 — File validation behavior (no built-in validation in uploadToGoogleDrive)', () => {
  let uploadToGoogleDrive

  beforeEach(async () => {
    setupMocks()
    vi.resetModules()
    const mod = await import('../lib/googleDriveOAuth.js')
    uploadToGoogleDrive = mod.uploadToGoogleDrive
  })

  it('does NOT throw a validation error for a non-PDF file (validation is in the UI layer)', async () => {
    // The function itself does not validate file type — LabResults.jsx does
    const nonPdfFile = { name: 'image.png', type: 'image/png', size: 1024 }
    const metadata = { testName: 'Scan', patientId: 'p-004', testDate: '2025-01-18' }

    // Should resolve (no built-in type validation in uploadToGoogleDrive)
    const result = await uploadToGoogleDrive(nonPdfFile, metadata)
    expect(result).toHaveProperty('fileId')
  })

  it('does NOT throw a validation error for a file over 10MB (validation is in the UI layer)', async () => {
    // The function itself does not validate file size — LabResults.jsx does
    const largeFile = { name: 'large.pdf', type: 'application/pdf', size: 15 * 1024 * 1024 }
    const metadata = { testName: 'MRI', patientId: 'p-005', testDate: '2025-01-19' }

    // Should resolve (no built-in size validation in uploadToGoogleDrive)
    const result = await uploadToGoogleDrive(largeFile, metadata)
    expect(result).toHaveProperty('fileId')
  })
})

// ─── 4.4 deleteFromGoogleDrive preservation ───────────────────────────────────

describe('4.4 — deleteFromGoogleDrive behavior preservation', () => {
  let deleteFromGoogleDrive

  beforeEach(async () => {
    setupMocks()
    vi.resetModules()
    const mod = await import('../lib/googleDriveOAuth.js')
    deleteFromGoogleDrive = mod.deleteFromGoogleDrive
  })

  it('calls the Drive DELETE endpoint with the correct fileId', async () => {
    const fileId = 'file-to-delete-xyz'

    await deleteFromGoogleDrive(fileId)

    const deleteCalls = global.fetch.mock.calls.filter(
      ([url, opts]) => String(url).includes(fileId) && (opts?.method || 'GET').toUpperCase() === 'DELETE'
    )
    expect(deleteCalls.length).toBe(1)
    expect(String(deleteCalls[0][0])).toContain(fileId)
  })

  it('resolves without error on a successful delete', async () => {
    await expect(deleteFromGoogleDrive('file-id-ok')).resolves.not.toThrow()
  })

  it('throws when the delete request fails (non-404 error)', async () => {
    setupMocks({ deleteOk: false })
    vi.resetModules()
    const mod = await import('../lib/googleDriveOAuth.js')
    deleteFromGoogleDrive = mod.deleteFromGoogleDrive

    await expect(deleteFromGoogleDrive('file-id-bad')).rejects.toThrow()
  })

  it('does NOT call any permissions endpoint during delete', async () => {
    await deleteFromGoogleDrive('file-id-check')

    const permCalls = global.fetch.mock.calls.filter(([url]) =>
      String(url).includes('/permissions')
    )
    expect(permCalls.length).toBe(0)
  })
})
