(ns async-test.bench.core
  (:require [cljs.core.async :as async :refer [<! >! chan put! take!]])
  (:require-macros [cljs.core.async.macros :as m :refer [go]]))

(defn js-print [& args]
  (if (js* "typeof console != 'undefined'")
    (.log js/console (apply str args))
    (js/print (apply str args))))

(set! *print-fn* js-print)

(defn pipe [in out]
  (go (>! out (<! in))))

(def c0 (chan))
(def c1 (chan))
(def c2 (chan))
(def c3 (chan))
(def c4 (chan))
(def c5 (chan))
(def c6 (chan))
(def c7 (chan))

(pipe c0 c1)
(pipe c1 c2)
(pipe c2 c3)
(pipe c3 c4)
(pipe c4 c5)
(pipe c5 c6)
(pipe c6 c7)

(def s (js/Date.))

#_(go
  (loop [i 0]
    (if (= 500)
      (println "Done, elapsed" )
      (do
        ()))))

(comment
  (put! c0 :foo)
  (take! c7 (fn [v] (println "got" v)))
  )
