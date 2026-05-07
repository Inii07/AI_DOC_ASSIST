from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
import tempfile, os
from config import GEMINI_API_KEY, CHROMA_DB_PATH, CHUNK_SIZE, CHUNK_OVERLAP

os.environ["GOOGLE_API_KEY"] = GEMINI_API_KEY or os.getenv("GOOGLE_API_KEY", "")

embeddings = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")


def process_document(file_bytes: bytes, filename: str) -> str:
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    loader = PyPDFLoader(tmp_path)
    documents = loader.load()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP
    )
    chunks = splitter.split_documents(documents)

    Chroma.from_documents(
        documents=chunks, embedding=embeddings, persist_directory=CHROMA_DB_PATH
    )

    os.unlink(tmp_path)
    return f"Processed {len(chunks)} chunks from {filename}"


def answer_question(question: str) -> str:
    vectordb = Chroma(persist_directory=CHROMA_DB_PATH, embedding_function=embeddings)

    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.3)

    retriever = vectordb.as_retriever(search_kwargs={"k": 4})
    docs = retriever.invoke(question)

    context = "\n\n".join([doc.page_content for doc in docs])

    prompt = f"""Use the following context to answer the question.
If the answer is not in the context, say "I couldn't find that in the uploaded document."

Context:
{context}

Question: {question}

Answer:"""

    response = llm.invoke(prompt)
    return response.content
