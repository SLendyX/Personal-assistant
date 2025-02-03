import { createClient } from '@supabase/supabase-js'
import {OpenAIEmbeddings } from "@langchain/openai"
import { ChatOpenAI } from "@langchain/openai"
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase"

const sbApiKey = import.meta.env.VITE_SUPABASE_KEY
const sbUrl = import.meta.env.VITE_SUPABASE_URL
const openAIApiKey = import.meta.env.VITE_OPENAI_API_KEY

export const llm = new ChatOpenAI({ openAIApiKey })
export const client = createClient(sbUrl, sbApiKey)
export const embeddings = new OpenAIEmbeddings({ openAIApiKey })

const vectorStore = new SupabaseVectorStore(embeddings, {
client,
tableName: 'documents',
queryName: 'match_documents'
})
  
export const retriever = vectorStore.asRetriever()