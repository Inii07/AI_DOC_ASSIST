from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from rag_engine import process_document, answer_question

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "AI Doc Assistant is running!"}


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    contents = await file.read()
    result = process_document(contents, file.filename)
    return {"message": result}


class Question(BaseModel):
    question: str


@app.post("/ask")
def ask_question(body: Question):
    answer = answer_question(body.question)
    return {"answer": answer}
