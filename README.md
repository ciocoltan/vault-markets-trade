# ScopeMarket

A web application that provides a platform for users to buy and sell goods. It features a Node.js and Express backend with a simple HTML-based frontend. The application includes APIs for user authentication, user management, and KYC (Know Your Customer) processes.

## Installation

To get started with ScopeMarket, clone the repository and install the dependencies:

```bash
git clone https://github.com/your-username/scopemarket.git
cd scopemarket
npm install
```

### Environment Variables

Create a `.env` file in the root directory and add the following environment variables:

```
PORT=3001
CRM_API_BASE_URL=
CRM_API_KEY=
COOKIE_SESSION_KEY=
AES_SECRET_KEY=
AES_IV=
CACHE_DURATION_HOURS=720
SUMSUB_APP_TOKEN=
SUMSUB_SECRET_KEY=
RECAPTCHA_PROJECT_ID=
RECAPTCHA_SITE_KEY=
GCLOUD_CLIENT_EMAIL=
GCLOUD_PRIVATE_KEY=
```

## Usage

To start the development server, run the following command:

```bash
npm run dev
```

This will start both the frontend and backend servers concurrently. The frontend will be available at `http://localhost:8080` and the backend at `http://localhost:3000`.

## Available Scripts

- `start`: Starts the production server.
- `dev:backend`: Starts the backend server with nodemon for development.
- `build`: Builds the frontend application.
- `start:dev`: Starts the webpack dev server.
- `dev`: Starts both the frontend and backend servers concurrently.
- `heroku-postbuild`: Builds the application for Heroku deployment.

## Project Structure

```
.
├── frontend/
├── src/
│   ├── api/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── services/
│   ├── config/
│   └── utils/
├── index.js
├── package-lock.json
├── package.json
└── webpack.config.js
```

- **frontend/**: Contains the static frontend files (HTML, CSS, JS).
- **src/**: Contains the backend source code.
  - **api/**: Holds the API route definitions, controllers, middleware, and services.
  - **config/**: Contains configuration files, like environment variable setup.
  - **utils/**: Contains utility functions used across the application.

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint          | Description                    |
|--------|-------------------|--------------------------------|
| POST   | `/register`       | Registers a new user.          |
| POST   | `/login`          | Logs in a user.                |
| POST   | `/forgot-password`| Sends a password reset link.   |
| POST   | `/logout`         | Logs out the current user.     |
| GET    | `/status`         | Checks user authentication status. |

### KYC (`/api/kyc`)

| Method | Endpoint    | Description                                  |
|--------|-------------|----------------------------------------------|
| POST   | `/token`    | Generates a Sumsub token for KYC verification. |
| POST   | `/webhook`  | Handles webhooks from the KYC provider.      |
| POST   | `/status`   | Gets the current KYC status of the user.     |

### User (`/api/user`)

| Method | Endpoint                      | Description                                      |
|--------|-------------------------------|--------------------------------------------------|           |
| POST   | `/questionnaire`              | Submit answers for a questionnaire.              |
| POST   | `/progress`                   | Get the user's progress.                         |

## Dependencies

### Backend

- `@google-cloud/recaptcha-enterprise`: Google Cloud Recaptcha Enterprise API client library.
- `axios`: Promise based HTTP client for the browser and node.js.
- `cookie-parser`: Parse Cookie header and populate `req.cookies` with an object keyed by the cookie names.
- `cors`: Enable CORS with various options.
- `dotenv`: Loads environment variables from a `.env` file into `process.env`.
- `express`: Fast, unopinionated, minimalist web framework for Node.js.
- `express-rate-limit`: Basic rate-limiting middleware for Express.
- `express-validator`: An express.js middleware for validator.js.
- `helmet`: Help secure Express apps by setting various HTTP headers.
- `jsonwebtoken`: JSON Web Token implementation for node.js.
- `validator`: A library of string validators and sanitizers.

### Development

- `@babel/core`: Babel compiler core.
- `@babel/preset-env`: A Babel preset for each environment.
- `babel-loader`: This package allows transpiling JavaScript files using Babel and webpack.
- `concurrently`: Run multiple commands concurrently.
- `css-loader`: CSS loader for webpack.
- `html-webpack-plugin`: Simplifies creation of HTML files to serve your webpack bundles.
- `nodemon`: Monitor for any changes in your node.js application and automatically restart the server.
- `style-loader`: Style loader for webpack.
- `webpack`: A static module bundler for modern JavaScript applications.
- `webpack-cli`: Webpack's command-line interface.
- `webpack-dev-server`: Use webpack with a development server that provides live reloading.
