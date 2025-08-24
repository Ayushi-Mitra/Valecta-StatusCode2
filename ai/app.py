import os
import base64
import json
from pathlib import Path
from flask import Flask, request, jsonify, after_this_request, Response, send_file
from main import skills_extract, check_with_jd, path_predictor
from interview import ai_client, ai_review, text_to_speech
from interview import start_interview as ai_start_interview, end_interview
from plagiarism.final import plagiarism_checker

app = Flask(__name__)

RESUME_FOLDER = "store"
os.makedirs(RESUME_FOLDER, exist_ok=True)

VOICE_FOLDER = "human-audio-store"
os.makedirs(VOICE_FOLDER, exist_ok=True)

AI_VOICE_FOLDER = "ai-audio-store"
os.makedirs(AI_VOICE_FOLDER, exist_ok=True)

@app.route('/resume-review', methods=['POST'])
def resume_review():
    try:
        data = request.get_json()
        
        if not data or "filedata" not in data or "job_description" not in data:
            return jsonify({"error": "Invalid request, need filedata"}), 400
        
        filedata = data["filedata"]
        job_description = data["job_description"]

        pdf_bytes = base64.b64decode(filedata)

        file_path = os.path.join(RESUME_FOLDER, "resume.pdf")
        with open(file_path, "wb") as f:
            f.write(pdf_bytes)

        extracted_skills = skills_extract(file_path)

        plagarism_check = plagiarism_checker(file_path)

        ai_review = check_with_jd(extracted_skills, job_description)

        if os.path.exists(file_path):
            os.remove(file_path)

        ai_output = True
        if not plagarism_check or not ai_review:
            ai_output = False

        return jsonify({"message": "Candidate Status", "value": f"{ai_output}"}), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route('/interview', methods=['POST'])
def interview():
    # data = request.get_json()
        
    # if not data or "human_answer_text" not in data or "job_description" not in data:
    #     return jsonify({"error": "Invalid request"}), 400
    

    # data = request.form.to_dict()
    # question = data["question"]
    # model_answer = data["model_answer"]
    # human_answer = data["human_answer_text"]
    # job_description = data["job_description"]
    # Get form-data
    data = request.form.to_dict()

    # Validate inputs
    if not data or "human_answer_text" not in data or "job_description" not in data:
        return jsonify({"error": "Invalid request"}), 400

    # Extract safely
    question = data.get("question", "")
    model_answer = data.get("model_answer", "")
    human_answer = data["human_answer_text"]
    job_description = data["job_description"]

    score = ai_review(job_description, question, model_answer, human_answer)

    qna = ai_client(job_description, human_answer)
    question = qna.get("question")
    model_answer = qna.get("answer")

    ai_voice_path = Path(__file__).parent / AI_VOICE_FOLDER / "ai_voice.mp3"
    text_to_speech(question, ai_voice_path)

    @after_this_request
    def remove_files(response):
        try:
            os.remove(ai_voice_path)
        except Exception as e:
            print("File delete error: ", e)

        return response
    
    with open(ai_voice_path, "rb") as f:
        file_bytes = f.read()
    boundary = "valecta"

    json_part = f"--{boundary}\r\nContent-Type: application/json\r\n\r\n{json.dumps({ "question": f"{question}", "model_answer": f"{model_answer}", "score": f"{score}" })}\r\n"

    file_part = f"--{boundary}\r\nContent-Type: audio/mpeg\r\nContent-Disposition: attachment; filename=processed.mp3\r\n\r\n"

    closing = f"\r\n--{boundary}--\r\n"

    body = json_part.encode() + file_part.encode() + file_bytes + closing.encode()

    return Response(body, mimetype=f"multipart/mixed; boundary={boundary}")


@app.route("/start-interview", methods=["POST"])
def start_interview():
    data = request.get_json()
    job_description = data["job_description"]

    ai_starter = ai_start_interview(job_description)
    ai_voice_path = Path(__file__).parent / AI_VOICE_FOLDER / "ai_voice.mp3"
    text_to_speech(ai_starter, ai_voice_path)

    @after_this_request
    def remove_files(response):
        try:
            os.remove(ai_voice_path)
        except Exception as e:
            print("File delete error: ", e)

        return response
    
    return send_file(
        ai_voice_path,
        as_attachment=True,
        download_name="intro.mp3",
        mimetype="audio/mpeg"
    )


@app.route('/path-predict', methods=['POST'])
def path_predict():
    try:
        data = request.get_json()
        
        if not data or "filedata" not in data:
            return jsonify({"error": "Invalid request, need filedata"}), 400
        
        filedata = data["filedata"]
        pdf_bytes = base64.b64decode(filedata)

        file_path = os.path.join(RESUME_FOLDER, "resume.pdf")
        with open(file_path, "wb") as f:
            f.write(pdf_bytes)

        extracted_skills = skills_extract(file_path)

        predicted_path = path_predictor(extracted_skills)

        if os.path.exists(file_path):
            os.remove(file_path)

        return jsonify({"message": "Path is predicted", "value": f"{predicted_path}"}), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
# @app.route("/end-interview", methods=["GET"])
# def interview_end():
#     file_path = Path(__file__).parent / AI_VOICE_FOLDER / "outro.mp3"
#     ai_outro_text = end_interview()
#     text_to_speech(ai_outro_text, file_path)

#     @after_this_request
#     def remove_files(response):
#         try:
#             os.remove(file_path)
#         except Exception as e:
#             print("File delete error: ", e)

#         return response

#     return send_file(file_path, as_attachment=True)

@app.route("/end-interview", methods=["POST"])
def interview_end():
    # ✅ Get form-data
    data = request.form.to_dict()

    if not data or "human_answer" not in data or "job_description" not in data:
        return jsonify({"error": "Invalid request"}), 400

    job_description = data["job_description"]
    question = data.get("question", "")
    model_answer = data.get("model_answer", "")
    human_answer = data["human_answer"]

    # ✅ Step 1: Score the last answer
    score = ai_review(job_description, question, model_answer, human_answer)

    # ✅ Step 2: Generate outro text
    outro_text = end_interview(job_description, human_answer)

    # ✅ Step 3: Generate outro audio
    file_path = Path(__file__).parent / AI_VOICE_FOLDER / "outro.mp3"
    text_to_speech(outro_text, file_path)

    @after_this_request
    def remove_files(response):
        try:
            os.remove(file_path)
        except Exception as e:
            print("File delete error: ", e)
        return response

    with open(file_path, "rb") as f:
        file_bytes = f.read()

    boundary = "valecta"

    # ✅ JSON payload (outro + score)
    json_part = (
        f"--{boundary}\r\n"
        f"Content-Type: application/json\r\n\r\n"
        f"{json.dumps({ 'outro': outro_text, 'score': score })}\r\n"
    )

    # ✅ Audio part
    file_part = (
        f"--{boundary}\r\n"
        f"Content-Type: audio/mpeg\r\n"
        f"Content-Disposition: attachment; filename=outro.mp3\r\n\r\n"
    )

    closing = f"\r\n--{boundary}--\r\n"

    body = json_part.encode() + file_part.encode() + file_bytes + closing.encode()

    return Response(body, mimetype=f"multipart/mixed; boundary={boundary}")

    
if __name__ == "__main__":
    app.run(debug=True)
