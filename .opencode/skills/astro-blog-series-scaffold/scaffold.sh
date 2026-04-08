#!/bin/bash

##############################################################################
# astro-blog-series-scaffold
#
# Reference implementation: Scaffold a new blog post in a serialized series.
# Automates folder creation, sequential numbering, and frontmatter generation.
#
# Usage:
#   ./scaffold.sh --series "les-miserables" --part "part-2" --book "book-3" --chapter "chapter-5"
#   ./scaffold.sh --series "les-miserables" --number "097" --part "part-2" --book "book-3" --chapter "chapter-5"
#
# See SKILL.md for full documentation.
##############################################################################

set -euo pipefail

# Detect project root (parent of .opencode directory)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
BLOG_DIR="${PROJECT_ROOT}/src/content/blog"
SERIES_DIR="${PROJECT_ROOT}/src/content/series"

# Defaults
SERIES_SLUG=""
POST_NUMBER=""
PART=""
BOOK=""
CHAPTER=""
TITLE=""
DESCRIPTION=""
TAGS=""
DRAFT="false"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

##############################################################################
# Helper Functions
##############################################################################

print_usage() {
  cat <<EOF
Usage: ${0##*/} [OPTIONS]

OPTIONS:
  --series SLUG          Series slug (e.g., 'les-miserables') [REQUIRED]
  --number NUM|auto      Post number (3-digit e.g., '097') or 'auto' [default: auto]
  --part PART            Part identifier (e.g., 'part-2') [REQUIRED]
  --book BOOK            Book identifier (e.g., 'book-3') [REQUIRED]
  --chapter CHAPTER      Chapter identifier (e.g., 'chapter-5') [REQUIRED]
  --title TITLE          Post title [optional]
  --description DESC     Post description [optional]
  --tags TAGS            Comma-separated tags (e.g., 'cosette,desire') [optional]
  --draft                Mark as draft (draft: true) [default: false]
  --help                 Show this help message

EXAMPLES:
  # Create with auto-numbering
  ${0##*/} --series les-miserables --part part-2 --book book-3 --chapter chapter-5

  # Create with explicit title and tags
  ${0##*/} --series les-miserables --part part-2 --book book-3 --chapter chapter-5 \\
    --title "Cosette & The Doll" --tags "cosette,desire,beauty"

  # Create draft post
  ${0##*/} --series les-miserables --part part-2 --book book-3 --chapter chapter-6 --draft
EOF
}

error() {
  echo -e "${RED}❌ Error: $1${NC}" >&2
  exit 1
}

warn() {
  echo -e "${YELLOW}⚠️  Warning: $1${NC}" >&2
}

info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

success() {
  echo -e "${GREEN}✅ $1${NC}"
}

##############################################################################
# Validation Functions
##############################################################################

validate_required_params() {
  [[ -z "$SERIES_SLUG" ]] && error "Missing --series. See --help for usage."
  [[ -z "$PART" ]] && error "Missing --part. See --help for usage."
  [[ -z "$BOOK" ]] && error "Missing --book. See --help for usage."
  [[ -z "$CHAPTER" ]] && error "Missing --chapter. See --help for usage."
}

validate_series_exists() {
  if [[ ! -d "$SERIES_DIR/$SERIES_SLUG" ]]; then
    error "Series '$SERIES_SLUG' not found in $SERIES_DIR/"
  fi
  success "Series '$SERIES_SLUG' found"
}

validate_format() {
  local pattern="^[a-z]+-[0-9]+$"
  for identifier in "$PART" "$BOOK" "$CHAPTER"; do
    if ! [[ "$identifier" =~ $pattern ]]; then
      error "'$identifier' does not match format 'name-N' (lowercase, hyphenated)"
    fi
  done
  info "Part/book/chapter format valid"
}

##############################################################################
# Series and Numbering Functions
##############################################################################

get_series_prefix() {
  local slug="$1"
  case "$slug" in
    les-miserables) echo "lm" ;;
    *)
      echo "${slug:0:2}"
      ;;
  esac
}

auto_detect_next_number() {
  local prefix="$1"
  local max_num=0
  
  if [[ -d "$BLOG_DIR" ]]; then
    while IFS= read -r -d '' dir; do
      local dirname=$(basename "$dir")
      if [[ $dirname =~ ^${prefix}-([0-9]{3})- ]]; then
        local num="${BASH_REMATCH[1]}"
        num=$((10#$num))
        if (( num > max_num )); then
          max_num=$num
        fi
      fi
    done < <(find "$BLOG_DIR" -maxdepth 1 -type d -name "${prefix}-*" -print0 2>/dev/null || true)
  fi
  
  local next_num=$((max_num + 1))
  printf "%03d" "$next_num"
}

resolve_post_number() {
  local prefix="$1"
  
  if [[ "$POST_NUMBER" == "auto" ]] || [[ -z "$POST_NUMBER" ]]; then
    POST_NUMBER=$(auto_detect_next_number "$prefix")
    info "Auto-detected post number: $prefix-$POST_NUMBER"
  else
    if ! [[ "$POST_NUMBER" =~ ^[0-9]{3}$ ]]; then
      error "Post number must be 3-digit zero-padded (e.g., '097'), got: $POST_NUMBER"
    fi
  fi
  
  local existing=$(find "$BLOG_DIR" -maxdepth 1 -type d -name "${prefix}-${POST_NUMBER}-*" 2>/dev/null || true)
  if [[ -n "$existing" ]]; then
    error "Post ${prefix}-${POST_NUMBER}-* already exists: $existing"
  fi
  
  success "Post number: ${prefix}-${POST_NUMBER}"
}

##############################################################################
# Frontmatter Generation
##############################################################################

convert_tags_to_yaml() {
  local tags="$1"
  if [[ -z "$tags" ]]; then
    echo "  []"
    return
  fi
  
  IFS=',' read -ra tag_array <<< "$tags"
  for tag in "${tag_array[@]}"; do
    tag=$(echo "$tag" | xargs)
    echo "  - $tag"
  done
}

get_current_date() {
  date -u +"%Y-%m-%d"
}

generate_frontmatter() {
  local current_date=$(get_current_date)
  local tags_yaml=$(convert_tags_to_yaml "$TAGS")
  
  cat <<EOF
---
title: "$TITLE"
description: "$DESCRIPTION"
date: "$current_date"
draft: $DRAFT
series: "$SERIES_SLUG"
part: "$PART"
book: "$BOOK"
chapter: "$CHAPTER"
tags:
$tags_yaml
---
EOF
}

##############################################################################
# File Creation
##############################################################################

create_post() {
  local prefix="$1"
  local folder_name="${prefix}-${POST_NUMBER}-${PART}-${BOOK}-${CHAPTER}"
  local folder_path="$BLOG_DIR/$folder_name"
  local file_path="$folder_path/index.md"
  
  mkdir -p "$folder_path"
  info "Created folder: $folder_path"
  
  {
    generate_frontmatter
    echo
  } > "$file_path"
  
  success "Created file: $file_path"
  
  # Output summary
  echo
  echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
  echo -e "  ${GREEN}✅ Blog post scaffolded successfully!${NC}"
  echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
  echo "  📁 Folder: $folder_path"
  echo "  📄 File:   $file_path"
  echo "  🏷️  Post:    ${prefix}-${POST_NUMBER}"
  if [[ -n "$TITLE" ]]; then
    echo "  📝 Title:   $TITLE"
  fi
  if [[ -n "$DESCRIPTION" ]]; then
    echo "  📖 Desc:    ${DESCRIPTION:0:50}..."
  fi
  if [[ -n "$TAGS" ]]; then
    echo "  🏷️  Tags:    $TAGS"
  fi
  if [[ "$DRAFT" == "true" ]]; then
    echo "  ✍️  Status:   DRAFT"
  fi
  echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
  echo "  Ready for content authoring!"
  echo
}

##############################################################################
# Main
##############################################################################

main() {
  # Parse arguments
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --series)
        SERIES_SLUG="$2"
        shift 2
        ;;
      --number)
        POST_NUMBER="$2"
        shift 2
        ;;
      --part)
        PART="$2"
        shift 2
        ;;
      --book)
        BOOK="$2"
        shift 2
        ;;
      --chapter)
        CHAPTER="$2"
        shift 2
        ;;
      --title)
        TITLE="$2"
        shift 2
        ;;
      --description)
        DESCRIPTION="$2"
        shift 2
        ;;
      --tags)
        TAGS="$2"
        shift 2
        ;;
      --draft)
        DRAFT="true"
        shift
        ;;
      --help)
        print_usage
        exit 0
        ;;
      *)
        error "Unknown option: $1. See --help for usage."
        ;;
    esac
  done
  
  # Validate
  validate_required_params
  validate_series_exists
  validate_format
  
  # Determine series prefix and resolve post number
  local prefix=$(get_series_prefix "$SERIES_SLUG")
  resolve_post_number "$prefix"
  
  # Create post
  create_post "$prefix"
}

# Run main
main "$@"
