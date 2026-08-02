from dotenv import load_dotenv
load_dotenv()

from flask import Flask, jsonify, request
from flask_cors import CORS

from chains import build_evaluation_chain, build_question_chain

app = Flask(__name__)
CORS(app)  # local dev only — the frontend runs on a different port

# Chains are built once at startup and reused across requests.
question_chain = build_question_chain()
evaluation_chain = build_evaluation_chain()


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/api/generate-questions", methods=["POST"])
def generate_questions():
    data = request.get_json(silent=True) or {}
    topic = (data.get("topic") or "").strip()
    num_questions = data.get("num_questions", 5)

    if not topic:
        return jsonify({"error": "Please describe the role or topic you're preparing for."}), 400

    try:
        num_questions = max(3, min(int(num_questions), 8))
    except (TypeError, ValueError):
        num_questions = 5

    try:
        result = question_chain.invoke({"topic": topic, "num_questions": num_questions})
        return jsonify({"questions": result.questions})
    except Exception as exc:
        app.logger.exception("Question generation failed")
        return jsonify({"error": f"Couldn't generate questions: {exc}"}), 500


@app.route("/api/evaluate-answer", methods=["POST"])
def evaluate_answer():
    data = request.get_json(silent=True) or {}
    question = (data.get("question") or "").strip()
    answer = (data.get("answer") or "").strip()

    if not question or not answer:
        return jsonify({"error": "Both a question and an answer are required."}), 400

    try:
        result = evaluation_chain.invoke({"question": question, "answer": answer})
        return jsonify(result.model_dump())
    except Exception as exc:
        app.logger.exception("Evaluation failed")
        return jsonify({"error": f"Couldn't evaluate that answer: {exc}"}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
