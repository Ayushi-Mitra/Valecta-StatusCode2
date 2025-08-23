import base64
from openai import OpenAI
from dotenv import load_dotenv
from pathlib import Path
import json
from pydantic import BaseModel
# import os
# from pinecone import Pinecone
# from neo4j import GraphDatabase
# from typing import List, Dict
# import time
# import uuid

load_dotenv()
# PINECONE_ENV = os.getenv("PINECONE_ENVIRONMENT")
# PINECONE_INDEX = os.getenv("PINECONE_INDEX_NAME")
# PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
# NEO4J_URI = os.getenv("NEO4J_URI")
# NEO4J_USER = os.getenv("NEO4J_USERNAME")
# NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")
# EMBED_DIM = 3072

client = OpenAI()

# pc = Pinecone(api_key=PINECONE_API_KEY)
# if PINECONE_INDEX not in [index.name for index in pc.list_indexes()]:
#     pc.create_index(
#         name=PINECONE_INDEX,
#         dimension=EMBED_DIM,
#         metric="cosine"
#     )
# pinecone_index = pc.Index(PINECONE_INDEX)

# neo_driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

class BoolModel(BaseModel):
    response: bool

class StringModel(BaseModel):
    response: str

# class EvalModel(BaseModel):
#     score: float
#     feedback: str
#     key_points: List[str]

# def uuid_now(prefix=""):
#     return f"{prefix}{uuid.uuid4().hex[:8]}_{int(time.time())}"

def skills_extract(file_path: str):
    # file_path = Path(__file__).parent / "store" / "resume.pdf"
    with open(file_path, "rb") as f:
        data = f.read()

    base64_string = base64.b64encode(data).decode("utf-8")

    SYSTEM_PROMPT = f"""
        You are an intelligent AI agent that takes a resume image as the input and you properly analyse the image to find out about the qualifications of the person, specifically their skills or any type of specializations they have and give the output in the proper JSON format.

        Output JSON Format:
        {{
            "skills" : list of skills the person have all together
        }}
    """

    response = client.responses.create(
        model="gpt-5",
        input=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_file",
                        "filename": "resume.pdf",
                        "file_data": f"data:application/pdf;base64,{base64_string}",
                    }
                ],
            },
        ]
    )

    output_json = json.loads(response.output_text)

    return output_json["skills"]

def check_with_jd(skills, jd: str):
    
    SYSTEM_PROMPT = f"""
        You are an intelligent agent that checks whether a person is capable for the job whose description is given by the user having following skills. Follow the output JSON format.

        Skills:
        {skills} 
    """

    response = client.beta.chat.completions.parse(
        model="gpt-4.1",
        messages=[
            { "role": "system", "content": SYSTEM_PROMPT },
            { "role": "user", "content": jd}
        ],
        response_format=BoolModel
    )
    output = json.loads(response.choices[0].message.content)
    return output['response']

def path_predictor(skills):
    SYSTEM_PROMPT = f"""
        You are a career advisor AI. Your job is to analyze user's current skills or work experience(if any) and recommend realistic and strategic carrer paths they can pursue.

        For each recommendation:
        - Explain why it fits their skills and strengths.
        - Provide a short roadmap of next steps (skills to learn, certifications, or experiences to gain).
        - Include both immediate job options and long-term career growth possibilities.
        - If some of their skills are in demand in multiple industries, explain the cross-industry opportunities.

        Your tone should be encouraging, practical, and specific. Avoid vague suggestions.
        Follow the output JSON format.
    """
    #The complete solution should be one string not a JSON however when giving output just use the format.
    #Use when string required

    response = client.beta.chat.completions.parse(
        model="gpt-4.1",
        messages=[
            { "role": "system", "content": SYSTEM_PROMPT },
            { "role": "user", "content": f"Skills: {skills}"}
        ],
        response_format=StringModel
    )
    output = json.loads(response.choices[0].message.content)
    return output['response']

# def generate_questions(skills, jd):
#     SYSTEM_PROMPT = f"""
#         You are an interview designer. Given Skills: {skills}, and Job Description: {jd}, produce 15 interview questions tailored to those skills, mixing conceptual, practical and behavioural questions. Output JSON: an array called 'questions' where every item contains:
#         - id(string)
#         - text(string): the question to ask

#         Return only valid JSON.
#     """

#     resp = client.chat.completions.create(
#         model="gpt-4.1",
#         messages=[
#             {"role": "system", "content": SYSTEM_PROMPT},
#             {"role": "user", "content": "Produce the questions now."}
#         ]
#     )

#     parsed = json.loads(resp.choices[0].message.content)
#     questions = parsed.get("questions")
#     return questions

# def evaluate_answer(question, answers, skills) -> EvalModel:
#     result = [
#         {"id": q["id"], "question": q["text"], "answer": a["text"]} for q,a in zip(question, answers)
#     ]

#     SYSTEM_PROMPT = f"""
#         You are expert technical interviewer and grader. The candidate answered the questions below.
#         The user will provide an array of objects that will contain:
#         [ {{"id": id of the question, "question": the question, "answer": the answer provided by user }} ]

#         Scoring rules:
#         - score is 0-10 (10 = perfect, 0 = irrelevant)
#         - the score should be calculated as an average of all the questions answered
#         - Base score on correctness, completeness, clarity, and relevance to the job skills: {skills}.

#         Return JSON exactly like: {{ "score": <float>, "feedback": "<short actionable feedback>", "key_points": ["...","..."] }}
#         Do not include any extra commentary outside the JSON.
#     """

#     response = client.responses.create(
#         model="gpt-5",
#         input=[
#             {"role": "system", "content": SYSTEM_PROMPT},
#             {"role": "user", "content": result}
#         ]
#     )

#     parsed = json.loads(response.output_text)
#     score = float(parsed.get("score"))
#     feedback = parsed.get("feedback")
#     key_points = parsed.get("key_points")

#     return EvalModel(score, feedback, key_points)


# if __name__ == "__main__":
#     file_path = Path(__file__).parent / "temp-store" / "resume.pdf"
#     skills = skills_extract(file_path)
#     # jd = input("Job Description: ")
#     # ok = check_with_jd(skills=skills, jd)
#     path = path_predictor(skills=skills)
#     print(path)