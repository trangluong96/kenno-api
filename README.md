# Kenno API Server

Express.js API server for HubSpot CMS integration, providing password reset functionality.

## Features

- **Password Reset API**: Verify email and old password, then set new password
- **Password Change API**: Change passwords for authenticated users
- **HubDB Integration**: Seamlessly integrates with HubSpot's HubDB API
- **Security**: Secure password hashing and validation
- **CORS Support**: Cross-origin requests enabled
- **Vercel Ready**: Optimized for Vercel deployment

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Required environment variables:
- `HUBSPOT_ACCESS_TOKEN`: Your HubSpot API access token
- `HUBSPOT_TABLE`: Your HubDB table ID
- `PORT`: Server port (default: 3001)

### 3. Run Locally

```bash
# Development mode with auto-reload
npm run dev

# Or run the TypeScript version
npm run serve:dev
```

### 4. Test the API

```bash
npm test
```

## API Endpoints

### Health Check
- **GET** `/health`
- Returns server status

### Reset Password
- **POST** `/api/auth/reset-password`
- **Body**: `{ "email": "user@example.com", "oldPassword": "oldpass", "newPassword": "newpass" }`
- Verifies email and old password, then sets new password

### Change Password
- **POST** `/api/auth/change-password`
- **Body**: `{ "email": "user@example.com", "currentPassword": "oldpass", "newPassword": "newpass" }`
- Changes password for authenticated users

## Deployment

### Vercel Deployment

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Set Environment Variables**:
   ```bash
   vercel env add HUBSPOT_ACCESS_TOKEN
   vercel env add HUBSPOT_TABLE
   ```

4. **Update Frontend**: Update your HubSpot CMS frontend to use the Vercel URL instead of localhost.

### Environment Variables for Production

Set these in your Vercel dashboard or via CLI:
- `HUBSPOT_ACCESS_TOKEN`: Your HubSpot private app access token
- `HUBSPOT_TABLE`: Your HubDB table ID (e.g., "583222995")

## HubDB Configuration

The server is configured to work with HubSpot HubDB tables. Ensure your table has these columns:
- `email`: User's email address
- `password`: Hashed password
- `name`: User's name (optional)

## Security Features

- **Password Verification**: Old password must be correct
- **Password Hashing**: Passwords are hashed using a simple hash function
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Secure error responses
- **CORS**: Enabled for cross-origin requests

## Development

- **TypeScript**: Full TypeScript support
- **Hot Reload**: Development mode with nodemon
- **Logging**: Comprehensive console logging for debugging
- **Testing**: Built-in test script for API endpoints

## Frontend Integration

Update your HubSpot CMS frontend to use the deployed API URL:

```javascript
const apiUrl = process.env.NODE_ENV === 'production' 
  ? 'https://your-vercel-app.vercel.app/api/auth/reset-password'
  : 'http://localhost:3001/api/auth/reset-password';
```

## Troubleshooting

### Common Issues

1. **HubSpot Access Token Invalid**
   - Verify your token in HubSpot developer settings
   - Check token permissions for HubDB access

2. **HubDB Table Not Found**
   - Verify the table ID in your HubDB settings
   - Ensure the table has the required columns

3. **CORS Issues**
   - CORS is enabled by default
   - Check if your frontend domain is allowed

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` in your environment variables.

## License

ISC
# kenno-api
