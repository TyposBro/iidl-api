
## Technology Stack

*   **Backend:** Node.js (Version specified in `api/Dockerfile`)
*   **Database:** MongoDB (Version specified in `.cd-manifest/mongo-setup.yaml`)
*   **Containerization:** Docker
*   **Orchestration:** Kubernetes
*   **CI/CD:** GitHub Actions, GitOps controller (e.g., Argo CD, FluxCD)

## Production Deployment

### Prerequisites

*   A running Kubernetes cluster with appropriate permissions.
*   A configured GitOps controller (or other mechanism) watching the `.cd-manifest/` directory on the `master` branch of this repository.
*   A private Docker Registry (`unist.krs.ncr.gov-ntruss.com`) configured in GitHub Actions Secrets (`REG_ACCESS_KEY`, `REG_SECRET_KEY`) and Kubernetes ImagePullSecrets (`regcred` in the `main-homepage` namespace).
*   A Kubernetes Secret object existing in the `main-homepage` namespace containing the production MongoDB credentials (e.g., named `mongo-secret` with keys like `MONGO_ROOT_USERNAME`, `MONGO_ROOT_PASSWORD`). **This secret is managed by cluster administrators.**

### Workflow

1.  **Code Changes:** Developers make changes to the API code in the `api/` directory.
2.  **Prepare Manifests:** Ensure `.cd-manifest/deploy.yaml` points to the correct *upcoming* image tag and references the *production* secret name and keys (confirm with admins). Ensure `.cd-manifest/mongo-setup.yaml` also references the correct production secret name/keys.
3.  **Update Version:** Increment the version tag (e.g., `API_VERSION`) in `.github/workflows/action.yml`.
4.  **Commit & Push:** Commit changes (including updated code, Dockerfile if necessary, and manifests) and push to the `master` branch.
5.  **CI (GitHub Actions):**
    *   The `action.yml` workflow triggers.
    *   It builds the Node.js API image using `api/Dockerfile`.
    *   It tags the image with the private registry path and the specified version.
    *   It pushes the tagged image to the private registry.
6.  **CD (GitOps Controller / Sync Process):**
    *   The controller detects changes in the `.cd-manifest/` directory in the Git repository.
    *   It applies the updated `deploy.yaml` and `mongo-setup.yaml` (and others) to the Kubernetes cluster.
    *   Kubernetes updates the API deployment (pulling the new image) and ensures the MongoDB deployment is running according to the configuration, using the **admin-managed production secrets**.

## Local Development & Testing

To test changes locally before pushing, a local Kubernetes environment mimicking the production setup can be used.

### Prerequisites

*   Docker Desktop with Kubernetes enabled (or alternative like Minikube/Kind).
*   `kubectl` configured to talk to the local cluster.
*   Node.js installed locally for development.

### Setup & Usage

The `local-dev.sh` script simplifies local development. See the [Local Development README](./local-dev-README.md) (or link to the separate README you created) for detailed instructions on using the script.

**Key Differences for Local Development:**

*   **Image Tag:** The API deployment (`.cd-manifest/deploy.yaml`) is temporarily modified to use a locally built image tag (e.g., `unist-iidl-api:local`) and `imagePullPolicy: IfNotPresent`. **This change must be reverted before committing.**
*   **Secrets:** A temporary `local-mongo-secret.yaml` file is created within `.cd-manifest/` containing development credentials. This file defines a Secret named `mongo-secret` (or whatever name the main manifests expect). **This file must NOT be committed to Git.**
*   **Building:** The `docker build` command is run manually or via the `local-dev.sh build` command.
*   **Deployment:** Kubernetes manifests are applied manually using `kubectl apply -f .cd-manifest/` or via the `local-dev.sh deploy` command.
*   **Access:** The API is typically accessed via `kubectl port-forward` using the `local-dev.sh forward` command.

## Configuration

### API (`api/src/server.js` or similar)

*   **Port:** Listens on the port specified by the `PORT` environment variable (defaults might be used, e.g., 3000). Ensure this matches the `containerPort` in `deploy.yaml` and `targetPort` in `api-service.yaml`.
*   **MongoDB URI:** Connects using the connection string provided in the `MONGO_URI` environment variable. This variable is constructed in `deploy.yaml` using values injected from the Kubernetes Secret.

### Kubernetes (`.cd-manifest/`)

*   **`deploy.yaml`:** Configures the API image name/tag, replicas, ports, environment variables, and secret references.
*   **`mongo-setup.yaml`:** Configures the MongoDB image version, persistent storage size (in the PVC), service name, and secret references for initialization.
*   **Secrets:** Production secrets are managed outside this repository by administrators. Local testing uses `local-mongo-secret.yaml`.

### CI/CD (`.github/workflows/action.yml`)

*   Defines the image name (`API_NAME`) and version (`API_VERSION`) for the build.
*   Requires GitHub Secrets (`REG_ACCESS_KEY`, `REG_SECRET_KEY`) for registry login.

## Contributing

[TBD]

## Support & Contact

For questions or issues regarding this setup, please contact:

*   **Email:** typosbro@proton.me
*   **GitHub Profile / Portfolio:** [typosbro.github.io](https://typosbro.github.io)