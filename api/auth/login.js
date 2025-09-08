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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    // Find user by email
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    // Hash the provided password and compare with stored hash
    const hashedPassword = hashPassword(password);

    // Check if stored password matches the hashed version
    if (user.password !== hashedPassword) {
      // If not, check if stored password is plain text (for backward compatibility)
      if (user.password !== password) {
        return res.status(401).json({
          error: "Invalid email or password",
        });
      }

      // If it's plain text, update it to hashed format for future logins
      console.log(
        "Converting plain text password to hash for user:",
        user.email
      );
      try {
        const updateResponse = await axios.patch(
          `${HUBDB_API_URL}/tables/${HUBDB_TABLE_ID}/rows/${user.id}/draft`,
          { values: { password: hashedPassword } },
          {
            headers: {
              Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log("Password converted to hash successfully");
      } catch (updateError) {
        console.error("Error converting password to hash:", updateError);
        // Continue with login even if update fails
      }
    }

    // Login successful
    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};
