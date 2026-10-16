#!/usr/bin/env bash
# ==============================================================================
# setup-vm.sh — Idempotent host preparation script for Ubuntu (ARM64 / x86_64)
# Tested on Oracle Cloud Ampere A1 (Ubuntu 22.04/24.04 ARM64)
# ==============================================================================

set -euo pipefail

echo "==> Starting Hackathon OS VM provisioning..."

# 1. Ensure root execution
if [[ "${EUID}" -ne 0 ]]; then
  echo "Error: This script must be run as root (or via sudo)." >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

# 2. Package updates & essential tooling
echo "==> Updating package indices..."
apt-get update -y
apt-get install -y --no-install-recommends \
  apt-transport-https \
  ca-certificates \
  curl \
  gnupg \
  lsb-release \
  iptables-persistent \
  netfilter-persistent \
  unattended-upgrades \
  tar \
  gzip

# 3. Enable unattended security upgrades
echo "==> Enabling automatic security updates..."
systemctl enable unattended-upgrades
systemctl restart unattended-upgrades

# 4. Swap file setup (2 GB) if not already active
SWAP_FILE="/swapfile"
if ! swapon --show | grep -q "${SWAP_FILE}"; then
  if [[ ! -f "${SWAP_FILE}" ]]; then
    echo "==> Allocating 2 GB swap file..."
    fallocate -l 2G "${SWAP_FILE}" || dd if=/dev/zero of="${SWAP_FILE}" bs=1M count=2048
    chmod 600 "${SWAP_FILE}"
    mkswap "${SWAP_FILE}"
  fi
  echo "==> Activating swap..."
  swapon "${SWAP_FILE}"
  if ! grep -q "${SWAP_FILE}" /etc/fstab; then
    echo "${SWAP_FILE} none swap sw 0 0" >> /etc/fstab
  fi
else
  echo "==> Swap file already active."
fi

# 5. OS Firewall (Oracle Cloud Ubuntu iptables adjustments)
echo "==> Configuring host firewall for HTTP/HTTPS (ports 80 & 443)..."
# Oracle Linux/Ubuntu cloud images default to restrictive INPUT rules ending in REJECT
if iptables -C INPUT -p tcp --dport 80 -j ACCEPT 2>/dev/null; then
  echo "Port 80 already allowed in iptables."
else
  # Insert before any reject rule
  iptables -I INPUT 1 -p tcp --dport 80 -j ACCEPT
fi

if iptables -C INPUT -p tcp --dport 443 -j ACCEPT 2>/dev/null; then
  echo "Port 443 already allowed in iptables."
else
  iptables -I INPUT 2 -p tcp --dport 443 -j ACCEPT
fi

# Persist rules across reboots
netfilter-persistent save

# 6. Docker and Docker Compose Plugin Installation
if ! command -v docker >/dev/null 2>&1; then
  echo "==> Installing Docker Engine and Compose plugin..."
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc

  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "${VERSION_CODENAME}") stable" | \
    tee /etc/apt/sources.list.d/docker.list > /dev/null

  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable docker
  systemctl start docker
else
  echo "==> Docker is already installed."
fi

# 7. Create deploy user
DEPLOY_USER="deploy"
if ! id "${DEPLOY_USER}" >/dev/null 2>&1; then
  echo "==> Creating system user: ${DEPLOY_USER}..."
  useradd -m -s /bin/bash "${DEPLOY_USER}"
  usermod -aG docker "${DEPLOY_USER}"
else
  usermod -aG docker "${DEPLOY_USER}"
fi

# 8. Create application & backup directories
APP_DIR="/opt/hackathon-os"
BACKUP_DIR="/opt/hackathon-os/backups"

echo "==> Creating application directories in ${APP_DIR}..."
mkdir -p "${APP_DIR}" "${BACKUP_DIR}" "${APP_DIR}/config"
chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "${APP_DIR}"
chmod 750 "${APP_DIR}"
chmod 700 "${BACKUP_DIR}"

echo ""
echo "=============================================================================="
echo "VM SETUP COMPLETE!"
echo "=============================================================================="
echo "What you still need to do manually:"
echo "1. Clone or copy the repo to: ${APP_DIR}"
echo "   sudo -u deploy git clone <repo_url> ${APP_DIR}"
echo "2. Create the production environment file:"
echo "   cp ${APP_DIR}/deploy/backend.env.example ${APP_DIR}/deploy/backend.env"
echo "   chmod 600 ${APP_DIR}/deploy/backend.env"
echo "   nano ${APP_DIR}/deploy/backend.env (fill in real secrets)"
echo "3. In Oracle Cloud Console / Cloud Provider:"
echo "   Ensure Virtual Cloud Network (VCN) Ingress Rules allow TCP ports 80 and 443."
echo "4. Set up DNS A records pointing your domain/subdomains to this VM's public IP."
echo "5. Configure daily backup cron:"
echo "   crontab -e -u deploy"
echo "   Add: 0 2 * * * ${APP_DIR}/deploy/backup.sh >> /var/log/hackathon-os-backup.log 2>&1"
echo "6. Launch the stack:"
echo "   cd ${APP_DIR}/deploy && docker compose -f docker-compose.prod.yml up -d --build"
echo "=============================================================================="
