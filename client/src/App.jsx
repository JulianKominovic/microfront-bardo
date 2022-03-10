import "./App.css";
import { Card, Avatar, Text, Button } from "@nextui-org/react";
import { NextUIProvider, createTheme, Loading } from "@nextui-org/react";
import React, { useEffect, useState, useRef } from "react";
import { useSwipeable } from "react-swipeable";
const darkTheme = createTheme({
  type: "dark",
});

function randomIntFromInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function App() {
  const [data, setData] = useState(null);
  const [videMeta, setVideoMeta] = useState(null);
  const [canPlay, setCanPlay] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0.0);
  const [loop, setLoop] = useState(null);
  const audioRef = useRef(null);
  const [volumeSliderHeight, setVolumeSliderHeight] = useState(0);
  const [authBardo, setAuthBardo] = useState(false);

  const BASE_URL = "http://localhost:8000";

  const handlers = useSwipeable({
    onSwiping: (e) => {
      // HIGHER IS LESS SENSIBILITY
      const sensibility = 600;
      if (e.deltaY === 0) return;
      if (e.dir === "Up") {
        audioRef.current.volume =
          audioRef.current.volume - e.deltaY / sensibility <= 1
            ? audioRef.current.volume - e.deltaY / sensibility
            : 1.0;
      } else {
        audioRef.current.volume =
          audioRef.current.volume - e.deltaY / sensibility >= 0
            ? audioRef.current.volume - e.deltaY / sensibility
            : 0;
      }

      setVolumeSliderHeight(audioRef.current.volume);
    },
  });

  const handleVolumeScroll = (ev) => {
    if (audioRef.current === null) return;
    if (ev.deltaY > 0) {
      audioRef.current.volume =
        audioRef.current.volume >= 0.03 ? audioRef.current.volume - 0.03 : 0;
    } else {
      audioRef.current.volume =
        audioRef.current.volume <= 0.97 ? audioRef.current.volume + 0.03 : 1.0;
    }
    setVolumeSliderHeight(audioRef.current.volume);
  };

  const fetchData = async () => {
    const response = await fetch(BASE_URL + "/get")
      .then((res) => res.json())
      .catch(() => () => {
        console.log(
          "Ha ocurrido un error al cargar la musica. Intentando de nuevo..."
        );
        fetchData();
      });
    const random = randomIntFromInterval(0, response.tracks.length - 1);
    setData(response.tracks[random]);
    return await fetch(BASE_URL + "/play/" + response.tracks[random].videoId)
      .then((res) => res.json())
      .then(({ _ydl_info }) =>
        setVideoMeta({
          thumb: _ydl_info.thumbnails[_ydl_info.thumbnails.length - 1].url,
          url: _ydl_info.requested_formats.find((e) => e.fps === null).url,
        })
      )
      .catch(() => {
        console.log(
          "Ha ocurrido un error al cargar la musica. Intentando de nuevo..."
        );
        fetchData();
      });
  };

  const setupLoop = (startingNumber = 0) => {
    setCurrentTime(startingNumber);
    setLoop(setInterval(() => setCurrentTime((prev) => prev + 1), 1000));
  };

  const handlePause = () => {
    clearInterval(loop);
    setIsPlaying(false);
  };

  const handlePlay = (e) => {
    setupLoop(audioRef.current.currentTime);
    setIsPlaying(true);
    setAuthBardo(true);
  };

  const resetSong = () => {
    setIsPlaying(false);
    setCanPlay(false);
    clearInterval(loop);
    setCurrentTime(0);
  };

  const skipFiveSeconds = () => {
    if (currentTime < audioRef.current.duration - 5) {
      clearInterval(loop);
      audioRef.current.currentTime = audioRef.current.currentTime + 5;
      setupLoop(audioRef.current.currentTime);
    } else {
      clearInterval(loop);
      audioRef.current.currentTime = audioRef.current.duration;
      resetSong();
    }
  };

  const rewindFiveSeconds = () => {
    if (audioRef.current.currentTime > 5) {
      clearInterval(loop);
      audioRef.current.currentTime = audioRef.current.currentTime - 5;
      setupLoop(audioRef.current.currentTime);
    } else {
      clearInterval(loop);
      audioRef.current.currentTime = 0;
      setupLoop(audioRef.current.currentTime);
    }
  };

  const changeSong = () => {
    handlePause();
    fetchData().then(() => {
      resetSong();
      if (authBardo && canPlay) {
        audioRef.current.play();
      }
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    resetSong();
  }, [data]);

  return (
    <NextUIProvider theme={darkTheme}>
      <Card
        css={{
          w: "400px",
          h: "672px",
          position: "relative",
          overflow: "visible",
          borderRadius: "$sm",
          justifyContent: "space-between",
        }}
        className="bardo__card"
      >
        {data !== null ? (
          <>
            {videMeta !== null ? (
              <>
                <img
                  src={videMeta.thumb}
                  css={{ background: "black" }}
                  alt="Music background"
                  className="bardo__background"
                />
                <video
                  style={{ display: "none" }}
                  ref={audioRef}
                  src={videMeta.url}
                  onCanPlay={() => {
                    audioRef.current.volume = 0.5;
                    setVolumeSliderHeight(audioRef.current.volume);
                    setCanPlay(true);
                  }}
                  onEnded={resetSong}
                  onPlay={handlePlay}
                  onPause={handlePause}
                ></video>
              </>
            ) : null}

            <Card.Body
              onWheel={handleVolumeScroll}
              className="bardo__body"
              {...handlers}
              css={{
                position: "absolute",
                zIndex: 3,

                w: "100%",
                padding: 0,
              }}
            >
              <div className="bardo__body-avatar-container">
                <Avatar
                  style={{
                    width: 120,
                    height: 120,
                    position: "relative",
                    zIndex: 4,
                  }}
                  size="xl"
                  src={data.thumbnails[1].url}
                  color="gradient"
                  bordered
                  className="bardo__body-avatar"
                  draggable="false"
                />
              </div>
              <Text
                h1
                size={30}
                css={{
                  textGradient: "45deg, $blue500 -20%, $pink500 50%",
                  position: "relative",
                  zIndex: 4,
                }}
                weight="bold"
              >
                {data.title}
              </Text>
              <Text
                h1
                size={16}
                weight="normal"
                style={{ position: "relative", zIndex: 4 }}
              >
                {data.artists[0].name}
              </Text>
            </Card.Body>
            <Card.Footer
              className="bardo__footer"
              style={{
                marginTop: `${!data || !videMeta ? "511px" : "0px"}`,
              }}
            >
              <div className="bardo__footer-controls">
                <svg
                  onClick={() => rewindFiveSeconds()}
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="nextui-c-PJLV nextui-c-PJLV-igsmDXe-css svg-icon"
                >
                  <path
                    d="M12.38 16.92h-2.29c-.41 0-.75-.34-.75-.75s.34-.75.75-.75h2.29a.781.781 0 0 0 0-1.56h-2.29c-.24 0-.47-.12-.61-.31a.746.746 0 0 1-.1-.68l.76-2.29c.1-.31.39-.51.71-.51h3.06c.41 0 .75.34.75.75s-.34.75-.75.75h-2.52l-.26.79h1.25a2.279 2.279 0 1 1 0 4.56Z"
                    fill="currentColor"
                  ></path>
                  <path
                    d="M12.002 3.48c-.08 0-.16.01-.24.01l.82-1.02c.26-.32.21-.8-.12-1.05a.747.747 0 0 0-1.05.12L9.442 4c-.01.01-.01.02-.02.04-.03.04-.05.09-.07.13-.02.05-.04.09-.05.13-.01.05-.01.09-.01.14v.2c.01.03.03.05.04.08.02.05.04.09.06.14.03.04.06.08.1.11.02.03.03.06.06.08.02.01.03.02.05.03a.3.3 0 0 0 .08.04c.05.03.11.05.17.06.03.02.06.02.09.02s.05.01.08.01.05-.01.07-.02c.03 0 .06.01.09 0 .64-.15 1.24-.22 1.81-.22 4.49 0 8.14 3.65 8.14 8.14s-3.65 8.14-8.14 8.14-8.14-3.65-8.14-8.14c0-1.74.57-3.42 1.65-4.86a.75.75 0 0 0-1.2-.9c-1.28 1.7-1.95 3.69-1.95 5.76 0 5.31 4.32 9.64 9.64 9.64s9.64-4.32 9.64-9.64-4.32-9.63-9.63-9.63Z"
                    fill="currentColor"
                  ></path>
                </svg>

                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="nextui-c-PJLV nextui-c-PJLV-igsmDXe-css svg-icon"
                  onClick={changeSong}
                >
                  <path
                    d="M17.69 20.09c-.57 0-1.13-.15-1.65-.45l-8.29-4.78A3.284 3.284 0 0 1 6.1 12c0-1.19.62-2.26 1.65-2.86l8.29-4.78c1.03-.6 2.26-.6 3.3 0s1.65 1.66 1.65 2.86v9.57c0 1.19-.62 2.26-1.65 2.86-.52.29-1.08.44-1.65.44Zm0-14.68c-.31 0-.62.08-.9.24L8.5 10.43c-.56.33-.9.91-.9 1.56s.34 1.23.9 1.56l8.29 4.78c.56.33 1.24.33 1.8 0s.9-.91.9-1.56V7.2c0-.65-.34-1.23-.9-1.56-.28-.14-.59-.23-.9-.23ZM3.76 18.93c-.41 0-.75-.34-.75-.75V5.82c0-.41.34-.75.75-.75s.75.34.75.75v12.36c0 .41-.34.75-.75.75Z"
                    fill="currentColor"
                  ></path>
                </svg>

                <Button
                  color="gradient"
                  auto
                  ghost
                  rounded
                  onClick={() => {
                    if (canPlay) {
                      if (audioRef.current.paused) {
                        audioRef.current.play();
                      } else {
                        audioRef.current.pause();
                      }
                    }
                  }}
                >
                  {canPlay ? (
                    isPlaying ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="19"
                        viewBox="0 0 16 19"
                        fill="none"
                      >
                        <rect width="6" height="19" rx="2" fill="white" />
                        <rect
                          x="10"
                          width="6"
                          height="19"
                          rx="2"
                          fill="white"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="16"
                        height="19"
                        viewBox="0 0 14.71 17.33"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="nextui-c-PJLV nextui-c-PJLV-iefFevj-css"
                      >
                        <path
                          d="M.647 2.245v14.527c0 .252.07.5.202.716.133.217.324.396.552.516a1.486 1.486 0 0 0 1.48-.055l11.802-7.263c.207-.126.377-.301.495-.508a1.366 1.366 0 0 0 0-1.353 1.424 1.424 0 0 0-.495-.509L2.881 1.066a1.48 1.48 0 0 0-2.032.462 1.363 1.363 0 0 0-.202.717Z"
                          fill="#ffffff"
                        ></path>
                      </svg>
                    )
                  ) : (
                    <Loading color="white" size="sm" />
                  )}
                </Button>

                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="nextui-c-PJLV nextui-c-PJLV-igsmDXe-css svg-icon"
                  onClick={changeSong}
                >
                  <path
                    d="M6.31 20.09c-.57 0-1.13-.15-1.65-.45a3.252 3.252 0 0 1-1.65-2.86V7.21c0-1.19.62-2.26 1.65-2.86 1.04-.6 2.27-.6 3.3 0l8.29 4.78c1.03.6 1.65 1.67 1.65 2.86s-.62 2.26-1.65 2.86l-8.29 4.78c-.52.31-1.08.46-1.65.46Zm0-14.68a1.797 1.797 0 0 0-1.8 1.8v9.57c0 .65.34 1.23.9 1.56.56.32 1.24.33 1.8 0l8.29-4.78c.56-.33.9-.91.9-1.56s-.34-1.23-.9-1.56L7.21 5.66c-.28-.16-.59-.25-.9-.25ZM20.24 18.93c-.41 0-.75-.34-.75-.75V5.82c0-.41.34-.75.75-.75s.75.34.75.75v12.36c0 .41-.33.75-.75.75Z"
                    fill="currentColor"
                  ></path>
                </svg>

                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  onClick={() => skipFiveSeconds()}
                  className="nextui-c-PJLV nextui-c-PJLV-igsmDXe-css svg-icon"
                >
                  <path
                    d="M19.48 7.09a.747.747 0 1 0-1.16.94c1.13 1.4 1.76 3.06 1.82 4.8.16 4.48-3.36 8.26-7.85 8.41-4.49.16-8.26-3.36-8.42-7.84-.16-4.48 3.36-8.26 7.85-8.41.57-.02 1.17.03 1.82.16.04.01.08 0 .12 0 .1.05.22.08.33.08a.7.7 0 0 0 .47-.17c.32-.26.37-.73.12-1.05L12.6 1.54a.748.748 0 0 0-1.05-.12c-.32.26-.37.73-.12 1.05l.83 1.03c-.19-.01-.39-.02-.58-.01-5.31.18-9.48 4.66-9.29 9.97.19 5.31 4.66 9.48 9.97 9.29 5.31-.19 9.48-4.66 9.29-9.97a9.629 9.629 0 0 0-2.17-5.69Z"
                    fill="currentColor"
                  ></path>
                  <path
                    d="M12.38 16.92h-2.29c-.41 0-.75-.34-.75-.75s.34-.75.75-.75h2.29a.781.781 0 0 0 0-1.56h-2.29c-.24 0-.47-.12-.61-.31a.746.746 0 0 1-.1-.68l.76-2.29c.1-.31.39-.51.71-.51h3.06c.41 0 .75.34.75.75s-.34.75-.75.75h-2.52l-.26.79h1.25a2.279 2.279 0 1 1 0 4.56Z"
                    fill="currentColor"
                  ></path>
                </svg>
              </div>
            </Card.Footer>
          </>
        ) : null}
        <div
          className="bardo__backdrop"
          style={{
            backdropFilter: `blur(10px) saturate(${volumeSliderHeight * 2})`,
          }}
        ></div>
      </Card>
      {audioRef.current !== null ? (
        <div
          className="bardo__footer-progress"
          style={{
            height: ` ${(currentTime / audioRef.current.duration) * 100}%`,
            width: ` ${(currentTime / audioRef.current.duration) * 100}%`,
          }}
          color="secondary"
        ></div>
      ) : null}
    </NextUIProvider>
  );
}

export default App;
