################################################################################

# Copied from build-tools repo.mk reference implementation.
# https://github.com/ajay/build-tools/blob/main/makefiles/repo.mk
# Keep in sync with the reference when updating.

REPO_ROOT := $(shell git rev-parse --show-toplevel)

repo-submodule-update:
	@## initialize and update git submodules
	git submodule sync --recursive
	git submodule update --init --recursive

ifneq ($(MAKECMDGOALS),repo-submodule-update)
ifneq (,$(shell git submodule status --recursive 2>/dev/null | grep '^[-+]'))
$(error ERROR: git submodules not initialized or out of date; run `make repo-submodule-update`)
endif
endif

################################################################################

-include $(REPO_ROOT)/site-common/makefiles/site.mk

################################################################################

clean::
	@## clean project-specific generated files
	$(Q) $(RM) gopal-krishna-saxena/data/albums-resolved.json
	$(Q) $(RM) gopal-krishna-saxena/media/album-covers

################################################################################

fetch-albums:
	@## fetch album titles and covers from Google Photos
	$(Q) $(PYTHON) scripts/fetch-album-titles.py

link-build:
	@## copy/symlink build outputs into source tree
ifdef CI
	$(Q) cp -r build/gopal-krishna-saxena/data/* gopal-krishna-saxena/data/
	$(Q) cp -r build/gopal-krishna-saxena/media/* gopal-krishna-saxena/media/
else
	$(Q) ln -sf $(REPO_ROOT)/build/gopal-krishna-saxena/data/albums-resolved.json gopal-krishna-saxena/data/albums-resolved.json
	$(Q) ln -sf $(REPO_ROOT)/build/gopal-krishna-saxena/media/album-covers gopal-krishna-saxena/media/album-covers
endif

build: fetch-albums link-build
	@## build (fetch albums, link outputs)

dev: build serve
	@## build & start local dev server

versions::
	@## print tool versions
	$(call print_tool_version,curl,curl)

################################################################################
