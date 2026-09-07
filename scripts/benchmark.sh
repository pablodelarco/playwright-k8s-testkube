#!/usr/bin/env bash
# Runs the sharded Test Workflow at several shard counts and prints a
# wall-clock table. Wall-clock is measured from the CLI, so it includes
# scheduling, image pull (first run only), transfer and report merge,
# which is what a CI job would actually wait for.
#
# Usage: scripts/benchmark.sh [shard counts...]   (default: 1 8 32)
#   RUNS=3 scripts/benchmark.sh 1 8 32
#   SUITE=tests-large scripts/benchmark.sh 1 4 8 32   (the 1,440-test suite)
set -uo pipefail

WORKFLOW=${WORKFLOW:-playwright-sharded}
RUNS=${RUNS:-2}
NS=${NS:-testkube}
SUITE=${SUITE:-tests}
COUNTS=("$@")
[ ${#COUNTS[@]} -eq 0 ] && COUNTS=(1 8 32)

echo "suite=$SUITE"
printf "%-7s %-4s %-10s %-8s %-9s %-4s %s\n" shards run wallclock pods unsched oom status

for n in "${COUNTS[@]}"; do
  for r in $(seq 1 "$RUNS"); do
    kubectl delete events -n "$NS" --all >/dev/null 2>&1
    start=$(date +%s)
    if testkube run testworkflow "$WORKFLOW" --config shards="$n" --config suite="$SUITE" --watch >"/tmp/bench-$n-$r.log" 2>&1; then
      status=passed
    else
      status=failed
    fi
    end=$(date +%s)
    # Pods created during this run: the main execution pod plus one per shard.
    pods=$(kubectl get pods -n "$NS" -o json | python3 -c '
import json,sys,datetime
start=datetime.datetime.fromtimestamp(int(sys.argv[1]),datetime.timezone.utc)
items=json.load(sys.stdin)["items"]
recent=[p for p in items if datetime.datetime.fromisoformat(p["metadata"]["creationTimestamp"].replace("Z","+00:00"))>=start]
oom=sum(1 for p in recent for c in p["status"].get("containerStatuses",[]) if (c.get("lastState",{}).get("terminated") or c.get("state",{}).get("terminated") or {}).get("reason")=="OOMKilled")
print(len(recent),oom)' "$start")
    unsched=$(kubectl get events -n "$NS" --field-selector reason=FailedScheduling -o name 2>/dev/null | wc -l | tr -d ' ')
    printf "%-7s %-4s %-10s %-8s %-9s %-4s %s\n" "$n" "$r" "$((end - start))s" "${pods% *}" "$unsched" "${pods#* }" "$status"
  done
done
echo "logs: /tmp/bench-<shards>-<run>.log"
