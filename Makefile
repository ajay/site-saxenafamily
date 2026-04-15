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

ALBUMS_INPUT      := data/gopal-krishna-saxena/albums.json
ALBUMS_OUTPUT     := build/data/gopal-krishna-saxena/albums-resolved.json
ALBUMS_COVERS_DIR := build/assets/images/gopal-krishna-saxena/album-covers

$(ALBUMS_OUTPUT): $(ALBUMS_INPUT) scripts/fetch-album-metadata.py
	$(Q) $(PYTHON) scripts/fetch-album-metadata.py $(ALBUMS_INPUT) $(ALBUMS_OUTPUT) $(ALBUMS_COVERS_DIR)

fetch-albums: $(ALBUMS_OUTPUT)
	@## fetch album metadata from Google Photos

build:: fetch-albums

################################################################################
