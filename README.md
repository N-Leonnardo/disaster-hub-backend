# MongoDB Connection Starter

A simple Node.js project to get started with MongoDB using the official MongoDB Node.js driver.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure your MongoDB connection:**
   - Copy `.env.example` to `.env` (if not already created)
   - Open `.env` and replace `<db_password>` with your actual database password
   - Replace `cluster0.xxxxx.mongodb.net` with your actual cluster URL
   - Make sure to URL encode any special characters in the password

   Example:
   ```
   MONGODB_URI=mongodb+srv://sholafashola_db_user:MyPassword123@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
   ```

3. **Run the connection test:**
   ```bash
   npm start
   ```

   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

## URL Encoding Password

If your password contains special characters, you need to URL encode them:
- `@` becomes `%40`
- `#` becomes `%23`
- `$` becomes `%24`
- `%` becomes `%25`
- `&` becomes `%26`
- `+` becomes `%2B`
- `=` becomes `%3D`
- `?` becomes `%3F`
- `/` becomes `%2F`
- ` ` (space) becomes `%20`

## Resources

- [Get started with the Node.js Driver](https://www.mongodb.com/docs/drivers/node/current/quick-start/)
- [Node.js Starter Sample App](https://github.com/mongodb/node-mongodb-native)
- [Access your Database Users](https://www.mongodb.com/docs/atlas/security-add-mongodb-users/)
- [Troubleshoot Connections](https://www.mongodb.com/docs/atlas/troubleshoot-connection/)
