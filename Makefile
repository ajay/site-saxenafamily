################################################################################

REPO_ROOT := $(shell git rev-parse --show-toplevel)

repo-init:
	@## initialize git submodules
	git submodule sync --recursive
	git submodule update --init --recursive

ifneq ($(MAKECMDGOALS),repo-init)
-include $(REPO_ROOT)/tools/site-common/makefiles/site.mk
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
