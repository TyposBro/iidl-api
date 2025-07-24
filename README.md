# IIDL API on Cloudflare Workers

This is a migration of the original Express.js API to a serverless architecture using Cloudflare Workers, Hono, D1 (database), and R2 (storage).

## 🚀 Setup & Deployment

### 1. Prerequisites

- A Cloudflare account.
- [Node.js](https://nodejs.org/en/) and npm installed.
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed globally: `npm install -g wrangler`

### 2. Initial Setup

1.  **Clone the repository:**
    ```sh
    git clone <your-repo-url>
    cd hono-iidl-api
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Login to Cloudflare:**
    ```sh
    wrangler login
    ```

### 3. Create D1 Database and R2 Bucket

You need to create the D1 database and R2 storage bucket that the worker will use.

1.  **Create the R2 Bucket:**
    ```sh
    # This command creates the bucket and binds it in wrangler.toml
    wrangler r2 bucket create iidl-api-bucket
    ```

2.  **Create the D1 Database:**
    ```sh
    # This command creates the database and binds it in wrangler.toml
    wrangler d1 create iidl-api-db
    ```

3.  **Initialize the D1 Database Schema:**
    The database schema is defined in `src/schema.ts`. Apply it to your newly created D1 database.
    ```sh
    # The --local flag is for testing. Remove it to apply to the remote DB.
    wrangler d1 execute iidl-api-db --file=./src/schema.ts # --local
    ```

### 4. Set Up Environment Variables & Secrets

Secrets must be set for the deployed worker.

1.  **Set JWT Secret:**
    ```sh
    # Generate a strong, random string for your JWT secret
    wrangler secret put JWT_SECRET
    ```

2.  **Set Admin Credentials:**
    - **Username:** Set in `wrangler.toml` under `[vars]`.
    - **Password:** You need to create a hashed password.

    a. Run the helper script to hash your desired password:
    ```sh
    node ./scripts/hash-password.mjs "your-super-secret-password"
    ```

    b. Copy the resulting hash.

    c. Insert the admin user into the database. Replace `<YOUR_HASHED_PASSWORD>` with the hash from the previous step and `admin` with your desired username from `wrangler.toml`.
    ```sh
    # The --local flag is for testing. Remove it to apply to the remote DB.
    wrangler d1 execute iidl-api-db --command "INSERT INTO admins (username, password_hash) VALUES ('admin', '<YOUR_HASHED_PASSWORD>');" # --local
    ```

### 5. Configure Public Access for R2

For images to be viewable, you must make your R2 bucket public.

1.  Go to your Cloudflare Dashboard -> R2 -> `iidl-api-bucket`.
2.  Go to the "Settings" tab.
3.  Under "Public Access", click "Connect Domain" and follow the instructions to connect a subdomain (e.g., `assets.yourdomain.com`).
4.  Update the `R2_PUBLIC_URL` variable in `wrangler.toml` to match your new public R2 domain.

### 6. Local Development

Run the development server, which simulates the Cloudflare environment locally.

```sh
npm run dev
```
