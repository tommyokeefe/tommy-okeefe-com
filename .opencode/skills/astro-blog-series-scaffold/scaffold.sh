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
# Handle both bash and zsh
if [[ -n "${BASH_SOURCE[0]:-}" ]]; then
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
else
  SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
fi
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
DRAFT="true"
CUSTOM_DATE=""

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
   --date DATE            Publication date in YYYY-MM-DD format [default: today]
   --published            Mark as published (draft: false) [default: draft=true]
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
   
   # Validate custom date if provided
   if [[ -n "$CUSTOM_DATE" ]]; then
     if ! [[ "$CUSTOM_DATE" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
       error "Date must be in YYYY-MM-DD format, got: $CUSTOM_DATE"
     fi
     info "Custom date format valid: $CUSTOM_DATE"
   fi
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
     POST_NUMBER=$(auto_detect_next_number "$prefix") || error "Failed to detect next post number"
     echo "Auto-detected post number: $prefix-$POST_NUMBER" >&2
   else
     if ! [[ "$POST_NUMBER" =~ ^[0-9]{3}$ ]]; then
       error "Post number must be 3-digit zero-padded (e.g., '097'), got: $POST_NUMBER"
     fi
   fi
   
   local existing=$(find "$BLOG_DIR" -maxdepth 1 -type d -name "${prefix}-${POST_NUMBER}-*" 2>/dev/null || true)
   if [[ -n "$existing" ]]; then
     error "Post ${prefix}-${POST_NUMBER}-* already exists: $existing"
   fi
   
   echo "Post number: ${prefix}-${POST_NUMBER}" >&2
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
  if [[ -n "$CUSTOM_DATE" ]]; then
    echo "$CUSTOM_DATE"
  else
    date -u +"%Y-%m-%d"
  fi
}

generate_auto_title() {
   # For les-miserables, auto-generate: "Les Miserables: <subtitle>"
   # If title is not provided, leave it empty for user to fill in
   if [[ -n "$TITLE" ]]; then
     echo "$TITLE"
   else
     # Format: "Les Miserables: " with chapter info as placeholder guidance
     case "$SERIES_SLUG" in
       les-miserables)
         echo "Les Miserables: "
         ;;
       *)
         echo ""
         ;;
     esac
   fi
}

generate_auto_description() {
   # Extract numeric values from part/book/chapter
   local part_num="${PART##*-}"
   local book_num="${BOOK##*-}"
   local chapter_num="${CHAPTER##*-}"
   
   if [[ -n "$DESCRIPTION" ]]; then
     echo "$DESCRIPTION"
   else
     # Format: "Part X, book Y, chapter Z - "
     echo "Part $part_num, book $book_num, chapter $chapter_num - "
   fi
}

generate_frontmatter() {
   local current_date=$(get_current_date)
   local tags_yaml=$(convert_tags_to_yaml "$TAGS")
   local auto_title=$(generate_auto_title)
   local auto_description=$(generate_auto_description)
   
   cat <<EOF
---
title: "$auto_title"
description: "$auto_description"
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
       --date)
         CUSTOM_DATE="$2"
         shift 2
         ;;
       --published)
         DRAFT="false"
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
