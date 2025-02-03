import React from "react"
import user from "./assets/user.png"
import Message from "./Message"

import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { createClient } from '@supabase/supabase-js'
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase"
import {OpenAIEmbeddings } from "@langchain/openai"

function App() {

  const [messageArray, setMessageArray] = React.useState([])
  const [input, setInput] = React.useState("")

  function sendMessage(e){
    e.preventDefault()

    if(input !== ""){
      setMessageArray(oldMessageArray => {
        return [
          ...oldMessageArray,
          {message: input, timeStamp: new Date(), isUser: true}
        ]
      })

      
    }
    setInput("")
  }

  async function uploadMessage(){
    try {
      const text = input
      setInput("")
      const splitter = new RecursiveCharacterTextSplitter({
          chunkSize: 200,
          chunkOverlap: 20,
          separators: ['\n\n', '\n', ' ', ''] // default setting
      })
      
      const output = await splitter.createDocuments([text])
      
      const sbApiKey = import.meta.env.VITE_SUPABASE_KEY
      const sbUrl = import.meta.env.VITE_SUPABASE_URL
      const openAIApiKey = import.meta.env.VITE_OPENAI_API_KEY
      
      const client = createClient(sbUrl, sbApiKey)
      
      await SupabaseVectorStore.fromDocuments(
          output,
          new OpenAIEmbeddings({ openAIApiKey }),
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
        </div>
      </form>

    </>
  )
}

export default App
