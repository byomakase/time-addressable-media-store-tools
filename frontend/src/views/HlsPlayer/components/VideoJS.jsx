import { useEffect, useRef } from "react";

import qualitySelectorHls from "videojs-quality-selector-hls";
import videojs from "video.js";

const VideoJS = ({ options, onReady }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current) {
      // The Video.js player needs to be _inside_ the component el for React 18 Strict Mode.
      const videoElement = document.createElement("video-js");
      videoElement.classList.add("vjs-big-play-centered");
      videoRef.current.appendChild(videoElement);
      !videojs.getPluginVersion("qualitySelectorHls") &&
        videojs.registerPlugin("qualitySelectorHls", qualitySelectorHls);
      const player = (playerRef.current = videojs(videoElement, options, () => {
        console.log("player is ready");
        onReady && onReady(player);
      }));
      player.qualitySelectorHls();
      // You could update an existing player in the `else` block here on prop change, for example:
    } else {
      const player = playerRef.current;
      player.autoplay(options.autoplay);
      player.src(options.sources);
    }

    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        videojs.deregisterPlugin("qualitySelectorHls");
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [options, videoRef, onReady]);

  useEffect(() => {
    const player = playerRef.current;
    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [playerRef]);

  // wrap player with data-vjs-player` attribute so no additional wrapper are created in the DOM
  return (
    <div data-vjs-player>
      <div ref={videoRef} />
    </div>
  );
};

export default VideoJS;
