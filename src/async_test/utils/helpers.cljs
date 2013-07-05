(ns async-test.utils.helpers
  (:require
    [cljs.core.async :as async
     :refer [<! >! chan close! sliding-buffer put! timeout]]
    [goog.net.Jsonp]
    [goog.Uri])
  (:require-macros
    [cljs.core.async.macros :as m :refer [go alt!]]
    [async-test.utils.macros :refer [go-loop]]))

(defn js-print [& args]
  (if (js* "typeof console != 'undefined'")
    (.log js/console (apply str args))
    (js/print (apply str args))))

(set! *print-fn* js-print)

(extend-type object
  ILookup
  (-lookup [coll k]
    (-lookup coll k nil))
  (-lookup [coll k not-found]
    (let [prop (str k)]
      (if (.hasOwnProperty coll prop)
        (aget coll prop)
        not-found))))

(defn now []
  (.valueOf (js/Date.)))

(defn by-id [id] (.getElementById js/document id))

(defn set-html [el s]
  (aset el "innerHTML" s))

(defn to-char [code]
  (.fromCharCode js/String code))

(defn event-chan
  ([type] (event-chan js/window type))
  ([el type] (event-chan (chan (sliding-buffer 1)) el type))
  ([c el type]
    (.addEventListener el type #(put! c %))
    c))

(defn jsonp-chan
  ([uri] (jsonp-chan (chan) uri))
  ([c uri]
    (let [jsonp (goog.net.Jsonp. (goog.Uri. uri))]
      (.send jsonp nil #(put! c %))
      c)))

(defn interval-chan
  ([msecs] (interval-chan (chan) msecs))
  ([c msecs]
    (go-loop
      (>! c (now))
      (<! (timeout msecs)))
    c))

(defn throttle
  ([c ms] (throttle (chan) c ms))
  ([c' c ms]
    (go
      (loop [start nil x nil] ;; bug in core.async, can't use <! here
        (let [x (<! c)]
          (if (nil? x)
            :done
            (if (nil? start)
              (do
                (>! c' x)
                (recur (js/Date.) nil))
              (let [x (<! c)]
                (if (>= (- (js/Date.) start) ms)
                  (recur nil x)
                  (recur start nil))))))))
    c'))

(defn put-all! [cs x]
  (doseq [c cs]
    (put! c x)))

(defn multiplex [in cs-or-n]
  (let [cs (if (number? cs-or-n)
             (repeatedly cs-or-n chan)
             cs-or-n)]
    (go (loop []
          (let [x (<! in)]
            (if-not (nil? x)
              (do
                (put-all! cs x)
                (recur))
              :done))))
    cs))

(defn copy-chan [c]
  (first (multiplex c 1)))

(defn set-class [el name]
  (set! (.-className el) name))

(defn clear-class [el name]
  (set! (.-className el) ""))