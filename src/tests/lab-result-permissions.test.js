/**
 * Exploratory test for Task 1.1
 * Tests that uploadToGoogleDrive in src/lib/googleDriveOAuth.js
 * makes a permissions POST after upload.
 *
 * This test is EXPECTED TO FAIL on unfixed code — that failure confirms the bug.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock the entire googleDriveOAuth module ──────────────────────────────────
// We re-implement only the parts we need so getAccessToken is fully controlled.
// The real uploadToGoogleDrive is imported separately via a factory approach.

describe('uploadToGoogleDrive (OAuth) — permissions bug exploration', () => {
  let fetchCalls = []
  let uploadToGoogleDrive

  beforeEach(async () => {
    fetchCalls = []

    // Track every fetch call
    global.fetch = vi.fn(async (url, options) => {
      const call = { url: String(url), method: (options?.method || 'GET').toUpperCase(), body: options?.body }
      fetchCalls.push(call)

      // Simulate successful upload response
      if (call.url.includes('/upload/drive/v3/files')) {
        return {
          ok: true,
          json: async () => ({
            id: 'fake-file-id-123',
            name: 'test-lab-result.pdf',
            webViewLink: 'https://drive.google.com/file/d/fake-file-id-123/view',
            webContentLink: 'https://drive.google.com/uc?id=fake-file-id-123',
            size: '1024',
          }),
        }
      }

      // Simulate permissions endpoint response
      if (call.url.includes('/permissions')) {
        return {
          ok: true,
          json: async () => ({ id: 'anyone', role: 'reader', type: 'anyone' }),
        }
      }

      return { ok: false, json: async () => ({ error: { message: 'unexpected call' } }) }
    })

    // Mock FileReader to synchronously return a buffer
    global.FileReader = class {
      readAsArrayBuffer(_file) {
        this.result = new ArrayBuffer(1024)
        // Call onload asynchronously
        Promise.resolve().then(() => {
          if (this.onload) this.onload({ target: this })
        })
      }
    }

    // Provide btoa in jsdom
    global.btoa = (str) => Buffer.from(str, 'binary').toString('base64')

    // Stub window.google so getAccessToken resolves immediately with a fake token
    global.window = global.window || {}
    global.window.google = {
      accounts: {
        oauth2: {
          initTokenClient: vi.fn(({ callback }) => ({
            requestAccessToken: () => {
              // Immediately invoke callback with a fake token
              callback({ access_token: 'fake-access-token' })
            },
          })),
          revoke: vi.fn(),
        },
      },
    }

    // Reset module registry so each test gets a fresh module instance
    // (avoids cached accessToken from previous test)
    vi.resetModules()

    // Import the real module after mocks are in place
    const mod = await import('../lib/googleDriveOAuth.js')
    uploadToGoogleDrive = mod.uploadToGoogleDrive
  })

  it('1.1 — should make a POST to the permissions endpoint after a successful upload', async () => {
    const fakeFile = {
      name: 'test-lab-result.pdf',
      type: 'application/pdf',
      size: 1024,
    }
    const metadata = {
      testName: 'CBC',
      patientId: 'patient-001',
      testDate: '2025-01-15',
    }

    await uploadToGoogleDrive(fakeFile, metadata)

    // Find all fetch calls to the permissions endpoint
    const permissionsCalls = fetchCalls.filter(
      (c) => c.url.includes('/permissions') && c.method === 'POST'
    )

    // This assertion FAILS on unfixed code because no permissions call is made
    expect(permissionsCalls.length).toBeGreaterThan(0)

    // Also verify the permissions call targets the correct file ID
    if (permissionsCalls.length > 0) {
      expect(permissionsCalls[0].url).toContain('fake-file-id-123')
    }
  })

  it('1.1b — permissions body should set role=reader and type=anyone', async () => {
    const fakeFile = {
      name: 'test-lab-result.pdf',
      type: 'application/pdf',
      size: 1024,
    }
    const metadata = { testName: 'Urinalysis', patientId: 'patient-002', testDate: '2025-01-16' }

    await uploadToGoogleDrive(fakeFile, metadata)

    const permissionsCalls = fetchCalls.filter(
      (c) => c.url.includes('/permissions') && c.method === 'POST'
    )

    // This assertion FAILS on unfixed code
    expect(permissionsCalls.length).toBeGreaterThan(0)

    if (permissionsCalls.length > 0) {
      const body = JSON.parse(permissionsCalls[0].body)
      expect(body).toMatchObject({ role: 'reader', type: 'anyone' })
    }
  })
})
