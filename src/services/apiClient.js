// services/apiClient.js
const axios = require("axios");
const apiConfig = require("../config/apiConfig");
const logger = require("../utils/logger"); // Optional: custom logger for error tracking

class ApiClient {
  constructor() {
    this.client = axios.create({
      baseURL: apiConfig.baseURL,
      timeout: apiConfig.timeout,
      headers: apiConfig.defaultHeaders,
    });
  }

  // Function to set JWT token in headers
  setAuthorizationHeader(token) {
    this.client.defaults.headers["Authorization"] = `Bearer ${token}`;
  }

  // Function to make GET requests
  async get(endpoint, config = {}) {
    try {
      const response = await this.client.get(endpoint, config);
      return response.data;
    } catch (error) {
      this.handleError(error, "GET", endpoint);
    }
  }

  // Function to make POST requests
  async post(endpoint, data, config = {}) {
    try {
      const response = await this.client.post(endpoint, data, config);
      return response.data;
    } catch (error) {
      this.handleError(error, "POST", endpoint);
    }
  }

  // Function to handle errors
  handleError(error, method, endpoint) {
    // Log error
    logger.error(`${method} request to ${endpoint} failed: ${error.message}`);

    // Customize error handling based on the status code or other conditions
    if (error.response) {
      // The request was made and the server responded with a status code
      logger.error(`Response status: ${error.response.status}`);
    } else if (error.request) {
      // The request was made but no response was received
      logger.error("No response received");
    } else {
      // Something else happened
      logger.error(`Error setting up request: ${error.message}`);
    }

    throw new Error(`API Error in ${method} ${endpoint}: ${error.message}`);
  }
}

module.exports = new ApiClient();
