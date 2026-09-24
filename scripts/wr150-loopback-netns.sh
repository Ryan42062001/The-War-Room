#!/usr/bin/env bash
# WR-151 DORMANT: only the separately approved labeled hosted job may execute.
set -Eeuo pipefail
umask 077
fail() { echo "WR151_FAIL_CLOSED: $*" >&2; exit 1; }
[[ "${RUNNER_ENVIRONMENT:-}" == "github-hosted" ]] || fail "not a disposable GitHub-hosted runner"
[[ "${GITHUB_EVENT_NAME:-}" == "pull_request" ]] || fail "not a pull-request event"
[[ -n "${WR151_EXPECTED_HEAD:-}" ]] || fail "missing exact reviewed head input"
[[ "$(git rev-parse HEAD)" == "$WR151_EXPECTED_HEAD" ]] || fail "checkout head mismatch"
[[ "$EUID" -ne 0 ]] || fail "wrapper must begin unprivileged"
for binary in sudo ip unshare setpriv node git mktemp sha256sum; do
  command -v "$binary" >/dev/null || fail "missing prerequisite $binary"
done
sudo -n true || fail "noninteractive sudo unavailable"
[[ -f package-lock.json && -f scripts/wr150-loopback-preflight.mjs ]] || fail "inert inputs missing"
echo "WR151_WRAPPER_HEAD $(git rev-parse HEAD)"
echo "WR151_PACKAGE_LOCK_SHA256 $(sha256sum package-lock.json | cut -d' ' -f1)"

runner_uid="$(id -u)"
runner_gid="$(id -g)"
parent_netns="$(readlink /proc/self/ns/net)"
node_binary="$(command -v node)"
browser_cache="${HOME}/.cache/ms-playwright"
[[ "$node_binary" == /* && -d "$browser_cache" ]] || fail "pinned browser or Node binary inaccessible"
namespace="wr151-${GITHUB_RUN_ID:?}-${GITHUB_RUN_ATTEMPT:-1}-$$"
[[ "$namespace" =~ ^wr151-[0-9]+-[0-9]+-[0-9]+$ ]] || fail "invalid namespace name"
workdir="$(mktemp -d "${RUNNER_TEMP:-/tmp}/wr151-inert.XXXXXXXX")" || fail "private workdir creation"
chmod 700 "$workdir"
mkdir -m 700 "$workdir/home"
created=0
cleanup() {
  local rc=$? remaining="" stop_failed=0
  trap - EXIT INT TERM HUP
  if [[ "$created" -eq 1 ]]; then
    for pass in 1 2 3; do
      remaining="$(sudo -n ip netns pids "$namespace" 2>/dev/null || true)"
      [[ -z "$remaining" ]] && break
      # Kill ONLY namespaced PIDs; never inspect or mutate the user's WSL runner.
      while read -r pid; do
        [[ "$pid" =~ ^[0-9]+$ ]] || continue
        if [[ "$pass" -lt 3 ]]; then sudo -n kill -TERM "$pid" 2>/dev/null || true
        else sudo -n kill -KILL "$pid" 2>/dev/null || true; fi
      done <<< "$remaining"
      sleep 1
    done
    remaining="$(sudo -n ip netns pids "$namespace" 2>/dev/null || true)"
    if [[ -n "$remaining" ]]; then
      echo "WR151_CLEANUP_FAILURE: residual namespaced process(es)" >&2
      stop_failed=1
    fi
    if ! sudo -n ip netns delete "$namespace"; then
      echo "WR151_CLEANUP_FAILURE: namespace deletion failed" >&2
      stop_failed=1
    fi
    if sudo -n ip netns list | grep -Fq "$namespace"; then
      echo "WR151_CLEANUP_FAILURE: namespace remains registered" >&2
      stop_failed=1
    fi
  fi
  rm -rf -- "$workdir" || stop_failed=1
  [[ ! -e "$workdir" ]] || stop_failed=1
  [[ "$stop_failed" -eq 0 ]] || rc=1
  if [[ "$rc" -eq 0 ]]; then echo "WR151_CLEANUP_PASS namespace_gone=true descendants_gone=true fixture_removed=true"
  else echo "WR151_CLEANUP_UNVERIFIED fail_closed=true" >&2; fi
  exit "$rc"
}
trap cleanup EXIT
trap 'exit 1' INT TERM HUP

sudo -n ip netns add "$namespace" || fail "cannot create ephemeral network namespace"
created=1
sudo -n ip -n "$namespace" link set lo up || fail "isolated loopback unavailable"
link_rows="$(sudo -n ip -n "$namespace" -o link show)"
[[ "$(printf '%s\n' "$link_rows" | grep -cE '^[0-9]+: lo:')" -eq 1 ]] || fail "loopback not unique"
[[ "$(printf '%s\n' "$link_rows" | wc -l)" -eq 1 ]] || fail "non-loopback interface present"
[[ -z "$(sudo -n ip -n "$namespace" -4 route show table main)" ]] || fail "IPv4 main routing table nonempty"
[[ -z "$(sudo -n ip -n "$namespace" -6 route show table main)" ]] || fail "IPv6 main routing table nonempty"
[[ -z "$(sudo -n ip -n "$namespace" -4 route show default)" ]] || fail "IPv4 default route"
[[ -z "$(sudo -n ip -n "$namespace" -6 route show default)" ]] || fail "IPv6 default route"
echo "WR151_NAMESPACE_PREFLIGHT links=loopback_only ipv4_main=empty ipv6_main=empty"

# All Node/Playwright/Chromium descendants enter the same netns. Fresh mount
# namespace hides host /run and /tmp AF_UNIX broker paths. Drop all process
# capabilities and inherited nonstandard descriptors. Never pass original
# runner environment, proxy variables, token, socket or credential material.
sudo -n ip netns exec "$namespace" unshare --mount --propagation private -- \
  bash -Eeuo pipefail -c '
    mount -t tmpfs -o mode=0700,nosuid,nodev,noexec,size=16m tmpfs /run
    mount -t tmpfs -o mode=1777,nosuid,nodev,size=128m tmpfs /tmp
    for file in /proc/self/fd/*; do
      fd="${file##*/}"
      if [[ "$fd" =~ ^[0-9]+$ ]] && (( fd > 2 )); then
        eval "exec ${fd}>&-" || true
      fi
    done
    exec setpriv --reuid "$1" --regid "$2" --clear-groups \
      --bounding-set=-all --inh-caps=-all --ambient-caps=-all --no-new-privs \
      env -i PATH=/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin HOME="$3" \
      TMPDIR=/tmp WR151_NETNS_NAME="$4" WR151_EXPECTED_HEAD="$5" \
      WR151_PARENT_NETNS_INODE="$7" PLAYWRIGHT_BROWSERS_PATH="$8" \
      NODE_ENV=test "$9" "$6"
  ' _ "$runner_uid" "$runner_gid" "$workdir/home" "$namespace" \
  "$WR151_EXPECTED_HEAD" "$PWD/scripts/wr150-loopback-preflight.mjs" \
  "$parent_netns" "$browser_cache" "$node_binary"
# The EXIT trap owns all cleanup and its audited result.
