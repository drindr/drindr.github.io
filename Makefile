
.PHONY: clean default


PROJECT_PATH="(setq my-project-path \"$(PWD)/\")"
default:
	emacs --batch --script ./script/export.el --eval ${PROJECT_PATH} --eval "(export-blog-run)"
clean:
	rm -rf ./out ./build
