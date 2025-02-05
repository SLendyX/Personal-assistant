import React from "react"
import user from "./assets/user.png"
import Message from "./Message"

import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase"

import { formatConvHistory } from "./utils/formatConvHistory"
import { embeddings, client} from "./utils/apiDeclar"
import { chain, sintezaChain, postChain } from "./utils/prompts"
import mic from "./assets/mic.svg"

import createModule from "@transcribe/shout";
import { FileTranscriber } from "@transcribe/transcriber";

const transcriber = new FileTranscriber({
  createModule,
  model: "ggml-tiny-q5_1.bin", // path to ggml model file
});
await transcriber.init();

function App() {
  const [messageArray, setMessageArray] = React.useState([])
  const [input, setInput] = React.useState("")
  const [recordingStop, setRecordingStop] = React.useState(false)
  const [recorder, setRecorder] = React.useState(new MicRecorder({
    bitRate: 128
  }))

  


  function renderMessages(message, isUser){
    setMessageArray(oldMessageArray => {
      return [
        ...oldMessageArray,
        {message: message, timeStamp: new Date(), isUser}
      ]
    })
  }

  async function sendMessage(e){
    e.preventDefault()

    if(input !== ""){
      renderMessages(input, true)

      const question = input
      setInput("")

      const response = await chain.invoke({
        question: question,
        conv_history: formatConvHistory(messageArray)
      })

      renderMessages(response, false)

    }
    setInput("")
  }

  async function uploadMessage(){
    try {
      const text = input
      setInput("")

      renderMessages(text, true)

      const response = await postChain.invoke({
        context: text
      })

      renderMessages(response, false)

      const splitter = new RecursiveCharacterTextSplitter({
          chunkSize: 200,
          chunkOverlap: 20,
          separators: ['\n\n', '\n', ' ', ''] // default setting
      })
      
      const sinteza = await sintezaChain.invoke({context:text})
      const output = await splitter.createDocuments([sinteza])
      

      await SupabaseVectorStore.fromDocuments(
          output,
          embeddings,
          {
             client,
             tableName: 'documents',
          }
      )
      
    } catch (err) {
      console.log(err)
    }
  }

  const messageElements = messageArray.map(
    ({message, timeStamp, isUser}, index) => {
      const timeString = timeStamp.toLocaleTimeString("en", 
        {
          weekday: "short",
          hour: "2-digit",
          minute: "2-digit"
        })

      return(
      <Message 
        key={index}
        isUser={isUser} 
        timeStamp={timeString}>
        {message}
      </Message>)
    }
    )

    function record(){
      if(!recordingStop){
        try{
          recorder.start()
        }catch(err){
          console.log(err)
        }
        
      }else{
        recorder.stop().getMp3().then(async ([buffer, blob]) => {
          const file = new File([blob], "voice.mp3", {
            type: blob.type,
            lastModified: Date.now(),
          });

          const result = await transcriber.transcribe(URL.createObjectURL(file));

          console.log(result)

        }).catch((e) => {
          alert('We could not retrieve your message');
          console.log(e);
        });
      }

      setRecordingStop(oldRecordingStop => !oldRecordingStop)
    }

    React.useEffect(()=>{
      window.scroll(0, window.scrollY+2000)
    },[messageArray])


  return (
    <>
      <img src={user} className="main-img" alt="ai assitant profile picture"/>
      <h1>AI</h1>
      <div className="message-container">
        {messageElements}
      </div>
      <form  
        // onKeyDown={pressedEnter} 
        onSubmit={e => e.preventDefault()}
      >
        <textarea onChange={e => setInput(e.target.value)} value={input} placeholder="What's happening?">

        </textarea>
        <div className="btn-container">
          <button onClick={uploadMessage} className="capture-btn">Capture</button>
          <button onClick={sendMessage} className="submit-btn">Ask</button>
          <button onClick={record}><img src={mic}/></button>
        </div>
      </form>

    </>
  )
}

export default App
