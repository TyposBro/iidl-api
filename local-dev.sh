#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status.
set -e
# Treat unset variables as an error when substituting.
set -u
# Pipestatus: exit code of a pipeline is the status of the last command to exit with non-zero
set -o pipefail

# --- Configuration ---
readonly NAMESPACE="main-homepage"
readonly K8S_MANIFEST_DIR=".cd-manifest"

# --- API Configuration ---
readonly API_IMAGE_NAME="unist-iidl-api"
readonly API_IMAGE_TAG="local"
readonly API_DOCKERFILE_PATH="api/Dockerfile"
readonly API_CONTEXT_PATH="api"
readonly API_SERVICE_FILE="${K8S_MANIFEST_DIR}/api-service.yaml"
readonly API_DEPLOYMENT_FILE="${K8S_MANIFEST_DIR}/deploy.yaml"
readonly API_DEPLOYMENT_NAME="iidl-api-deploy" # From deploy.yaml metadata.name
readonly API_SERVICE_NAME="iidl-api-service"   # From api-service.yaml metadata.name
readonly API_LABEL_SELECTOR="app=iidl-api"     # From deploy.yaml spec.selector.matchLabels.app
readonly API_CONTAINER_NAME="iidl-api-container" # From deploy.yaml spec.template.spec.containers[0].name
readonly API_LOCAL_PORT="8080" # Local port for API port-forwarding
readonly API_SERVICE_PORT="80" # Service port defined in api-service.yaml ports.port

# --- Frontend Configuration ---
readonly FRONTEND_IMAGE_NAME="unist-iidl-frontend" # Match the name used in CI/CD and deploy yaml
readonly FRONTEND_IMAGE_TAG="local"
readonly FRONTEND_DOCKERFILE_PATH="frontend/Dockerfile"
readonly FRONTEND_CONTEXT_PATH="frontend"
readonly FRONTEND_SERVICE_FILE="${K8S_MANIFEST_DIR}/frontend-service.yaml"
readonly FRONTEND_DEPLOYMENT_FILE="${K8S_MANIFEST_DIR}/frontend-deploy.yaml"
readonly FRONTEND_DEPLOYMENT_NAME="iidl-frontend-deploy" # From frontend-deploy.yaml metadata.name
readonly FRONTEND_SERVICE_NAME="iidl-frontend-service"   # From frontend-service.yaml metadata.name
readonly FRONTEND_LABEL_SELECTOR="app=iidl-frontend"     # From frontend-deploy.yaml spec.selector.matchLabels.app
readonly FRONTEND_CONTAINER_NAME="iidl-frontend-container" # From frontend-deploy.yaml spec.template.spec.containers[0].name
readonly FRONTEND_LOCAL_PORT="3000" # Local port for Frontend port-forwarding
readonly FRONTEND_SERVICE_PORT="80" # Service port defined in frontend-service.yaml ports.port

# --- MongoDB Configuration ---
# IMPORTANT: Ensure you have a local-mongo-secret.yaml file as described in the comments
# within your deploy.yaml or create one matching the structure provided previously.
readonly LOCAL_SECRET_FILE="${K8S_MANIFEST_DIR}/local-mongo-secret.yaml"
readonly MONGO_SETUP_FILE="${K8S_MANIFEST_DIR}/mongo-setup.yaml"
readonly MONGO_LABEL_SELECTOR="app=mongo-db"   # From mongo-setup.yaml spec.selector.matchLabels.app
readonly MONGO_CONTAINER_NAME="mongo"          # From mongo-setup.yaml spec.template.spec.containers[0].name


# --- Helper Functions ---
info() {
    echo "[INFO] $1"
}

error() {
    echo "[ERROR] $1" >&2
    exit 1
}

check_deps() {
    info "Checking dependencies..."
    if ! command -v docker &> /dev/null; then
        error "Docker command not found. Please install Docker Desktop."
    fi
    if ! command -v kubectl &> /dev/null; then
        error "kubectl command not found. Ensure Kubernetes is enabled in Docker Desktop or kubectl is installed."
    fi
    local current_context # local is fine inside a function
    current_context=$(kubectl config current-context)
    info "Current kubectl context: ${current_context}"
    if [[ "${current_context}" != "docker-desktop" ]]; then
       info "WARNING: kubectl context is not 'docker-desktop'. Ensure it's set to your local cluster."
    fi
    info "Dependencies look OK."
}

# --- Core Functions ---

build_api_image() {
    local build_opts="$1" # Accept build options as the first argument
    info "Building API Docker image (${API_IMAGE_NAME}:${API_IMAGE_TAG}) for linux/amd64... ${build_opts:+with options: }${build_opts}"
    # Add ${build_opts} to the docker build command
    if docker build ${build_opts} --platform linux/amd64 -t "${API_IMAGE_NAME}:${API_IMAGE_TAG}" -f "${API_DOCKERFILE_PATH}" "${API_CONTEXT_PATH}"; then
        info "API image built successfully."
    else
        error "API Docker build failed."
    fi
}

build_frontend_image() {
    local build_opts="$1" # Accept build options as the first argument
    info "Building Frontend Docker image (${FRONTEND_IMAGE_NAME}:${FRONTEND_IMAGE_TAG}) for linux/amd64... ${build_opts:+with options: }${build_opts}"
    # Ensure entrypoint script is executable before build context is sent
    if [[ -f "${FRONTEND_CONTEXT_PATH}/entrypoint.sh" ]]; then
        chmod +x "${FRONTEND_CONTEXT_PATH}/entrypoint.sh"
    fi
    # Add ${build_opts} to the docker build command
    if docker build ${build_opts} --platform linux/amd64 -t "${FRONTEND_IMAGE_NAME}:${FRONTEND_IMAGE_TAG}" -f "${FRONTEND_DOCKERFILE_PATH}" "${FRONTEND_CONTEXT_PATH}"; then
        info "Frontend image built successfully."
    else
        error "Frontend Docker build failed."
    fi
}

ensure_namespace() {
    info "Ensuring namespace '${NAMESPACE}' exists..."
    # Create if not exists, ignore error if it does (using apply with dry-run)
    kubectl create namespace "${NAMESPACE}" --dry-run=client -o yaml | kubectl apply -f -
}

apply_manifest() {
    local file_path="$1"
    local description="$2"
    if [[ -f "$file_path" ]]; then
        info "Applying ${description} manifest (${file_path})..."
        if kubectl apply -f "${file_path}"; then
            info "${description} applied successfully."
        else
            error "Failed to apply ${description} manifest (${file_path}). Check kubectl logs or the manifest file."
        fi
    else
        # Changed behavior: Treat missing manifests listed here as an error.
        error "Required manifest file not found: ${file_path}. Cannot proceed."
    fi
}

deploy_all() {
    ensure_namespace
    # Apply secret first if it exists and is needed
    if [[ -f "$LOCAL_SECRET_FILE" ]]; then
      apply_manifest "${LOCAL_SECRET_FILE}" "Local MongoDB Secret"
    else
      info "Skipping local MongoDB secret (file not found: ${LOCAL_SECRET_FILE}). Ensure secrets are handled if needed."
    fi
    apply_manifest "${MONGO_SETUP_FILE}" "MongoDB Setup"
    apply_manifest "${API_SERVICE_FILE}" "API Service"
    apply_manifest "${API_DEPLOYMENT_FILE}" "API Deployment"
    apply_manifest "${FRONTEND_SERVICE_FILE}" "Frontend Service"
    apply_manifest "${FRONTEND_DEPLOYMENT_FILE}" "Frontend Deployment"
    info "All manifests applied. Use './local-dev.sh status' to check progress."
}

redeploy() {
    local component="$1" # 'api' or 'frontend'
    if [[ "$component" == "api" ]]; then
        info "Redeploying API only..."
        # Re-applying the deployment should trigger a rollout if the image tag hasn't changed
        # but the underlying image content has. If not, consider rollout restart.
        apply_manifest "${API_DEPLOYMENT_FILE}" "API Deployment"
        info "API Deployment manifest applied. Use './local-dev.sh rollout api' to check progress or 'kubectl rollout restart deployment/${API_DEPLOYMENT_NAME} -n ${NAMESPACE}' to force."
    elif [[ "$component" == "frontend" ]]; then
        info "Redeploying Frontend only..."
        apply_manifest "${FRONTEND_DEPLOYMENT_FILE}" "Frontend Deployment"
        info "Frontend Deployment manifest applied. Use './local-dev.sh rollout frontend' to check progress or 'kubectl rollout restart deployment/${FRONTEND_DEPLOYMENT_NAME} -n ${NAMESPACE}' to force."
    else
        error "Invalid component for redeploy: ${component}. Use 'api' or 'frontend'."
    fi
}

check_status() {
    info "Getting pod status in namespace '${NAMESPACE}'..."
    kubectl get pods -n "${NAMESPACE}" -o wide
    info "Use 'kubectl describe pod <pod-name> -n ${NAMESPACE}' for more details on specific pods."
    info "Getting service status in namespace '${NAMESPACE}'..."
    kubectl get svc -n "${NAMESPACE}"
    info "Getting deployment status in namespace '${NAMESPACE}'..."
    kubectl get deployments -n "${NAMESPACE}"
}

check_rollout() {
    local component="$1" # 'api' or 'frontend'
    local deployment_name

    if [[ "$component" == "api" ]]; then
        deployment_name="${API_DEPLOYMENT_NAME}"
    elif [[ "$component" == "frontend" ]]; then
        deployment_name="${FRONTEND_DEPLOYMENT_NAME}"
    else
        error "Invalid component for rollout status: ${component}. Use 'api' or 'frontend'."
    fi

    info "Checking ${component} deployment rollout status (${deployment_name})..."
    # Use a timeout to prevent indefinite waiting
    if kubectl rollout status deployment/"${deployment_name}" -n "${NAMESPACE}" --timeout=120s; then
         info "${component} Deployment rollout finished successfully."
    else
         # Don't exit, just inform the user
         info "WARNING: ${component} Deployment rollout status check timed out or failed. Check pods and logs ('./local-dev.sh logs ${component}')."
    fi
}

get_pod_name() {
    local label_selector="$1"
    local pod_name
    # Try to get the name of the first running pod matching the label
    pod_name=$(kubectl get pods -n "${NAMESPACE}" -l "${label_selector}" --field-selector=status.phase=Running -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    if [[ -z "$pod_name" ]]; then
        # Fallback: Get any pod matching the label if no running pod found (useful for logs during startup/crashloop)
        pod_name=$(kubectl get pods -n "${NAMESPACE}" -l "${label_selector}" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
        if [[ -z "$pod_name" ]]; then
            error "No pod found with label selector '${label_selector}' in namespace '${NAMESPACE}'. Use './local-dev.sh status'."
        else
            # Inform the user they might be seeing logs from a non-running pod
            info "Warning: No *running* pod found for ${label_selector}. Attempting to get logs from pod: ${pod_name}"
        fi
    fi
    echo "$pod_name"
}

stream_logs() {
    local component_type="$1" # 'api', 'frontend' or 'mongo'
    local pod_name
    local container_name
    local label_selector

    if [[ "$component_type" == "api" ]]; then
        label_selector="${API_LABEL_SELECTOR}"
        container_name="${API_CONTAINER_NAME}"
    elif [[ "$component_type" == "frontend" ]]; then
        label_selector="${FRONTEND_LABEL_SELECTOR}"
        container_name="${FRONTEND_CONTAINER_NAME}"
    elif [[ "$component_type" == "mongo" ]]; then
        label_selector="${MONGO_LABEL_SELECTOR}"
        container_name="${MONGO_CONTAINER_NAME}"
    else
        error "Invalid component type for logs: ${component_type}. Use 'api', 'frontend', or 'mongo'."
    fi

    info "Attempting to get logs for ${component_type}..."
    pod_name=$(get_pod_name "${label_selector}") # Will error out if no pod found
    info "Streaming logs for pod '${pod_name}', container '${container_name}'. Press Ctrl+C to stop."
    # Follow logs (-f) for the specific container (-c)
    kubectl logs -f "${pod_name}" -n "${NAMESPACE}" -c "${container_name}"
}

start_forwarding() {
    local component_type="$1" # 'api' or 'frontend'
    local service_name
    local local_port
    local service_port

    if [[ "$component_type" == "api" ]]; then
        service_name="${API_SERVICE_NAME}"
        local_port="${API_LOCAL_PORT}"
        service_port="${API_SERVICE_PORT}"
        info "Starting port-forwarding for API Service (${service_name})..."
        info "Access your API at http://localhost:${local_port}"
    elif [[ "$component_type" == "frontend" ]]; then
        service_name="${FRONTEND_SERVICE_NAME}"
        local_port="${FRONTEND_LOCAL_PORT}"
        service_port="${FRONTEND_SERVICE_PORT}"
        info "Starting port-forwarding for Frontend Service (${service_name})..."
        info "Access your Frontend at http://localhost:${local_port}"
    else
        error "Invalid component type for port-forwarding: ${component_type}. Use 'api' or 'frontend'."
    fi

    info "Forwarding localhost:${local_port} --> ${service_name}:${service_port} in namespace ${NAMESPACE}"
    info "Press Ctrl+C in this terminal window to stop forwarding."
    # Forward the specific service
    kubectl port-forward "service/${service_name}" "${local_port}:${service_port}" -n "${NAMESPACE}"
    # Note: Script execution will pause here until Ctrl+C is pressed or an error occurs
    info "Port-forwarding stopped for ${component_type}."
}

cleanup() {
    info "Deleting resources defined in manifests from namespace ${NAMESPACE}..."
    # Delete in reverse order of typical application dependencies
    kubectl delete -f "${FRONTEND_DEPLOYMENT_FILE}" --ignore-not-found=true -n "${NAMESPACE}"
    kubectl delete -f "${FRONTEND_SERVICE_FILE}" --ignore-not-found=true -n "${NAMESPACE}"
    kubectl delete -f "${API_DEPLOYMENT_FILE}" --ignore-not-found=true -n "${NAMESPACE}"
    kubectl delete -f "${API_SERVICE_FILE}" --ignore-not-found=true -n "${NAMESPACE}"
    # Deleting the Deployment usually removes the Pods automatically
    # Deleting the PVC might leave the volume depending on policy, but the claim is gone
    kubectl delete -f "${MONGO_SETUP_FILE}" --ignore-not-found=true -n "${NAMESPACE}" # Includes Deployment, Service, PVC
    if [[ -f "$LOCAL_SECRET_FILE" ]]; then
      kubectl delete -f "${LOCAL_SECRET_FILE}" --ignore-not-found=true -n "${NAMESPACE}"
    fi

    info "Cleanup of specified resources complete."
    info "Note: The namespace '${NAMESPACE}' itself has not been deleted."
    info "To delete everything including the namespace, run: kubectl delete namespace ${NAMESPACE}"
    info "(Persistent Volume data might persist depending on the storage class reclaim policy)"
}

# --- Main Script Logic ---
COMMAND=${1:-help} # Default to 'help' if no command is given

case "$COMMAND" in
    build)
        check_deps
        # CORRECTED logic to handle --no-cache - Removed 'local' keyword
        component_type="both" # Default
        build_opts=""
        arg2="${2:-}" # Second argument (might be component or flag)
        arg3="${3:-}" # Third argument (might be flag)

        # Determine component type and build options based on arguments
        if [[ "$arg2" == "--no-cache" ]]; then
            build_opts="--no-cache"
            # component_type remains "both"
        elif [[ "$arg3" == "--no-cache" ]]; then
            build_opts="--no-cache"
            component_type="$arg2" # Assume arg2 was the component type
        elif [[ -n "$arg2" ]]; then
             # arg2 is component type, no --no-cache flag
             component_type="$arg2"
        # else: No component specified, no flag specified -> defaults apply (both, no cache)
        fi

        # Validate component type
        if [[ "$component_type" != "api" && "$component_type" != "frontend" && "$component_type" != "both" ]]; then
            error "Invalid component for build: '$component_type'. Use 'api', 'frontend', or 'both'."
        fi

        # Execute builds with determined options and component type
        if [[ "$component_type" == "api" || "$component_type" == "both" ]]; then
             build_api_image "${build_opts}" # Pass options
        fi
        if [[ "$component_type" == "frontend" || "$component_type" == "both" ]]; then
             build_frontend_image "${build_opts}" # Pass options
        fi
        ;;
    deploy)
        check_deps
        deploy_all
        ;;
    redeploy)
        check_deps
        COMPONENT_TYPE=${2:-} # Expecting api or frontend as the second argument
        if [[ -z "$COMPONENT_TYPE" ]]; then
           error "Missing component type for redeploy. Use: ./local-dev.sh redeploy [api|frontend]"
        fi
        redeploy "$COMPONENT_TYPE"
        ;;
    all)
        # Builds both using cache, then deploys all.
        # For a no-cache 'all', user should run 'build --no-cache' then 'deploy'
        check_deps
        build_api_image "" # Pass empty options (use cache)
        build_frontend_image ""
        deploy_all
        ;;
    status)
        check_deps
        check_status
        ;;
    rollout)
        check_deps
        COMPONENT_TYPE=${2:-} # Expecting api or frontend
        if [[ -z "$COMPONENT_TYPE" ]]; then
           error "Missing component type for rollout status. Use: ./local-dev.sh rollout [api|frontend]"
        fi
        check_rollout "$COMPONENT_TYPE"
        ;;
    logs)
        check_deps
        COMPONENT_TYPE=${2:-} # Expecting api, frontend, or mongo
        if [[ -z "$COMPONENT_TYPE" ]]; then
           error "Missing component type for logs. Use: ./local-dev.sh logs [api|frontend|mongo]"
        fi
        stream_logs "$COMPONENT_TYPE"
        ;;
    forward)
        check_deps
        COMPONENT_TYPE=${2:-} # Expecting api or frontend
        if [[ -z "$COMPONENT_TYPE" ]]; then
           error "Missing component type for port-forwarding. Use: ./local-dev.sh forward [api|frontend]"
        fi
        start_forwarding "$COMPONENT_TYPE"
        ;;
    test)
        info "For manual testing, ensure services are deployed ('./local-dev.sh deploy' or './local-dev.sh all')."
        info "Then, start port-forwarding in separate terminals:"
        info "  Terminal 1: ./local-dev.sh forward api"
        info "  Terminal 2: ./local-dev.sh forward frontend"
        info ""
        info "Access Frontend in your browser: http://localhost:${FRONTEND_LOCAL_PORT}"
        info "Access API directly (e.g., with curl or Postman): http://localhost:${API_LOCAL_PORT}"
        info "Example API Test: curl http://localhost:${API_LOCAL_PORT}/api/some-endpoint" # Adjust endpoint as needed
        ;;
    cleanup)
        check_deps
        info "WARNING: This will attempt to delete Kubernetes resources defined by the manifests in namespace '${NAMESPACE}'."
        info "This includes Deployments, Services, Secrets (if specified), and the PVC."
        read -p "Are you sure you want to continue? (y/N): " -n 1 -r
        echo # Move to a new line
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            cleanup
        else
            info "Cleanup cancelled."
        fi
        ;;
    help|*)
        # Updated help message
        echo "Usage: ./local-dev.sh [COMMAND] [COMPONENT] [--no-cache]"
        echo ""
        echo "Manages local Kubernetes deployment for the Frontend and API application."
        echo ""
        echo "Commands:"
        echo "  build [api|frontend|both] [--no-cache]"
        echo "           Build Docker image(s). Defaults to 'both'."
        echo "           Use --no-cache to build without using Docker's layer cache."
        echo "           Example: './local-dev.sh build frontend --no-cache'"
        echo ""
        echo "  deploy   Deploy MongoDB, API, and Frontend manifests to the local K8s cluster."
        echo "           Assumes images tagged ':local' have been built."
        echo ""
        echo "  redeploy [api|frontend]"
        echo "           Re-applies the deployment manifest for the specified component."
        echo "           Useful after building a new image with the same ':local' tag."
        echo "           May require 'kubectl rollout restart ...' if K8s doesn't detect changes."
        echo ""
        echo "  all      Run 'build both' (using cache) then 'deploy'."
        echo ""
        echo "  status   Show pod, service, and deployment status in the namespace."
        echo ""
        echo "  rollout [api|frontend]"
        echo "           Check the rollout status of the specified deployment."
        echo ""
        echo "  logs [api|frontend|mongo]"
        echo "           Stream logs (-f) from the specified component's container."
        echo ""
        echo "  forward [api|frontend]"
        echo "           Start port-forwarding for the specified service (runs in foreground)."
        echo "           Use Ctrl+C to stop."
        echo ""
        echo "  test     Shows instructions for manual testing using port-forwarding."
        echo ""
        echo "  cleanup  Delete deployed Kubernetes resources defined by the manifests in '${K8S_MANIFEST_DIR}'."
        echo ""
        echo "  help     Show this help message."
        echo ""
        echo "Prerequisites:"
        echo "  - Docker Desktop (or equivalent) running with Kubernetes enabled."
        echo "  - kubectl command available and configured for the local cluster (e.g., 'docker-desktop')."
        echo "  - Manifest files present in '${K8S_MANIFEST_DIR}'."
        echo "  - Run this script from the project root directory."
        ;;
esac

exit 0