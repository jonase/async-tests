(ns async-test.autocomplete.core
  (:require [cljs.core.async :as async :refer [<! >! chan put!]]
            [clojure.string :as string]
            [async-test.autocomplete.utils
             :refer [timeout mouse-chan key-chan by-id to-char set-html
                     throttle fan-out]])
  (:require-macros [cljs.core.async.macros :as m :refer [go alt!]]
                   [clojure.core.match.js :refer [match]]))

(def input-div (by-id "input"))
(def kc (key-chan input-div "keyup"))

(defn text-chan [kc]
  (let [c (chan)]
    (go
      (while true
        (<! kc)
        (>! c {:input (.-value input-div)})))
    c))

(defn handler [[e c]]
  (match [e]
    [{:input input}] (.log js/console input)
    [{"keyCode" c}]  (.log js/console c)
    :else nil))

(let [[kc' kc''] (fan-out kc 2)
      tc         (text-chan (throttle kc'' 300))]
  (go
    (while true
      (handler (alts! [kc' tc])))))