/**
 * Kenno Project - Password Reset Client
 * This file contains functions to interact with the Kenno API for password reset functionality
 * Designed to work with HubSpot theme structure
 */

class KennoPasswordResetClient {
  constructor(baseURL = "https://your-vercel-domain.vercel.app") {
    this.baseURL = baseURL;
    this.apiEndpoints = {
      requestReset: "/api/auth/request-reset-password",
      confirmReset: "/api/auth/confirm-reset-password",
      verifyToken: "/api/auth/verify-reset-token",
    };
  }

  /**
   * Request a password reset
   * @param {string} email - User's email address
   * @returns {Promise<Object>} Response from the API
   */
  async requestPasswordReset(email) {
    try {
      const response = await fetch(
        `${this.baseURL}${this.apiEndpoints.requestReset}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to request password reset");
      }

      return {
        success: true,
        data,
        message: "Password reset email sent successfully",
      };
    } catch (error) {
      console.error("Error requesting password reset:", error);
      return {
        success: false,
        error: error.message,
        message: "Failed to request password reset",
      };
    }
  }

  /**
   * Verify a reset token
   * @param {string} token - Reset token from email
   * @returns {Promise<Object>} Response from the API
   */
  async verifyResetToken(token) {
    try {
      const response = await fetch(
        `${this.baseURL}${this.apiEndpoints.verifyToken}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid reset token");
      }

      return {
        success: true,
        data,
        message: "Token is valid",
      };
    } catch (error) {
      console.error("Error verifying reset token:", error);
      return {
        success: false,
        error: error.message,
        message: "Failed to verify reset token",
      };
    }
  }

  /**
   * Confirm password reset with new password
   * @param {string} token - Reset token from email
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Response from the API
   */
  async confirmPasswordReset(token, newPassword) {
    try {
      const response = await fetch(
        `${this.baseURL}${this.apiEndpoints.confirmReset}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token, newPassword }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      return {
        success: true,
        data,
        message: "Password reset successfully",
      };
    } catch (error) {
      console.error("Error confirming password reset:", error);
      return {
        success: false,
        error: error.message,
        message: "Failed to reset password",
      };
    }
  }

  /**
   * Complete password reset flow
   * @param {string} email - User's email
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Response from the API
   */
  async completePasswordReset(email, token, newPassword) {
    try {
      // First verify the token
      const verifyResult = await this.verifyResetToken(token);
      if (!verifyResult.success) {
        return verifyResult;
      }

      // Then confirm the password reset
      const confirmResult = await this.confirmPasswordReset(token, newPassword);
      return confirmResult;
    } catch (error) {
      console.error("Error completing password reset:", error);
      return {
        success: false,
        error: error.message,
        message: "Failed to complete password reset",
      };
    }
  }
}

// HubSpot Theme Integration - Password Reset Form Component
class KennoPasswordResetForm {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      baseURL: "https://your-vercel-domain.vercel.app",
      ...options,
    };
    this.client = new KennoPasswordResetClient(this.options.baseURL);
    this.currentStep = "request"; // 'request', 'verify', 'confirm'
    this.resetToken = null;
    this.userEmail = null;

    this.init();
  }

  init() {
    if (!this.container) {
      console.error("Container not found:", this.containerId);
      return;
    }

    this.render();
    this.bindEvents();
  }

  render() {
    switch (this.currentStep) {
      case "request":
        this.renderRequestForm();
        break;
      case "verify":
        this.renderVerifyForm();
        break;
      case "confirm":
        this.renderConfirmForm();
        break;
    }
  }

  renderRequestForm() {
    this.container.innerHTML = `
      <div class="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">Reset Password</h2>
        <form id="request-reset-form">
          <div class="mb-4">
            <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email address"
            />
          </div>
          <button
            type="submit"
            id="request-reset-btn"
            class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Send Reset Link
          </button>
        </form>
        <div id="request-message" class="mt-4"></div>
      </div>
    `;
  }

  renderVerifyForm() {
    this.container.innerHTML = `
      <div class="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">Verify Reset Token</h2>
        <div class="text-center mb-6">
          <p class="text-gray-600">We've sent a reset link to:</p>
          <p class="font-semibold text-gray-900">${this.userEmail}</p>
        </div>
        <form id="verify-token-form">
          <div class="mb-4">
            <label for="token" class="block text-sm font-medium text-gray-700 mb-2">
              Reset Token
            </label>
            <input
              type="text"
              id="token"
              name="token"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter the token from your email"
            />
          </div>
          <button
            type="submit"
            id="verify-token-btn"
            class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Verify Token
          </button>
        </form>
        <div id="verify-message" class="mt-4"></div>
        <button
          id="back-to-request"
          class="w-full mt-3 text-blue-600 hover:text-blue-800 underline"
        >
          ← Back to email input
        </button>
      </div>
    `;
  }

  renderConfirmForm() {
    this.container.innerHTML = `
      <div class="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">Set New Password</h2>
        <form id="confirm-reset-form">
          <div class="mb-4">
            <label for="new-password" class="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <input
              type="password"
              id="new-password"
              name="new-password"
              required
              minlength="8"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your new password"
            />
            <p class="text-xs text-gray-500 mt-1">Password must be at least 8 characters long</p>
          </div>
          <div class="mb-4">
            <label for="confirm-password" class="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirm-password"
              name="confirm-password"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Confirm your new password"
            />
          </div>
          <button
            type="submit"
            id="confirm-reset-btn"
            class="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
          >
            Reset Password
          </button>
        </form>
        <div id="confirm-message" class="mt-4"></div>
      </div>
    `;
  }

  bindEvents() {
    // Request form events
    const requestForm = document.getElementById("request-reset-form");
    if (requestForm) {
      requestForm.addEventListener(
        "submit",
        this.handleRequestSubmit.bind(this)
      );
    }

    // Verify form events
    const verifyForm = document.getElementById("verify-token-form");
    if (verifyForm) {
      verifyForm.addEventListener("submit", this.handleVerifySubmit.bind(this));
    }

    // Confirm form events
    const confirmForm = document.getElementById("confirm-reset-form");
    if (confirmForm) {
      confirmForm.addEventListener(
        "submit",
        this.handleConfirmSubmit.bind(this)
      );
    }

    // Back button
    const backBtn = document.getElementById("back-to-request");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        this.currentStep = "request";
        this.render();
        this.bindEvents();
      });
    }
  }

  async handleRequestSubmit(e) {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const messageDiv = document.getElementById("request-message");
    const submitBtn = document.getElementById("request-reset-btn");

    if (!email) {
      this.showMessage(messageDiv, "Please enter your email address", "error");
      return;
    }

    // Disable button and show loading
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";
    this.showMessage(messageDiv, "Sending reset link...", "info");

    try {
      const result = await this.client.requestPasswordReset(email);

      if (result.success) {
        this.userEmail = email;
        this.currentStep = "verify";
        this.render();
        this.bindEvents();
      } else {
        this.showMessage(messageDiv, result.message, "error");
      }
    } catch (error) {
      this.showMessage(
        messageDiv,
        "An error occurred. Please try again.",
        "error"
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send Reset Link";
    }
  }

  async handleVerifySubmit(e) {
    e.preventDefault();
    const token = document.getElementById("token").value;
    const messageDiv = document.getElementById("verify-message");
    const submitBtn = document.getElementById("verify-token-btn");

    if (!token) {
      this.showMessage(messageDiv, "Please enter the reset token", "error");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Verifying...";
    this.showMessage(messageDiv, "Verifying token...", "info");

    try {
      const result = await this.client.verifyResetToken(token);

      if (result.success) {
        this.resetToken = token;
        this.currentStep = "confirm";
        this.render();
        this.bindEvents();
      } else {
        this.showMessage(messageDiv, result.message, "error");
      }
    } catch (error) {
      this.showMessage(
        messageDiv,
        "An error occurred. Please try again.",
        "error"
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Verify Token";
    }
  }

  async handleConfirmSubmit(e) {
    e.preventDefault();
    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;
    const messageDiv = document.getElementById("confirm-message");
    const submitBtn = document.getElementById("confirm-reset-btn");

    if (!newPassword || !confirmPassword) {
      this.showMessage(messageDiv, "Please fill in all fields", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      this.showMessage(messageDiv, "Passwords do not match", "error");
      return;
    }

    if (newPassword.length < 8) {
      this.showMessage(
        messageDiv,
        "Password must be at least 8 characters long",
        "error"
      );
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Resetting...";
    this.showMessage(messageDiv, "Resetting password...", "info");

    try {
      const result = await this.client.confirmPasswordReset(
        this.resetToken,
        newPassword
      );

      if (result.success) {
        this.showMessage(
          messageDiv,
          "Password reset successfully! You can now login with your new password.",
          "success"
        );
        submitBtn.textContent = "Password Reset!";
        submitBtn.classList.remove("bg-green-600", "hover:bg-green-700");
        submitBtn.classList.add("bg-gray-400", "cursor-not-allowed");

        // Redirect to login after 3 seconds
        setTimeout(() => {
          window.location.href = "/login";
        }, 3000);
      } else {
        this.showMessage(messageDiv, result.message, "error");
      }
    } catch (error) {
      this.showMessage(
        messageDiv,
        "An error occurred. Please try again.",
        "error"
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Reset Password";
    }
  }

  showMessage(element, message, type) {
    if (!element) return;

    const colors = {
      success: "text-green-700 bg-green-100 border-green-300",
      error: "text-red-700 bg-red-100 border-red-300",
      info: "text-blue-700 bg-blue-100 border-blue-300",
    };

    element.innerHTML = `
      <div class="p-3 rounded-md border ${colors[type]}">
        ${message}
      </div>
    `;
  }
}

// HubSpot Theme Integration - Auto-initialize if container exists
document.addEventListener("DOMContentLoaded", () => {
  // Check if we're on a password reset page
  const resetContainer = document.getElementById("kenno-password-reset");
  if (resetContainer) {
    new KennoPasswordResetForm("kenno-password-reset");
  }

  // Check if we have a reset token in URL (for direct reset links)
  const urlParams = new URLSearchParams(window.location.search);
  const resetToken = urlParams.get("token");

  if (resetToken && resetContainer) {
    // Auto-verify token and show confirm form
    const form = new KennoPasswordResetForm("kenno-password-reset");
    form.resetToken = resetToken;
    form.currentStep = "confirm";
    form.render();
    form.bindEvents();
  }
});

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    KennoPasswordResetClient,
    KennoPasswordResetForm,
  };
}

// Export for ES6 modules
if (typeof exports !== "undefined") {
  exports.KennoPasswordResetClient = KennoPasswordResetClient;
  exports.KennoPasswordResetForm = KennoPasswordResetForm;
}
