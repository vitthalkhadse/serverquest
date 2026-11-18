#!/usr/bin/env bash
# Trivy se images scan: HIGH/CRITICAL mile to fail.
set -euo pipefail
for img in "$@"; do
  trivy image --severity HIGH,CRITICAL --exit-code 1 "$img"
done
