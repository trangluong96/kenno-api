const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Simple hash function for passwords
const hashPassword = (password) => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Simple password reset - verify email and old password, then set new password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;

    if (!email || !oldPassword || !newPassword) {
      return res.status(400).json({
        error: 'Email, old password, and new password are required',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long',
      });
    }

    // For testing purposes, we'll simulate a user
    // In production, this would check HubDB
    if (email === 'test@example.com' && oldPassword === 'oldpassword123') {
      const hashedNewPassword = hashPassword(newPassword);
      console.log(`Password updated for ${email}: ${hashedNewPassword}`);

      res.json({ message: 'Password reset successfully' });
    } else {
      res.status(400).json({ error: 'Invalid email or old password' });
    }
  } catch (error) {
    console.error('Error in reset password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password (for authenticated users)
app.post('/api/auth/change-password', async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Email, current password, and new password are required',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long',
      });
    }

    // For testing purposes, we'll simulate a user
    if (email === 'test@example.com' && currentPassword === 'oldpassword123') {
      const hashedNewPassword = hashPassword(newPassword);
      console.log(`Password changed for ${email}: ${hashedNewPassword}`);

      res.json({ message: 'Password changed successfully' });
    } else {
      res.status(400).json({ error: 'Invalid email or current password' });
    }
  } catch (error) {
    console.error('Error in change password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`\nTest credentials:`);
  console.log(`Email: test@example.com`);
  console.log(`Old password: oldpassword123`);
  console.log(`New password: any 8+ character password`);
});
