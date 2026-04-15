################################################################################

# Copied from build-tools git.mk reference implementation.
# https://github.com/ajay/build-tools/blob/main/makefiles/git.mk
# Keep in sync with the reference when updating.

REPO_ROOT := $(shell git rev-parse --show-toplevel)

git-submodule-update:
	@## initialize and update git submodules
	git submodule sync --recursive
	git submodule update --init --recursive

ifneq ($(MAKECMDGOALS),git-submodule-update)
ifneq (,$(shell git submodule status --recursive 2>/dev/null | grep '^[-+]'))
$(error ERROR: git submodules not initialized or out of date; run `make git-submodule-update`)
endif
endif

################################################################################

DEPS += curl $(PYTHON)

-include $(REPO_ROOT)/site-common/makefiles/site.mk

################################################################################

fetch-albums:
	@## fetch album titles and covers from Google Photos
	$(Q) $(PYTHON) scripts/fetch-album-titles.py

build: fetch-albums
	@## build (fetch albums)

dev: build serve
	@## build & start local dev server

################################################################################
