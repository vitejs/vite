#!/usr/bin/env bash
#######################################################################
# Runs command, retrying if specific error is logged (see ERRORS below)
#
# Usage: retry.sh <cmd> [<retries>]
#
# Arguments:
#  cmd        command to run
#  retries    number of times to retry command (default: 3)
#######################################################################
COMMAND_TO_RUN=${1?Missing command argument}
NUM_RETRIES=${2:-3}

FG_BOLD_WHITE='\033[1;37m'
FG_RED='\033[0;31m'
FG_BLUE='\033[0;34m'
FG_GRAY='\033[1;30m'
BG_RED='\033[41m'
BG_BLUE='\033[44m'
NC='\033[0m' # No Color

function findErrors() {
  FILE_TO_CHECK=${1?Missing file argument}

  # Node errors seen in Vitest (vitejs/vite#9492)
  ERRORS=(
    "Check failed: result.second."                        # nodejs/node#43617
    "FATAL ERROR: v8::FromJust Maybe value is Nothing."   # vitest-dev/vitest#1191
  )

  for error in "${ERRORS[@]}"; do
    if grep -qnr "${error}" ${FILE_TO_CHECK}; then
      echo ${error}
    fi
  done
}

TMPFILE=$(mktemp)
for i in `seq ${NUM_RETRIES}`; do
  ${COMMAND_TO_RUN} 2>&1 | tee ${TMPFILE}

  error=$(findErrors ${TMPFILE})
  if [[ ! -z "$error" ]]; then
    echo -e "${FG_BOLD_WHITE}${BG_RED} FLAKE DETECTED: ${FG_RED} ${error} ${NC}"

    # use GitHub Action annotation to highlight flake
    echo -e "::warning::FLAKE DETECTED: ${error}"
    echo -e "${FG_BOLD_WHITE}${BG_BLUE} RETRYING: ${NC} ${FG_GRAY}(${i} of ${NUM_RETRIES})${FG_BLUE} ${COMMAND_TO_RUN}${NC}";
  else
    break
  fi
done
