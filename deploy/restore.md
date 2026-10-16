# Database and Uploads Restore Guide

This guide provides exact step-by-step commands to restore PostgreSQL and user uploaded files from backups created by `/opt/hackathon-os/deploy/backup.sh`.

---

## 1. Daily Cron Line

The automated daily backup runs at 02:00 UTC every night. Set it up via `crontab -e`:

```cron
0 2 * * * /opt/hackathon-os/deploy/backup.sh >> /var/log/hackathon-os-backup.log 2>&1
```

Ensure log rotation or periodic checks on `/var/log/hackathon-os-backup.log`.

---

## 2. Restore PostgreSQL Database

The database dump is created in custom archive format (`-Fc`). To restore:

### Step 2.1: Locate the Backup File
```bash
ls -lth /opt/hackathon-os/backups/db_*.dump
```
Identify the target timestamp, for example: `/opt/hackathon-os/backups/db_20261016_020000Z.dump`.

### Step 2.2: Stop the Backend Container
To prevent data mutations and active connections during restore:
```bash
cd /opt/hackathon-os/deploy
docker compose -f docker-compose.prod.yml stop backend
```

### Step 2.3: Execute pg_restore
Run `pg_restore` with `--clean` and `--if-exists` to drop existing objects before recreating them:
```bash
docker exec -i hackathon-os-postgres pg_restore \
  -U hackathon \
  -d hackathon_os \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  < /opt/hackathon-os/backups/db_TARGET_TIMESTAMP.dump
```

*(Note: If restoring into a completely fresh empty container or database, remove `--clean --if-exists` if preferred).*

### Step 2.4: Restart Backend and Verify
```bash
docker compose -f docker-compose.prod.yml start backend
docker compose -f docker-compose.prod.yml logs -f backend
```
Wait for Spring Boot to log: `Ready to serve traffic!` and check readiness:
```bash
curl -i http://localhost:8080/actuator/health/readiness
```

---

## 3. Restore Uploads Volume

Uploads are backed up as a gzip-compressed tar archive of the Docker volume.

### Step 3.1: Locate the Archive
```bash
ls -lth /opt/hackathon-os/backups/uploads_*.tar.gz
```
For example: `/opt/hackathon-os/backups/uploads_20261016_020000Z.tar.gz`.

### Step 3.2: Restore to the Docker Volume
Run a temporary alpine helper container attached to the `deploy_uploads_data` volume:
```bash
docker run --rm \
  -v deploy_uploads_data:/volume_data \
  -v /opt/hackathon-os/backups:/backup_src:ro \
  alpine:latest \
  sh -c "rm -rf /volume_data/* && tar -xzf /backup_src/uploads_TARGET_TIMESTAMP.tar.gz -C /volume_data"
```

Verify permissions and contents:
```bash
docker run --rm \
  -v deploy_uploads_data:/volume_data:ro \
  alpine:latest \
  ls -la /volume_data
```

---

## 4. Disaster Recovery (Complete Server Wipe / New VM)

If provisioning from scratch on a new VM:

1. Run `/opt/hackathon-os/deploy/setup-vm.sh`.
2. Clone repository to `/opt/hackathon-os` and configure `/opt/hackathon-os/deploy/backend.env`.
3. Start Postgres only:
   ```bash
   cd /opt/hackathon-os/deploy
   docker compose -f docker-compose.prod.yml up -d postgres
   ```
4. Restore DB dump via Step 2.3.
5. Restore uploads volume via Step 3.2.
6. Start full stack:
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```
