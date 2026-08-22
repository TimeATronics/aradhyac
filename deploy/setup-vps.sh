#!/usr/bin/env bash
# One-time provisioning for a freshly reset VPS. Run as root:
#   scp deploy/setup-vps.sh root@<VPS>:/root/ && ssh root@<VPS> 'DEPLOY_PUBKEY="<pubkey>" bash /root/setup-vps.sh'
set -euo pipefail

DEPLOY_USER="${DEPLOY_USER:-deploy}"
DEPLOY_PUBKEY="${DEPLOY_PUBKEY:-}"
SITE_DIR=/srv/aradhyac
COMPOSE_DIR=/opt/aradhyac

[ -n "$DEPLOY_PUBKEY" ] || { echo "DEPLOY_PUBKEY is required (CI deploy key)"; exit 1; }

apt-get update -y
apt-get install -y docker.io docker-compose-v2 ufw

useradd -m -s /bin/bash "$DEPLOY_USER" || true
install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
printf '%s\n' "$DEPLOY_PUBKEY" >> "/home/$DEPLOY_USER/.ssh/authorized_keys"
chmod 600 "/home/$DEPLOY_USER/.ssh/authorized_keys"
chown "$DEPLOY_USER:$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh/authorized_keys"
usermod -aG docker "$DEPLOY_USER"

install -d -m 755 "$SITE_DIR/releases" "$COMPOSE_DIR"

ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "Done. Next steps:"
echo "  1. Create $COMPOSE_DIR/editor.env with:"
echo "       GITHUB_CLIENT_ID=<OAuth App client id>"
echo "       GITHUB_CLIENT_SECRET=<OAuth App client secret>"
echo "     (OAuth app: github.com/settings/developers -> New OAuth App,"
echo "      Homepage https://aradhyac.com, callback https://aradhyac.com/api/edit/oauth/callback)"
echo "  2. Add SSH_HOST/SSH_USER/SSH_PRIVATE_KEY to GitHub repo secrets, then push to main."
echo "  3. Visit https://aradhyac.com/edit and sign in with GitHub."
