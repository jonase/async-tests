(ns async-test.preventdefault.core
  (:require [cljs.core.async :refer [chan put!]])
  (:require-macros [cljs.core.async.macros :refer [go]]))

;; Callback version

(defn check-name [evt]
  (let [char-code (.-charCode evt)]
    (when (or (< char-code 97)
              (> char-code 122))
      (.preventDefault evt) ;; Don't put non-lowercase letters in the textbox
      (js/alert "Please use lowercase letters only."))))

(defn init []
  (let [text-box (.getElementById js/document "my-textbox")]
    (.addEventListener text-box "keypress" check-name)))

;; core.async version

(defn keypress-chan [element]
  (let [channel (chan)]
    (.addEventListener element "keypress" #(put! channel %))
    channel))

(defn init-async []
  (let [text-box (.getElementById js/document "my-textbox-async")
        keypress (keypress-chan text-box)]
    (go 
     (while true
       (let [evt (<! keypress) ;; Parked, waiting for a value on the
                               ;; keypress channel. The thread of
                               ;; control is released and the browser
                               ;; goes and does its thing

             char-code (.-charCode evt)] ;; And we're back.
         (when (or (< char-code 97)
                   (> char-code 122))
           (.preventDefault evt) ;; Too late to preventDefault here!
           (js/alert "Please use lowercase letters only.")))))))
