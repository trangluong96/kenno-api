const axios = require("axios");

// HubDB API configuration
const HUBDB_API_URL = "https://api.hubapi.com/cms/v3/hubdb";
const HUBDB_TABLE_ID = process.env.HUBSPOT_TABLE;
const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;

if (!HUBDB_TABLE_ID || !HUBSPOT_ACCESS_TOKEN) {
  console.error("HUBSPOT_TABLE and HUBSPOT_ACCESS_TOKEN must be set");
  // Return a function that handles missing environment variables
  module.exports = async (req, res) => {
    res.status(500).json({
      error: "Server configuration error: HubSpot credentials not configured",
    });
  };
  return;
}

// Utility functions
const hashPassword = (password) => {
  // Simple hash function - in production, use a proper crypto library
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
};

const getUserByEmail = async (email) => {
  try {
    // First try to get from draft (where password updates are stored)
    const draftResponse = await axios.get(
      `${HUBDB_API_URL}/tables/${HUBDB_TABLE_ID}/rows/draft`,
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        params: {
          email: email,
        },
      }
    );

    if (draftResponse.data.results.length > 0) {
      const row = draftResponse.data.results[0];
      return {
        id: row.id,
        email: row.values.email,
        password: row.values.password,
        name: row.values.name,
      };
    }

    // If not found in draft, try published version
    const publishedResponse = await axios.get(
      `${HUBDB_API_URL}/tables/${HUBDB_TABLE_ID}/rows`,
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        params: {
          email: email,
        },
      }
    );

    if (publishedResponse.data.results.length > 0) {
      const row = publishedResponse.data.results[0];
      return {
        id: row.id,
        email: row.values.email,
        password: row.values.password,
        name: row.values.name,
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
};

const updateUser = async (userId, updates) => {
  try {
    console.log("Updating user:", userId, "with data:", updates);
    const response = await axios.patch(
      `${HUBDB_API_URL}/tables/${HUBDB_TABLE_ID}/rows/${userId}/draft`,
      { values: updates },
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Update successful:", response.data);
    return true;
  } catch (error) {
    console.error(
      "Error updating user:",
      error.response?.data || error.message
    );
    return false;
  }
};

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, oldPassword, newPassword } = req.body;

    if (!email || !oldPassword || !newPassword) {
      return res.status(400).json({
        error: "Email, current Password, and new Password are required",
      });
    }

    // Find user by email
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // Verify old password - handle both hashed and plain text formats
    const hashedOldPassword = hashPassword(oldPassword);
    console.log("Debug - Stored password:", user.password);
    console.log("Debug - Provided password:", oldPassword);
    console.log("Debug - Hashed provided password:", hashedOldPassword);

    if (user.password !== hashedOldPassword) {
      // If not hashed, check if stored password is plain text (for backward compatibility)
      if (user.password !== oldPassword) {
        console.log(
          "Debug - Password mismatch: stored=",
          user.password,
          "provided=",
          oldPassword,
          "hashed=",
          hashedOldPassword
        );
        return res.status(400).json({ error: "Invalid current password" });
      }
      // If it's plain text, we'll convert it to hashed format with the new password
      console.log("Current password was plain text, converting to hash format");
    }

    // Hash the new password
    const hashedPassword = hashPassword(newPassword);

    // Update user password
    const success = await updateUser(user.id, { password: hashedPassword });

    if (!success) {
      return res.status(500).json({
        error: "Failed to update password",
      });
    }

    res.status(200).json({
      message: "Password updated successfully",
      userId: user.id,
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};
