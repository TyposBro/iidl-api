# Local Development Helper Script (`local-dev.sh`)

This script automates common tasks for building, deploying, testing, and cleaning up the Node.js API and MongoDB services within a local Kubernetes cluster (specifically targeting Docker Desktop with Kubernetes enabled, but adaptable for Minikube/Kind).

## Prerequisites

1.  **Docker Desktop:** Installed with the **Kubernetes** feature enabled. ([Download](https://www.docker.com/products/docker-desktop/))
    *   *Alternatives:* Docker Engine + Minikube or Kind. You might need minor script adjustments or manual image loading (`minikube image load ...` or `kind load docker-image ...`) if not using Docker Desktop.
2.  **`kubectl`:** Installed and configured to point to your local Kubernetes cluster (Docker Desktop does this automatically when Kubernetes is enabled). Verify with `kubectl config current-context`.
3.  **Node.js & npm/yarn:** Required for building the Node.js Docker image locally.
4.  **Git Bash / WSL / Linux Terminal / macOS Terminal:** A bash-compatible shell is required to run the script.
5.  **Project Structure:** The script assumes the following project structure:
    ```
    your-repo-root/
    ├── .cd-manifest/
    │   ├── deploy.yaml        # API Deployment manifest (edited for local)
    │   ├── mongo-setup.yaml   # MongoDB Deployment, Service, PVC manifest
    │   ├── local-mongo-secret.yaml # LOCAL DEV ONLY Secret manifest
    │   └── api-service.yaml   # API Service manifest
    ├── api/
    │   ├── Dockerfile         # API Dockerfile
    │   └── ... (API source code, package.json)
    └── local-dev.sh           # This script
    ```

## Configuration (Optional)

The script includes configuration variables at the top (`IMAGE_NAME`, `IMAGE_TAG`, `NAMESPACE`, resource names, paths, etc.). You can modify these directly in the script if your project's naming conventions or structure differ from the defaults provided.

## Usage

1.  **Make Executable:** Ensure the script has execute permissions. Run this once from your project root:
    ```bash
    chmod +x local-dev.sh
    ```
2.  **Run Commands:** Execute the script from your project's root directory using the following commands:

    ```bash
    ./local-dev.sh [COMMAND]
    ```

### Available Commands

*   **`build`**: Builds the API Docker image locally using `api/Dockerfile` and tags it (e.g., `unist-iidl-api:local`).
*   **`deploy`**: Deploys all necessary resources to the local Kubernetes cluster. This includes:
    *   Ensuring the target namespace exists.
    *   Applying the local MongoDB secret (`local-mongo-secret.yaml`).
    *   Applying the MongoDB setup (`mongo-setup.yaml`).
    *   Applying the API service (`api-service.yaml`).
    *   Applying the API deployment (`deploy.yaml`, configured to use the locally built image).
*   **`redeploy`**: Applies *only* the API deployment manifest (`deploy.yaml`). Useful after rebuilding the image following code changes, triggering a rolling update.
*   **`all`**: Executes the `build` command followed by the `deploy` command. A convenient shortcut for the initial setup or full rebuild/redeploy.
*   **`status`**: Shows the status (`kubectl get pods`) of pods within the application's namespace.
*   **`rollout`**: Checks the rollout status (`kubectl rollout status`) of the API deployment to see if the update completed successfully.
*   **`logs [api|mongo]`**: Streams logs (`kubectl logs -f`) from the specified container.
    *   Example: `./local-dev.sh logs api`
    *   Example: `./local-dev.sh logs mongo`
*   **`forward`**: Starts port-forwarding (`kubectl port-forward`) from your local machine (default `localhost:8080`) to the API service running in Kubernetes. **This command runs in the foreground and must be kept running in its own terminal window while testing.** Press `Ctrl+C` in that window to stop.
*   **`test`**: Prints instructions reminding you how to test the API (requires `forward` to be running separately).
*   **`cleanup`**: Deletes the Kubernetes resources created by the `deploy` command (Deployments, Services, Secret, PVC). **Use with caution.** It will prompt for confirmation. Note that the actual persistent data might remain depending on the StorageClass reclaim policy.
*   **`help`** (or any unknown command): Displays the usage instructions and available commands.

### Typical Workflow

1.  **Initial Setup:**
    ```bash
    ./local-dev.sh all
    ./local-dev.sh status # Wait for pods to be 'Running'
    # In a separate terminal:
    ./local-dev.sh forward
    # Test API at http://localhost:8080
    ```
2.  **Making Code Changes:**
    *   Modify code in `api/`.
    *   Rebuild the image:
        ```bash
        ./local-dev.sh build
        ```
    *   Redeploy the API:
        ```bash
        ./local-dev.sh redeploy
        ```
    *   Check rollout and test:
        ```bash
        ./local-dev.sh rollout
        # Test API at http://localhost:8080 (assuming 'forward' is still running)
        # Check logs if needed: ./local-dev.sh logs api
        ```
3.  **Finished Testing:**
    *   Stop the port-forwarding (Ctrl+C in its terminal).
    *   Clean up resources:
        ```bash
        ./local-dev.sh cleanup
        ```

## Important Notes

*   **Local vs. Production:** This script uses `local-mongo-secret.yaml` and deploys a locally built Docker image (`*:local`). **Do NOT** commit `local-mongo-secret.yaml`. Ensure your main Kubernetes manifests (`deploy.yaml`, `mongo-setup.yaml`) committed to Git reference the **production** image tag from your registry and the **production** secret name/keys provided by administrators.
*   **Error Handling:** The script uses `set -e`, so it will exit immediately if any command fails. Check the output for errors.
*   **Customization:** Feel free to adapt the configuration variables or add more specific commands as needed for your project.