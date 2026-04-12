################################################################################

# Copied from build-tools repo-init.mk reference implementation.
# https://github.com/ajay/build-tools/blob/main/makefiles/repo-init.mk
# Keep in sync with the reference when updating.

REPO_ROOT := $(shell git rev-parse --show-toplevel)

# Path to repo-init.mk — used as existence check for whether submodules
# are initialized. Update this path to match your submodule layout.
REPO_INIT_CHECK := $(REPO_ROOT)/tools/site-common/tools/build-tools/makefiles/repo-init.mk

repo-init:
	@## initialize git submodules
	git submodule sync --recursive
	git submodule update --init --recursive

ifneq ($(MAKECMDGOALS),repo-init)
ifeq (,$(wildcard $(REPO_INIT_CHECK)))
$(error git submodules not initialized; run `make repo-init`)
endif
endif

################################################################################

ifneq ($(MAKECMDGOALS),repo-init)
include $(REPO_ROOT)/tools/site-common/makefiles/site.mk
endif

################################################################################

clean:
	@## clean generated files
	$(Q) $(RM) build
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

serve: build
	@## build & start local dev server
	$(Q) $(PYTHON) -m http.server 8000

dev: serve
	@## alias for serve

versions:
	@## print tool versions
	$(call print_tool_version,$(PYTHON),$(PYTHON))
	$(call print_tool_version,curl,curl)

################################################################################
