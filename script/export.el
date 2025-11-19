(require 'cl-lib)
(require 'json)
(setq export-blog--process
            '(("md" . #'export-blog--export-md)
              ("org" . #'export-blog--export-org)))

(defun export-blog--export-md
    (from target target-meta)
  ;; (message "generate from %s to %s, meta: %s" from target target-meta)
  (let* ((generate-html (format "pandoc --mathjax -o %s %s" target from))
         (generate-meta (format "pandoc -t json %s | jq -M '.meta|walk(if type == \"object\" and .t == \"MetaInlines\" then (.c[].c) elif (type == \"object\" and .t == \"MetaList\") then (.c) else . end)' > %s" from target-meta))
         (command (concat generate-html ";" generate-meta)))
    (message (format "execute: %s" command))
    (start-process-shell-command (format "export-blog-%s" target) nil command)))

(defun export-blog--export-org
    (from target)  
  (message "generate from %s to %s" from target))

(defun export-blog-run
    ()
  (let* ((content-folder (concat my-project-path "content"))
        (build-folder (concat my-project-path "build"))
        (out-folder (concat my-project-path "out"))
        (toc-file (concat build-folder "/toc.json")))
    (make-directory build-folder t)
    (make-directory out-folder t)
    (export-blog--prepare-static content-folder out-folder)
    (export-blog--generate-toc content-folder toc-file out-folder)
    (export-blog--prepare-layout out-folder)
    (let ((toc (json-read-file toc-file)))
      (message (json-serialize toc))
      (export-blog--run content-folder build-folder out-folder toc-file toc))))

(defun export-blog--run
    (content-folder built-folder export-folder toc-file toc)
  (message "type is %s" (type-of toc))
  (seq-do (lambda (category)
            (let* ((task-list (cdr (assq 'articles category)))
                   (waiting-tasks (length task-list))
                   (category-name (car (car category))))
              (seq-do (lambda (post)
                        (let* ((original-path (cdr (assq 'original_path post)))
                               (built-path (cdr (assq 'built_path post)))
                               (export-path (cdr (assq 'path post)))
                               (file-extension (file-name-extension original-path))
                               (content-file (concat content-folder "/" original-path))
                               (built-file (concat built-folder "/content/" built-path))
                               (built-dir (file-name-directory built-file))
                               (built-meta-file (concat built-dir
                                                 (file-name-base built-file) ".json"))
                               (export-file (concat export-folder "/content/" export-path))
                               (apply-template-command (format "%sscript/apply-template.ts %s %s %s %s %s" my-project-path
                                                               built-file built-meta-file toc-file export-file export-path))
                               (sentinel `(lambda (proc event)
                                            (message "executing: %s event: %s" ,apply-template-command event)
                                            (set-process-sentinel
                                             (start-process-shell-command "apply-template" nil ,apply-template-command)
                                             (lambda (proc event)
                                               (cl-decf waiting-tasks)
                                               (message "waiting tasks %d, event: %s" waiting-tasks event))))))
                          (make-directory built-dir t)
                          (message "files: %s %s %s %s" content-file built-file built-meta-file export-file)
                          (set-process-sentinel (funcall
                                               (car (last (assoc file-extension export-blog--process)))
                                               content-file built-file built-meta-file) sentinel))) task-list)
              (while (> waiting-tasks 0) (sit-for 0.01 nil)))) toc))

(defun export-blog--generate-toc
    (content-folder target-file export-folder)
  (call-process-shell-command (format"%sscript/generate-toc.ts %s %s %s" my-project-path content-folder target-file export-folder)))

(defun export-blog--prepare-layout
    (out-folder)
  (let* ((layout-folder (concat my-project-path "layout"))
         (command (format "deno --allow-read --allow-write --allow-env sass --no-source-map %s %s" (concat layout-folder "/base.scss") (concat out-folder "/base.css"))))
    (message "executing %s" command)
    (start-process-shell-command "generate-css" nil command)
    (copy-file (concat layout-folder "/profile.svg") (concat out-folder "/profile.svg") t)))

(defun export-blog--prepare-static
    (content-folder export-folder)
  (let* ((static-folders (directory-files-recursively content-folder "\\`static\\'" t)))
    (message "found %d static folders" (length static-folders))
    (dolist (static-folder static-folders)
      (let* ((relative-path (substring static-folder (length my-project-path))))
        (copy-directory static-folder (concat export-folder "/" relative-path) t t)
        (message "exporting static folder %s" relative-path)))))
