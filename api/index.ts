import express from "express";
import cors from "cors";
import dotenv from "dotenv";
// Simple hash function for passwords
import axios from "axios";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// HubDB API configuration
const HUBDB_API_URL = "https://api.hubapi.com/cms/v3/hubdb";
const HUBDB_TABLE_ID = process.env.HUBSPOT_TABLE;
const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;

if (!HUBDB_TABLE_ID || !HUBSPOT_ACCESS_TOKEN) {
  throw new Error("HUBSPOT_TABLE and HUBSPOT_ACCESS_TOKEN must be set");
}

// Interface definitions
interface PortalUser {
  id: string;
  email: string;
  password?: string;
  name?: string;
}

interface HubDBRow {
  id: string;
  values: Record<string, any>;
}

interface HubDBResponse {
  total: number;
  results: HubDBRow[];
}

// Utility functions
const hashPassword = (password: string): string => {
  // Simple hash function - in production, use a proper crypto library
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
};

const getHubDBToken = async (): Promise<string> => {
  if (!HUBSPOT_ACCESS_TOKEN) {
    throw new Error("HubSpot access token not configured");
  }
  return HUBSPOT_ACCESS_TOKEN;
};

// HubDB API functions
const getUserByEmail = async (email: string): Promise<PortalUser | null> => {
  try {
    const token = await getHubDBToken();
    const url = `${HUBDB_API_URL}/tables/${HUBDB_TABLE_ID}/rows`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data: HubDBResponse = response.data;
    const rows: HubDBRow[] = data.results || [];

    // Find user by email
    const userRow = rows.find((row) => {
      const rowEmail =
        row.values?.email ||
        row.values?.["2"]?.value ||
        row.values?.["email"]?.value ||
        row.values?.Email?.value ||
        row.values?.EMAIL?.value;
      return rowEmail === email;
    });

    if (!userRow) {
      return null;
    }

    return {
      id: userRow.id,
      email: userRow.values?.email || "",
      name: userRow.values?.name || "",
      password: userRow.values?.password || "",
    };
  } catch (error) {
    console.error("Error getting user by email:", error);
    throw error;
  }
};

const updateUser = async (
  userId: string,
  userData: Partial<PortalUser>
): Promise<boolean> => {
  try {
    const token = await getHubDBToken();
    const url = `${HUBDB_API_URL}/tables/${HUBDB_TABLE_ID}/rows/${userId}`;

    const response = await axios.patch(
      url,
      {
        values: userData,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.status === 200;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

// Routes

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Simple password reset - verify email and old password, then set new password
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;

    if (!email || !oldPassword || !newPassword) {
      return res.status(400).json({
        error: "Email, old password, and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long",
      });
    }

    // Find user by email
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    // Verify old password - handle both hashed and plain text formats
    const hashedOldPassword = hashPassword(oldPassword);
    if (user.password !== hashedOldPassword) {
      // If not hashed, check if stored password is plain text (for backward compatibility)
      if (user.password !== oldPassword) {
        return res.status(400).json({ error: "Invalid old password" });
      }
      // If it's plain text, we'll convert it to hashed format with the new password
      console.log("Old password was plain text, converting to hash format");
    }

    // Hash new password and update user
    const hashedNewPassword = hashPassword(newPassword);
    await updateUser(user.id, {
      password: hashedNewPassword,
    });

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error in reset password:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Change password (for authenticated users)
app.post("/api/auth/change-password", async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({
        error: "Email, current password, and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long",
      });
    }

    // Find user by email
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    // Verify current password - handle both hashed and plain text formats
    const hashedCurrentPassword = hashPassword(currentPassword);
    if (user.password !== hashedCurrentPassword) {
      // If not hashed, check if stored password is plain text (for backward compatibility)
      if (user.password !== currentPassword) {
        return res.status(400).json({ error: "Invalid current password" });
      }
      // If it's plain text, we'll convert it to hashed format with the new password
      console.log("Current password was plain text, converting to hash format");
    }

    // Hash new password and update user
    const hashedNewPassword = hashPassword(newPassword);
    await updateUser(user.id, {
      password: hashedNewPassword,
    });

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error in change password:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Export for Vercel serverless functions
export default app;

// Start server locally (for development)
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(
      `Reset password: http://localhost:${PORT}/api/auth/reset-password`
    );
    console.log(
      `Change password: http://localhost:${PORT}/api/auth/change-password`
    );
  });
}
