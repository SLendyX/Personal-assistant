import "regenerator-runtime"
import React from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import Microphone from "./Microphone";

const Dictaphone = ({setTranscript}) => {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  if (!browserSupportsSpeechRecognition) {
    return <span>Browser doesn't support speech recognition.</span>;
  }

  React.useEffect(() =>{
    setTranscript(transcript)
  }, [transcript])

  return (
    <div>
      <button className="microphone" onClick={listening ? SpeechRecognition.stopListening : SpeechRecognition.startListening }><Microphone className="microphone-svg" fill={listening ? "red" : "white"}/></button>
    </div>
  );
};
export default Dictaphone;