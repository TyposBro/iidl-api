#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status.
set -e
# Treat unset variables as an error when substituting.
set -u
# Pipestatus: exit code of a pipeline is the status of the last command to exit with non-zero
set -o pipefail

# --- Configuration ---
# Adjust these variables to match your project structure and naming
readonly IMAGE_NAME="unist-iidl-api"
readonly IMAGE_TAG="local"
readonly API_DOCKERFILE_PATH="api/Dockerfile"
readonly API_CONTEXT_PATH="api"

readonly NAMESPACE="main-homepage"
readonly K8S_MANIFEST_DIR=".cd-manifest"

# Names of your Kubernetes resources (must match your YAML files)
readonly LOCAL_SECRET_FILE="${K8S_MANIFEST_DIR}/local-mongo-secret.yaml"
readonly MONGO_SETUP_FILE="${K8S_MANIFEST_DIR}/mongo-setup.yaml"
readonly API_SERVICE_FILE="${K8S_MANIFEST_DIR}/api-service.yaml" # Assumes you have this
readonly API_DEPLOYMENT_FILE="${K8S_MANIFEST_DIR}/deploy.yaml"

readonly API_DEPLOYMENT_NAME="iidl-api-deploy" # From deploy.yaml metadata.name
readonly API_SERVICE_NAME="iidl-api-service"   # From api-service.yaml metadata.name
readonly API_LABEL_SELECTOR="app=iidl-api"     # From deploy.yaml spec.selector.matchLabels.app
readonly API_CONTAINER_NAME="iidl-api-container" # From deploy.yaml spec.template.spec.containers[0].name

readonly MONGO_LABEL_SELECTOR="app=mongo-db"   # From mongo-setup.yaml spec.selector.matchLabels.app
readonly MONGO_CONTAINER_NAME="mongo"          # From mongo-setup.yaml spec.template.spec.containers[0].name

readonly LOCAL_PORT="8080" # Local port for port-forwarding
readonly SERVICE_PORT="80" # Service port defined in api-service.yaml ports.port

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
    # Check kubectl context (optional but helpful)
    local current_context
    current_context=$(kubectl config current-context)
    info "Current kubectl context: ${current_context}"
    if [[ "${current_context}" != "docker-desktop" ]]; then
       info "WARNING: kubectl context is not 'docker-desktop'. Ensure it's set to your local cluster."
       # read -p "Continue anyway? (y/N): " -n 1 -r
       # echo
       # if [[ ! $REPLY =~ ^[Yy]$ ]]; then
       #     exit 1
       # fi
    fi
    info "Dependencies look OK."
}

# --- Core Functions ---
build_image() {
    info "Building API Docker image (${IMAGE_NAME}:${IMAGE_TAG}) for linux/amd64..."
    # Add --platform flag
    if docker build --platform linux/amd64 -t "${IMAGE_NAME}:${IMAGE_TAG}" -f "${API_DOCKERFILE_PATH}" "${API_CONTEXT_PATH}"; then
        info "API image built successfully."
    else
        error "Docker build failed."
    fi
}

ensure_namespace() {
    info "Ensuring namespace '${NAMESPACE}' exists..."
    # Create if not exists, ignore error if it does
    kubectl create namespace "${NAMESPACE}" || true
}

apply_manifest() {
    local file_path="$1"
    local description="$2"
    if [[ -f "$file_path" ]]; then
        info "Applying ${description} manifest (${file_path})..."
        if kubectl apply -f "${file_path}"; then
            info "${description} applied successfully."
        else
            error "Failed to apply ${description} manifest (${file_path})."
        fi
    else
        info "Manifest file not found: ${file_path}. Skipping apply."
    fi
}

deploy_all() {
    ensure_namespace
    apply_manifest "${LOCAL_SECRET_FILE}" "Local MongoDB Secret"
    apply_manifest "${MONGO_SETUP_FILE}" "MongoDB Setup"
    apply_manifest "${API_SERVICE_FILE}" "API Service"
    apply_manifest "${API_DEPLOYMENT_FILE}" "API Deployment"
    info "All manifests applied. Use './local-dev.sh status' to check progress."
}

redeploy_api() {
    info "Redeploying API only..."
    apply_manifest "${API_DEPLOYMENT_FILE}" "API Deployment"
    info "API Deployment manifest applied. Use './local-dev.sh status' or './local-dev.sh rollout' to check progress."
}

check_status() {
    info "Getting pod status in namespace '${NAMESPACE}'..."
    kubectl get pods -n "${NAMESPACE}" -o wide
    info "Use 'kubectl describe pod <pod-name> -n ${NAMESPACE}' for more details."
}

check_rollout() {
    info "Checking API deployment rollout status..."
    if kubectl rollout status deployment/"${API_DEPLOYMENT_NAME}" -n "${NAMESPACE}" --timeout=120s; then
         info "API Deployment rollout finished successfully."
    else
         info "API Deployment rollout status check timed out or failed. Check pods and logs."
    fi
}

get_pod_name() {
    local label_selector="$1"
    local pod_name
    pod_name=$(kubectl get pods -n "${NAMESPACE}" -l "${label_selector}" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    if [[ -z "$pod_name" ]]; then
        error "No pod found with label selector '${label_selector}' in namespace '${NAMESPACE}'."
    fi
    echo "$pod_name"
}

stream_logs() {
    local service_type="$1" # 'api' or 'mongo'
    local pod_name
    local container_name
    local label_selector

    if [[ "$service_type" == "api" ]]; then
        label_selector="${API_LABEL_SELECTOR}"
        container_name="${API_CONTAINER_NAME}"
    elif [[ "$service_type" == "mongo" ]]; then
        label_selector="${MONGO_LABEL_SELECTOR}"
        container_name="${MONGO_CONTAINER_NAME}"
    else
        error "Invalid service type for logs: ${service_type}. Use 'api' or 'mongo'."
    fi

    info "Attempting to get logs for ${service_type}..."
    pod_name=$(get_pod_name "${label_selector}")
    info "Streaming logs for pod '${pod_name}', container '${container_name}'. Press Ctrl+C to stop."
    kubectl logs -f "${pod_name}" -n "${NAMESPACE}" -c "${container_name}"
}

start_forwarding() {
    info "Starting port-forwarding for API Service (${API_SERVICE_NAME})..."
    info "Access your API at http://localhost:${LOCAL_PORT}"
    info "Press Ctrl+C in this terminal window to stop forwarding."
    kubectl port-forward "service/${API_SERVICE_NAME}" "${LOCAL_PORT}:${SERVICE_PORT}" -n "${NAMESPACE}"
    # Note: Script execution will pause here until Ctrl+C is pressed
}

cleanup() {
    info "Deleting resources defined in manifests..."
    # Delete in reverse order of application (generally)
    kubectl delete -f "${API_DEPLOYMENT_FILE}" --ignore-not-found=true
    kubectl delete -f "${API_SERVICE_FILE}" --ignore-not-found=true
    kubectl delete -f "${MONGO_SETUP_FILE}" --ignore-not-found=true # This includes PVC
    kubectl delete -f "${LOCAL_SECRET_FILE}" --ignore-not-found=true

    info "Optionally delete the namespace (this removes EVERYTHING in it):"
    info "kubectl delete namespace ${NAMESPACE}"
    info "(PVC data might persist depending on storage class reclaim policy)"
}

# --- Main Script Logic ---
COMMAND=${1:-help} # Default to 'help' if no command is given

case "$COMMAND" in
    build)
        check_deps
        build_image
        ;;
    deploy)
        check_deps
        deploy_all
        ;;
    redeploy)
        check_deps
        redeploy_api
        ;;
    all)
        check_deps
        build_image
        deploy_all
        ;;
    status)
        check_deps
        check_status
        ;;
    rollout)
        check_deps
        check_rollout
        ;;
    logs)
        check_deps
        SERVICE_TYPE=${2:-}
        if [[ -z "$SERVICE_TYPE" ]]; then
           error "Missing service type for logs. Use: ./local-dev.sh logs [api|mongo]"
        fi
        stream_logs "$SERVICE_TYPE"
        ;;
    forward)
        check_deps
        start_forwarding
        ;;
    test)
        info "Port-forwarding needs to be running in a separate terminal ('./local-dev.sh forward')."
        info "Test your API by sending requests to http://localhost:${LOCAL_PORT}"
        info "Example: curl http://localhost:${LOCAL_PORT}/your-endpoint"
        ;;
    cleanup)
        check_deps
        info "WARNING: This will delete Kubernetes resources defined by the manifests."
        read -p "Are you sure you want to continue? (y/N): " -n 1 -r
        echo # Move to a new line
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            cleanup
            info "Cleanup complete."
        else
            info "Cleanup cancelled."
        fi
        ;;
    help|*)
        echo "Usage: ./local-dev.sh [COMMAND]"
        echo ""
        echo "Commands:"
        echo "  build      Build the API Docker image locally"
        echo "  deploy     Deploy MongoDB and API to local Kubernetes cluster"
        echo "  redeploy   Redeploy only the API (after code changes, before build)"
        echo "  all        Run 'build' then 'deploy'"
        echo "  status     Show pod status in the namespace"
        echo "  rollout    Check the rollout status of the API deployment"
        echo "  logs [api|mongo] Stream logs from the API or MongoDB container"
        echo "  forward    Start port-forwarding to access the API locally (runs in foreground)"
        echo "  test       Shows instructions for manual testing via port-forward"
        echo "  cleanup    Delete deployed Kubernetes resources"
        echo "  help       Show this help message"
        echo ""
        echo "Ensure Docker Desktop with Kubernetes enabled is running and configured."
        echo "Run this script from the project root directory."
        ;;
esac

exit 0