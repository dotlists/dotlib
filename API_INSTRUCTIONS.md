# DotList API Documentation

Welcome to the DotList API! This document provides instructions on how to use the available HTTP endpoints.

## Authentication

All protected endpoints require a developer API key for access.

### Getting Your API Key

The API key is stored as a `DEV_API_KEY` environment variable in the project's Vercel and Convex dashboards. You can find the key there.

### Making Authenticated Requests

To authenticate your requests, you must include an `X-API-KEY` header with your API key as the value.

---

## Endpoints

### Health Check

A public endpoint to verify that the API is running.

-   **Method:** `GET`
-   **URL:** `/api/health`
-   **Authentication:** None

**Example Request:**

```bash
curl "https://[your-project-url].vercel.app/api/health"
```

### Get User Information

Retrieves public information for a specific user by their username.

-   **Method:** `GET`
-   **URL:** `/api/user`
-   **Authentication:** `DEV_API_KEY` required.
-   **Query Parameters:**
    -   `username` (string, required): The username of the user to retrieve.

**Example Request:**

```bash
curl "https://[your-project-url].vercel.app/api/user?username=someuser" \
-H "X-API-KEY: [your_dev_api_key_here]"
```

**Example Response:**

```json
{
  "username": "someuser",
  "userId": "a1b2c3d4e5f6"
}
```

### Get Total User Count

Retrieves the total number of registered users.

-   **Method:** `GET`
-   **URL:** `/api/users`
-   **Authentication:** `DEV_API_KEY` required.

**Example Request:**

```bash
curl "https://[your-project-url].vercel.app/api/users" \
-H "X-API-KEY: [your_dev_api_key_here]"
```

**Example Response:**

```json
{
  "totalUsers": 123
}
```
