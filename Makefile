################################################################################

REPO_ROOT := $(shell git rev-parse --show-toplevel)

include $(REPO_ROOT)/tools/build-tools/makefiles/help.mk
include $(REPO_ROOT)/tools/build-tools/makefiles/functions.mk

################################################################################

SHELL := bash

MAKEFLAGS += -rR                        # do not use make's built-in rules and variables
MAKEFLAGS += -k                         # keep going on errors
MAKEFLAGS += --warn-undefined-variables
MAKEFLAGS += --no-print-directory

################################################################################

verbose ?= true

ifeq ($(verbose), true)
	Q :=
else
	Q := @
endif

################################################################################

COMMIT := $(shell git rev-parse --short HEAD)
PROJECT_NAME := $(notdir $(CURDIR))
PYTHON := python3
RM := rm -rf

################################################################################

$(info )
$(info PROJECT = $(PROJECT_NAME))
$(info COMMIT  = $(COMMIT))
$(info )

################################################################################

.PHONY: help clean

.DEFAULT_GOAL := help

################################################################################

clean:
	@## clean generated files
	$(Q) $(RM) data/albums-resolved.json

################################################################################

fetch-albums:
	@## fetch album titles from Google Photos
	$(Q) $(PYTHON) scripts/fetch-album-titles.py

build: fetch-albums
	@## build (fetch album titles)

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
