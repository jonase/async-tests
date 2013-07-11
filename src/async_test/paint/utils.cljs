(ns async-tests.paint.utils)

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

