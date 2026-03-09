# RCMC EMR - Backend API Server

Backend API for handling Google Drive uploads and PDF compression.

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`)

3. Add your Google credentials JSON file

4. Start the server:
```bash
npm start
```

## API Endpoints

### Health Check
```
GET /health
```
Returns server status

### Upload Lab Result
```
POST /api/upload/lab-result
```
Body: FormData with file and metadata
- `file`: PDF file (max 10MB)
- `patientId`: Patient ID
- `testName`: Test name
- `testDate`: Test date

Returns:
```json
{
  "success": true,
  "fileId": "google-drive-file-id",
  "url": "https://drive.google.com/...",
  "originalSize": 2500000,
  "compressedSize": 850000,
  "compressionRatio": "66.0"
}
```

### Delete Lab Result
```
DELETE /api/upload/lab-result/:fileId
```
Deletes file from Google Drive

## Environment Variables

- `PORT` - Server port (default: 3003)
- `GOOGLE_DRIVE_FOLDER_ID` - Google Drive folder ID
- `GOOGLE_SERVICE_ACCOUNT_PATH` - Path to credentials JSON
- `FRONTEND_URL` - Frontend URL for CORS

## File Structure

```
server/
├── index.js              # Main server file
├── routes/
│   └── upload.js         # Upload routes
├── services/
│   ├── googleDrive.js    # Google Drive API
│   └── pdfCompressor.js  # PDF compression
├── .env                  # Environment variables (not in Git)
├── google-credentials.json  # Google credentials (not in Git)
└── package.json          # Dependencies
```

## Security

- Credentials stored server-side only
- CORS configured for frontend only
- File size limits enforced
- PDF-only uploads
- All sensitive files in .gitignore

## Development

Auto-restart on changes:
```bash
npm run dev
```

## Production

Deploy to:
- Heroku
- Railway
- Render
- DigitalOcean
- Any Node.js hosting

Remember to:
1. Set environment variables
2. Upload credentials securely
3. Update frontend API URL
