import React from "react"
import user from "./assets/user.png"
import Message from "./Message"

function App() {

  const [messageArray, setMessageArray] = React.useState([])
  const [input, setInput] = React.useState("")

  function sendMessage(e){
    e.preventDefault()
    const {target: form} = e
    setMessageArray(oldMessageArray => {
      return [
        ...oldMessageArray,
        {message: input, timeStamp: new Date(), isUser: true}
      ]
    })
    setInput("")
  }

  const messageElements = messageArray.map(
    ({message, timeStamp, isUser}, index) => {
      const timeString = timeStamp.toLocaleTimeString("en-us", 
        {
          weekday: "long",
          timeStyle: "medium"
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

  console.log(messageElements)

  return (
    <>
      <img src={user} className="main-img" alt="ai assitant profile picture"/>
      <h1>AI</h1>
      <div className="message-container">
        {messageElements}
      </div>
      <form onSubmit={sendMessage}>
        <textarea onChange={e => setInput(e.target.value)} value={input} placeholder="What's happening?">

        </textarea>
        <button className="submit-btn">Ask</button>
      </form>

    </>
  )
}

export default App
