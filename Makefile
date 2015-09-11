include BuildProperties.properties
build=$(build.major).$(build.minor).$(build.patch)
versionDir=Notion-$(build)
dir=zip-temp/$(versionDir)
DATE := $(shell /bin/date +%F-%T)


define help

Makefile for Notion
  install - install Notion on qia server
  dist    - build a zipped distribution file
  build   - build UI, documentation and Jar file
  sync    - rsync the current build to qia server
  restart - restart Notion on the qia server

endef
export help

help:
	@echo "$$help"

dist: build
	./gradlew jar
	rm -rf zip-temp
	mkdir -p $(dir)
	rsync -r build/libs/lib $(dir)
	rsync notion $(dir)
	rsync build/libs/Notion.jar $(dir)/Notion.jar
	rsync Readme.md notion.example.yml $(dir)
	(cd zip-temp && zip -r $(versionDir).zip $(versionDir) && mv $(versionDir).zip ../)

build:
	rm -rf src/main/resources/public
	(cd ui/ && make clean install)
	(cd Documentation && make clean install)

install: dist
	${MAKE} sync
	${MAKE} restart

sync:
	rsync -arvz zip-temp/$(versionDir)/ qin@qia:/research/images/Notion/$(versionDir)-$(DATE)
	ssh qin@qia "cd /research/images/Notion ;ln -sfn $(versionDir)-$(DATE) Notion"

restart:
	ssh -t qia sudo /sbin/service notion restart

.PHONY: build dist install watch server sync restart
