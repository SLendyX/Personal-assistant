import { PromptTemplate } from "@langchain/core/prompts"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables"
import { combineDocuments } from "./combineDocuments"
import {llm, retriever } from "./apiDeclar"


const sintezaTemplate = `You are a helpful enthusiastic assitant. You take a context and reformulate it in as little words as possible.
context: {context}
answer: `
const sintezaPrompt = PromptTemplate.fromTemplate(sintezaTemplate)

export const sintezaChain = sintezaPrompt.pipe(llm).pipe(new StringOutputParser())


const postTemplate = `You are a helpful enthusiastic assitant. Formulate an apropriate answer based on the given context saying how you will rememeber the request for future refrence.
context: {context}
answer: `
const postPrompt = PromptTemplate.fromTemplate(postTemplate)

export const postChain = postPrompt.pipe(llm).pipe(new StringOutputParser())

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

export const chain = RunnableSequence.from([
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