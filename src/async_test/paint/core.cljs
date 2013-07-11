(ns async-tests.paint.core
  (:require [async-tests.paint.utils :refer [PI len log by-id]]
            [cljs.core.async :refer [chan put! sliding-buffer]])
  (:require-macros [cljs.core.async.macros :refer [go alt!]]))

;; Elements on the page
(def paint-canvas        (by-id "paint-canvas"))
(def interaction-canvas  (by-id "interaction-canvas"))
(def line-button         (by-id "line"))
(def circle-button       (by-id "circle"))
(def stroke-color        (by-id "stroke-color"))
(def stroke-width        (by-id "stroke-width"))

(def paint-ctx (.getContext paint-canvas "2d"))
(def interaction-ctx (.getContext interaction-canvas "2d"))

;; Channels

(def stroke-color-channel
  (let [channel (chan)]
    (.addEventListener stroke-color
                       "input"
                       #(put! channel (-> % .-target .-value)))
    channel))

(def stroke-width-channel
  (let [channel (chan)]
    (.addEventListener stroke-width
                       "input"
                       #(put! channel (js/parseInt (-> % .-target .-value))))
    channel))

(defn pos [evt]
  [(- (.-pageX evt) (.-offsetLeft (.-target evt)))
   (- (.-pageY evt) (.-offsetTop (.-target evt)))])

(defn mouse-channel
  ([element event-type]
     (mouse-channel element event-type (chan)))
  ([element event-type channel]
     (let [writer #(put! channel (pos %))]
       (.addEventListener element event-type writer)
       {:channel channel
        :unsubscribe #(.removeEventListener element event-type writer)})))

(defn canvas-mousedown-channel []
  (mouse-channel interaction-canvas "mousedown"))

(defn canvas-mouseup-channel []
  (mouse-channel interaction-canvas "mouseup"))

(defn canvas-mousemove-channel []
  (mouse-channel interaction-canvas "mousemove" (chan (sliding-buffer 1))))

(def button-channel (chan))

(defn set-button-channels! [& buttons]
  (doseq [button buttons] 
    (let [id (keyword (.getAttribute button "id"))]
      (.addEventListener button "click" #(put! button-channel id)))))

(set-button-channels! line-button circle-button)


;; Drawing to canvas

(defn draw-line [ctx [px py] [qx qy]]
  (.beginPath ctx)
  (.moveTo ctx px py)
  (.lineTo ctx qx qy)
  (.stroke ctx)
  (.closePath ctx))

(defn draw-circle [ctx [cx cy] r]
  (.beginPath ctx)
  (.arc ctx cx cy r 0 (* 2 PI) true)
  (.stroke ctx)
  (.closePath ctx))

(defn clear-interaction-canvas []
  (.clearRect interaction-ctx 0 0 800 600))

;; Actions
(defmulti action identity)

(defmethod action :line [_]
  (let [mousedown (canvas-mousedown-channel)
        mouseup (canvas-mouseup-channel)
        mousemove (canvas-mousemove-channel)
        unsubscribe #(do ((:unsubscribe mousedown))
                         ((:unsubscribe mouseup))
                         ((:unsubscribe mousemove)))
        mousedown-channel (:channel mousedown)
        mouseup-channel (:channel mouseup)
        mousemove-channel (:channel mousemove)]
    (go (let [p (<! mousedown-channel)]
          (loop [] 
            (alt!
             mousemove-channel ([q] (do (clear-interaction-canvas)
                                        (draw-line interaction-ctx p q)
                                        (recur)))
             mouseup-channel ([q] (do (clear-interaction-canvas)
                                      (draw-line paint-ctx p q))))))
        (unsubscribe))))

(defmethod action :line [_]
  (let [mousedown (canvas-mousedown-channel)
        mouseup (canvas-mouseup-channel)
        mousemove (canvas-mousemove-channel)]
    (go (let [p (<! (:channel mousedown))]
          (loop [] 
            (alt!
             (:channel mousemove)
             ([q] (do (clear-interaction-canvas)
                      (draw-line interaction-ctx p q)
                      (recur)))
             (:channel mouseup) 
             ([q] (do (clear-interaction-canvas)
                      (draw-line paint-ctx p q))))))
        (do ((:unsubscribe mousedown))
            ((:unsubscribe mouseup))
            ((:unsubscribe mousemove))))))

(defmethod action :circle [_]
  (let [mousedown (canvas-mousedown-channel)
        mouseup (canvas-mouseup-channel)
        mousemove (canvas-mousemove-channel)]
    (go (let [p (<! (:channel mousedown))]
          (loop [] 
            (alt!
             (:channel mousemove)
             ([q] (do (clear-interaction-canvas)
                      (draw-circle interaction-ctx p (len p q))
                      (recur)))
             (:channel mouseup) 
             ([q] (do (clear-interaction-canvas)
                      (draw-circle paint-ctx p (len p q)))))))
        (do ((:unsubscribe mousedown))
            ((:unsubscribe mouseup))
            ((:unsubscribe mousemove))))))



;; Initialize
(defn init []
  (aset interaction-ctx "strokeStyle" "gray")
  (go 
   (while true
     (alt! button-channel ([b] (action b))
           stroke-color-channel ([color] (aset paint-ctx "strokeStyle" color))
           stroke-width-channel ([width] (aset paint-ctx "lineWidth" width))))))

