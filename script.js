// Point this at wherever the Flask backend is running.
const API_BASE = "http://localhost:5000/api";
const RING_CIRCUMFERENCE = 326.7; // 2 * PI * r(52), matches style.css

// ---- Elements ----
const topicForm = document.getElementById("topicForm");
const topicInput = document.getElementById("topicInput");
const numQuestions = document.getElementById("numQuestions");
const generateBtn = document.getElementById("generateBtn");
const agendaStatus = document.getElementById("agendaStatus");
const questionList = document.getElementById("questionList");

const emptyState = document.getElementById("emptyState");
const activeQuestion = document.getElementById("activeQuestion");
const qIndex = document.getElementById("qIndex");
const qText = document.getElementById("qText");
const answerInput = document.getElementById("answerInput");
const evaluateBtn = document.getElementById("evaluateBtn");
const evalStatus = document.getElementById("evalStatus");

const evaluation = document.getElementById("evaluation");
const ringProgress = document.getElementById("ringProgress");
const scoreValue = document.getElementById("scoreValue");
const feedbackText = document.getElementById("feedbackText");
const strengthsList = document.getElementById("strengthsList");
const improvementsList = document.getElementById("improvementsList");

// ---- State ----
let questions = [];       // [{ text, answered, evaluation }]
let currentIndex = null;

// ---- Generate questions ----
topicForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const topic = topicInput.value.trim();

  if (!topic) {
    setAgendaStatus("Tell me what role or topic you're preparing for first.", true);
    return;
  }

  setAgendaStatus("Generating questions...", false);
  generateBtn.disabled = true;
  questionList.innerHTML = "";

  try {
    const res = await fetch(`${API_BASE}/generate-questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic,
        num_questions: Number(numQuestions.value),
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setAgendaStatus(data.error || "Something went wrong.", true);
      return;
    }

    questions = data.questions.map((text) => ({ text, answered: false, evaluation: null }));
    currentIndex = null;
    renderQuestionList();
    setAgendaStatus(`${questions.length} questions ready. Pick one to begin.`, false);
    selectQuestion(0);
  } catch (err) {
    setAgendaStatus("Couldn't reach the backend. Is app.py running on port 5000?", true);
    console.error(err);
  } finally {
    generateBtn.disabled = false;
  }
});

function setAgendaStatus(msg, isError) {
  agendaStatus.textContent = msg;
  agendaStatus.classList.toggle("error", Boolean(isError));
}

// ---- Render question agenda ----
function renderQuestionList() {
  questionList.innerHTML = questions
    .map(
      (q, i) => `
      <li class="question-item ${q.answered ? "answered" : ""} ${i === currentIndex ? "active" : ""}" data-index="${i}">
        <span class="num">${i + 1}</span>
        <span class="qsnippet">${q.text}</span>
      </li>`
    )
    .join("");

  questionList.querySelectorAll(".question-item").forEach((el) => {
    el.addEventListener("click", () => selectQuestion(Number(el.dataset.index)));
  });
}

// ---- Select / show a question ----
function selectQuestion(index) {
  currentIndex = index;
  const q = questions[index];

  emptyState.classList.add("hidden");
  activeQuestion.classList.remove("hidden");

  qIndex.textContent = `${index + 1} of ${questions.length}`;
  qText.textContent = q.text;
  answerInput.value = "";
  evalStatus.textContent = "";

  if (q.evaluation) {
    showEvaluation(q.evaluation);
  } else {
    evaluation.classList.add("hidden");
  }

  renderQuestionList();
}

// ---- Evaluate answer ----
evaluateBtn.addEventListener("click", async () => {
  const answer = answerInput.value.trim();
  if (!answer) {
    setEvalStatus("Write an answer first.", true);
    return;
  }
  if (currentIndex === null) return;

  setEvalStatus("Evaluating...", false);
  evaluateBtn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/evaluate-answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: questions[currentIndex].text,
        answer,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setEvalStatus(data.error || "Something went wrong.", true);
      return;
    }

    questions[currentIndex].answered = true;
    questions[currentIndex].evaluation = data;
    setEvalStatus("", false);
    showEvaluation(data);
    renderQuestionList();
  } catch (err) {
    setEvalStatus("Couldn't reach the backend. Is app.py running on port 5000?", true);
    console.error(err);
  } finally {
    evaluateBtn.disabled = false;
  }
});

function setEvalStatus(msg, isError) {
  evalStatus.textContent = msg;
  evalStatus.classList.toggle("error", Boolean(isError));
}

// ---- Render evaluation report ----
function showEvaluation(data) {
  evaluation.classList.remove("hidden");

  const score = Math.max(0, Math.min(10, data.score));
  const offset = RING_CIRCUMFERENCE * (1 - score / 10);

  // Reset then animate on next frame so the transition actually plays.
  ringProgress.style.transition = "none";
  ringProgress.style.strokeDashoffset = RING_CIRCUMFERENCE;
  requestAnimationFrame(() => {
    ringProgress.style.transition = "";
    ringProgress.style.strokeDashoffset = offset;
  });

  scoreValue.textContent = score;
  feedbackText.textContent = data.feedback;

  strengthsList.innerHTML = data.strengths.map((s) => `<li>${s}</li>`).join("");
  improvementsList.innerHTML = data.improvements.map((s) => `<li>${s}</li>`).join("");
}
