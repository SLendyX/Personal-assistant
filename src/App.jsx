import React from "react"
import user from "./assets/user.png"
import Message from "./Message"
import { combineDocuments } from "./utils/combineDocuments"
import { formatConvHistory } from "./utils/formatConvHistory"

import { PromptTemplate } from "@langchain/core/prompts"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables"
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'

import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase"

import { embeddings, llm, retriever, client} from "./utils/apiDeclar"

function App() {

  const [messageArray, setMessageArray] = React.useState([])
  const [input, setInput] = React.useState("")

  const sintezaTemplate = `You are a helpful enthusiastic assitant. You take a context and reformulate it in as little words as possible.
  context: {context}
  answer: `
  const sintezaPrompt = PromptTemplate.fromTemplate(sintezaTemplate)
  const sintezaChain = sintezaPrompt.pipe(llm).pipe(new StringOutputParser())


  const postTemplate = `You are a helpful enthusiastic assitant. Formulate an apropriate answer based on the given context saying how you will rememeber the request for future refrence.
  context: {context}
  answer: `
  const postPrompt = PromptTemplate.fromTemplate(postTemplate)
  const postChain = postPrompt.pipe(llm).pipe(new StringOutputParser())

  const answerTemplate = `You are a helpful and ethusiastic assitant who can answer a given question about the current user based in the context provided and the conversation history. Try to find the answer in the context. If the answer is not given in the context, find the answer in the conversation history if possbile. If you really don't know the answer, say "I'm sorry, I don't know the answer to that". And ask the questioner to capture the answer so you can answer it correctly in the future. Don't try to make up an answer. Always speak as if you were chatting to a friend.
  context: {context}
  conversation_history: {conv_history}
  question: {question}
  answer: `
  const answerPrompt = PromptTemplate.fromTemplate(answerTemplate)

  const standaloneQuestionTemplate = `Given some conversation history (if any) and a question, convert the question to a standalone question. 
  conversation history: {conv_history}
  question: {question} 
  standalone question: `
  const standaloneQuestionPrompt = PromptTemplate.fromTemplate(standaloneQuestionTemplate)

  const standaloneQuestionChain = standaloneQuestionPrompt
    .pipe(llm)
    .pipe(new StringOutputParser())

  const retrieverChain = RunnableSequence.from([
    prevResult => prevResult.standalone_question,
    retriever,
    combineDocuments
  ])

  const answerChain = answerPrompt
    .pipe(llm)
    .pipe(new StringOutputParser())

  const chain = RunnableSequence.from([
    {
        standalone_question: standaloneQuestionChain,
        original_input: new RunnablePassthrough()
    },
    {
        context: retrieverChain,
        question: ({ original_input }) => original_input.question,
        conv_history: ({ original_input }) => original_input.conv_history
    },
    answerChain
  ])

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
