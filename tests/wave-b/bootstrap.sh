#!/usr/bin/env bash
# Stand up a throwaway Postgres 16 and load the REAL engine (sql/robot.sql part 1 +
# standings.sql + protect.sql), so tests/wave-b/run.mjs can score vectors against the
# actual deployed-shape SQL. Live Supabase is never touched. Idempotent: re-runnable.
set -euo pipefail
PG="${PG_BIN_DIR:-/usr/lib/postgresql/16/bin}"
B="${PGV_DIR:-/tmp/pgv}"          # short path (unix socket path length limit)
SQL="$(cd "$(dirname "$0")/../../sql" && pwd)"
USER_RUN="${PGV_USER:-pgv}"

id -u "$USER_RUN" >/dev/null 2>&1 || useradd -m "$USER_RUN"
"$PG/pg_ctl" -D "$B/data" stop >/dev/null 2>&1 || true
rm -rf "$B"; mkdir -p "$B/data" "$B/sock"; chown -R "$USER_RUN" "$B"

su -s /bin/bash "$USER_RUN" -c "$PG/initdb -D $B/data -A trust -U $USER_RUN" >/dev/null
su -s /bin/bash "$USER_RUN" -c "$PG/pg_ctl -D $B/data -l $B/pg.log -o '-p 5544 -k $B/sock -c listen_addresses=' start"
sleep 1.5
Q="$PG/psql -h $B/sock -p 5544 -U $USER_RUN -v ON_ERROR_STOP=1"
$Q -d postgres -c "create database wc;"
$Q -d wc -c "create role anon; create role authenticated; create role service_role;
             create schema if not exists extensions; create extension if not exists pgcrypto with schema extensions;
             create table kv(key text primary key, value text, updated_at timestamptz default now());"
# robot.sql: load ONLY part 1 + 1b (tables + resolver), NOT the pg_cron/pg_net brain
BRAIN=$(grep -n "create or replace function wc_autoconfirm_tick" "$SQL/robot.sql" | head -1 | cut -d: -f1)
sed -n "1,$((BRAIN-1))p" "$SQL/robot.sql" | $Q -d wc -f - >/dev/null
$Q -d wc -f "$SQL/standings.sql" >/dev/null
$Q -d wc -f "$SQL/protect.sql"   >/dev/null
echo "bootstrap OK — wc_rank=$($Q -d wc -tA -c 'select count(*) from wc_rank'), wc_ko_sched=$($Q -d wc -tA -c 'select count(*) from wc_ko_sched')"
echo "now run:  node tests/wave-b/run.mjs"
