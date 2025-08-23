from openai import OpenAI
from pathlib import Path
from dotenv import load_dotenv
from pydantic import BaseModel
import json

load_dotenv()

client = OpenAI()

class Interview_question(BaseModel):
    question: str
    answer: str

class Grade(BaseModel):
    score: float


def speech_to_text(audio_file_path: str):
    audio_file = open(audio_file_path, "rb")
    transcription = client.audio.transcriptions.create(
        model="gpt-4o-transcribe",
        file=audio_file
    )

    return transcription.text

def text_to_speech(text: str, speech_file_path: str):
    with client.audio.speech.with_streaming_response.create(
        model="tts-1",
        voice="alloy",
        input=text,
        instructions="Speak in a professional manner."
    ) as response:
        response.stream_to_file(speech_file_path)

def start_interview(job_description: str):
    SYSTEM_PROMPT = f"""
        You are going to take an interview of a candidate for this post {job_description}. Your job is to properly greet the candidate and ask him to introduce himself. Also at the same time ask him about his prior experiences in this field, the projects he made and why is he interested for this job.
        Give the output in the following format:
        {{"ai_starter": string}}
        You don't need any user input, you can directly give the output.
    """

    response = client.chat.completions.create(
        model="gpt-4.1",
        messages=[
            { "role": "system", "content": SYSTEM_PROMPT }
        ]
    )

    parsed = json.loads(response.choices[0].message.content)
    return parsed.get("ai_starter")

def end_interview():
    SYSTEM_PROMPT = """
        You are an AI interviewer. Your job is to end the interview. You should prepare an outro where you give best wishes to the candidate for his future prospects and also ask him to wait for response from our side.
        You don't need any user input. You need to give output in the proper JSON format.

        Proper JSON Format:
        {{
            "outro": string
        }}
    """

    response = client.chat.completions.create(
        model="gpt-4.1",
        messages=[
            { "role": "system", "content": SYSTEM_PROMPT }
        ]
    )

    parsed = json.loads(response.choices[0].message.content)
    return parsed.get("outro")

def ai_client(job_description: str, user_answer_path: str):
    user_answer = speech_to_text(user_answer_path)

    SYSTEM_PROMPT = f"""
        You are an AI interviewer. Your job is to ask a question and also provide its model answer.
        You should behave in a way that a real human interviewer does. Like instead of asking pre-formulated questions, you should make questions having the context of the previous answer the candidate give, and you might ask on something that particularly seems interesting while being related at the same time.
        You will get the candidate's previous answer as an user input.
        When you make the question, it should be formulated in such a way that it matches the requirement for the job.
        Also change the difficulty level of the question depending on the candidate's performance in the previous answers.
        The job description is provided here:
        {job_description}
        You have to follow the Output JSON properly.
    """
    response = client.beta.chat.completions.parse(
        model="gpt-4.1",
        messages=[
            { "role": "system", "content": SYSTEM_PROMPT },
            { "role": "user", "content": user_answer }
        ],
        response_format=Interview_question
    )
    return(json.loads(response.choices[0].message.content))

def ai_review(job_description: str, question: str, model_answer: str, answer_audio_path: str) -> float:
    audio_text = speech_to_text(answer_audio_path)

    SYSTEM_PROMPT = f"""
        You are an intelligent AI supervisor that reviews the answer of a candidate against a model answer and grade their answer.
        Scoring rules:
        - score is a float value between 0-10 (10 = perfect, 0 = irrelevant)
        - Base score on correctness, completeness, clarity, and relevance to the job: {job_description}.

        The question is {question} and the model answer is {model_answer}.
    """
    response = client.beta.chat.completions.parse(
        model="gpt-4.1",
        messages=[
            { "role": "system", "content": SYSTEM_PROMPT },
            { "role": "user", "content": audio_text}
        ],
        response_format=Grade
    )
    try:
        parsed = json.loads(response.choices[0].message.content)
        return float(parsed.get("score", 0.0))
    except Exception:
        return 0.0

# if __name__ == "__main__":
#     # path = Path(__file__).parent / "audio_store" / "Recording.m4a"
#     # text = speech_to_text(path)
#     # print(text)
#     path = Path(__file__).parent / "audio_store" / "speech.mp3"
#     # text = "I am an AI interviewer designed to take interview and evaluate them on their responses."
#     job_description_text = "Software engineer skilled in python"
#     # qna = ai_client(job_description_text)
#     # question = qna.get("question")
#     # model_answer = qna.get("answer")
#     # question = "Explain the difference between a list and a tuple in Python. When would you use one over the other?"
#     # model_answer = "In Python, both lists and tuples are used to store collections of items. However, lists are mutable, meaning their elements can be changed, added, or removed after creation, while tuples are immutable, meaning their contents cannot be changed once created. You would use a list when you need a collection that might need to be altered during runtime, such as adding or removing items. Tuples, on the other hand, are used for collections of items that should remain constant throughout the program, and their immutability can be leveraged for safer, faster code, and for use as dictionary keys."
#     # ai_review(job_description_text, question, model_answer, path)
#     ai_voice = start_interview(job_description_text)
#     text_to_speech(ai_voice, path)
