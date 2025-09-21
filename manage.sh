#!/bin/bash

PROJECT_DIR="/root/aradhyac/service"
FRONTEND_DIR="/root/aradhyac/ui"
BACKEND_DIR="${PROJECT_DIR}"
DEPLOY_DIR="/var/www/ui"
BACKUP_DIR="/root/backups"

DB_NAME="aradhyac_db"
if [ -f "${PROJECT_DIR}/.env" ]; then
    export $(cat "${PROJECT_DIR}/.env" | sed 's/#.*//g' | xargs)
fi
DB_USER=$(echo $DATABASE_URI | awk -F'://' '{print $2}' | awk -F':' '{print $1}')
DB_PASS=$(echo $DATABASE_URI | awk -F':' '{print $3}' | awk -F'@' '{print $1}')

print_info() {
    echo -e "\n\033[1;34m$1\033[0m"
}

build_frontend() {
    print_info "Building React frontend..."
    cd "$FRONTEND_DIR"
    npm install
    npm run build
    print_info "Build complete. Files are in ${FRONTEND_DIR}/dist"
}

deploy_app() {
    print_info "Starting deployment from Git..."
    cd "$PROJECT_DIR"
    git pull origin main
    print_info "Installing Python dependencies..."
    source "${BACKEND_DIR}/.venv/bin/activate"
    pip install -r "${BACKEND_DIR}/requirements.txt"
    build_frontend
    print_info "Copying built frontend files to ${DEPLOY_DIR}..."
    sudo cp -r "${FRONTEND_DIR}/dist/"* "$DEPLOY_DIR/"
    print_info "Restarting backend service..."
    sudo systemctl restart aradhyac
    print_info "Deployment successful!"
}

backup_app() {
    print_info "Starting backup process..."
    mkdir -p "$BACKUP_DIR"
    DATE=$(date +"%Y-%m-%d_%H-%M-%S")
    DB_BACKUP_FILE="${BACKUP_DIR}/db_backup_${DATE}.sql"
    FILES_BACKUP_FILE="${BACKUP_DIR}/files_backup_${DATE}.tar.gz"
    print_info "Backing up MariaDB database..."
    mysqldump -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" > "$DB_BACKUP_FILE"
    print_info "Backing up application and configuration files..."
    tar -czvf "$FILES_BACKUP_FILE" "$PROJECT_DIR" "$FRONTEND_DIR" /etc/nginx/sites-available /etc/systemd/system/aradhyac.service
    print_info "Backup complete. Files are in ${BACKUP_DIR}"
}

download_backup() {
    print_info "Finding latest backup..."
    LATEST_DB=$(ls -t ${BACKUP_DIR}/db*.sql | head -n 1)
    LATEST_FILES=$(ls -t ${BACKUP_DIR}/files*.tar.gz | head -n 1)

    if [ -z "$LATEST_DB" ] || [ -z "$LATEST_FILES" ]; then
        echo "No backups found. Please run './manage.sh backup' first."
        exit 1
    fi

    print_info "To download the latest backup, run these commands from your LOCAL machine:"
    echo "------------------------------------------------------------------"
    echo "scp root@107.172.140.164:${LATEST_DB} ."
    echo "scp root@107.172.140.164:${LATEST_FILES} ."
    echo "------------------------------------------------------------------"
}

show_logs() {
    print_info "Showing last 100 log entries for aradhyac.service..."
    sudo journalctl -u aradhyac.service -n 100
}

follow_logs() {
    print_info "Following logs in real-time... Press Ctrl+C to exit."
    sudo journalctl -u aradhyac.service -f
}

case "$1" in
    build)
        build_frontend
        ;;

    deploy)
        deploy_app
        ;;

    backup)
        backup_app
        ;;

    download-backup)
        download_backup
        ;;

    logs)
        show_logs
        ;;

    logs-follow)
        follow_logs
        ;;

    *)
        echo "Usage: $0 {build|deploy|backup|download-backup|logs|logs-follow}"
        exit 1
        ;;
esac