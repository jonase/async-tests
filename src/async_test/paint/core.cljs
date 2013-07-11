(ns async-tests.paint.core
  (:require [async-tests.paint.utils :refer [PI len log by-id]]
            [cljs.core.async :refer [chan put! sliding-buffer]])
  (:require-macros [cljs.core.async.macros :refer [go alt!]]))

;; Elements on the page
(def canvas        (by-id "paint-canvas"))
(def line-button   (by-id "line"))
(def circle-button (by-id "circle"))
(def stroke-color  (by-id "stroke-color"))
(def stroke-width  (by-id "stroke-width"))

(def ctx (.getContext canvas "2d"))

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

(def canvas-click-channel
  (let [channel (chan)]
    (.addEventListener canvas
                       "mousedown"
                       #(put! channel [(- (.-pageX %) (.-offsetLeft canvas))
                                       (- (.-pageY %) (.-offsetTop canvas))]))
    channel))

(def button-channel (chan))

(defn set-button-channels! [& buttons]
  (doseq [button buttons] 
    (let [id (keyword (.getAttribute button "id"))]
      (.addEventListener button "click" #(put! button-channel id)))))

(set-button-channels! line-button circle-button)


;; Drawing to canvas

(defn draw-line [[px py] [qx qy]]
  (.beginPath ctx)
  (.moveTo ctx px py)
  (.lineTo ctx qx qy)
  (.stroke ctx)
  (.closePath ctx))

(defn draw-circle [[cx cy] r]
  (.beginPath ctx)
  (.arc ctx cx cy r 0 (* 2 PI) true)
  (.stroke ctx)
  (.closePath ctx))

;; Actions
(defmulti action identity)

(defmethod action :line [_]
  (go (let [p (<! canvas-click-channel)
            q (<! canvas-click-channel)]
        (draw-line p q))))

(defmethod action :circle [_]
  (go (let [p (<! canvas-click-channel)
            q (<! canvas-click-channel)]
        (draw-circle p (len p q)))))

;; Initialize
(defn init []
  (go 
   (while true
     (alt!
      button-channel ([b] (action b))
      stroke-color-channel ([color] (aset ctx "strokeStyle" color))
      stroke-width-channel ([width] (aset ctx "lineWidth" width))))))
