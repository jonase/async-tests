(ns async-tests.paint.utils
  (:require [cljs.core.async :refer [chan put! sliding-buffer]])
  (:require-macros [cljs.core.async.macros :refer [go alt!]]))

(defn log [x]
  (.log js/console (pr-str x)))

(defn by-id [id]
  (.getElementById js/document id))

(def PI Math/PI)

(defn len [[px py] [qx qy]]
  (let [a (- px qx)
        b (- py qy)]
    (Math/sqrt (+ (* a a)
                (* b b)))))

(defn fan-in [& channels]
  (let [channel (chan)]
    (doseq [ch channels]
      (go (while true
            (>! channel (<! ch)))))
    channel))