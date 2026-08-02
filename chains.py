"""
The two LangChain pipelines that power the app:

1. question_chain  — takes a role/topic, returns a list of interview questions
2. evaluation_chain — takes a question + candidate answer, returns a structured
                       score, strengths, improvements, and overall feedback

Both use PydanticOutputParser so the LLM's response is coerced into a typed
object instead of free-form text we'd have to guess at parsing.
"""

from typing import List

from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

from llm import get_llm


# ---------- Schemas ----------

class QuestionSet(BaseModel):
    questions: List[str] = Field(
        description="A list of distinct, well-formed interview questions."
    )


class Evaluation(BaseModel):
    score: int = Field(description="Score from 1 (weak) to 10 (excellent).")
    strengths: List[str] = Field(
        description="2-4 short bullet points on what the answer did well."
    )
    improvements: List[str] = Field(
        description="2-4 short bullet points on what could be improved."
    )
    feedback: str = Field(
        description="A short (2-4 sentence) coaching summary, written directly to the candidate."
    )


# ---------- Chain builders ----------

def build_question_chain():
    parser = PydanticOutputParser(pydantic_object=QuestionSet)

    prompt = ChatPromptTemplate.from_messages([
        ("system",
         "You are an experienced technical interviewer and career coach. "
         "You write clear, realistic interview questions — the kind an "
         "actual hiring panel would ask, not generic trivia."),
        ("human",
         "Generate exactly {num_questions} interview questions for a "
         "candidate preparing for this role or topic:\n\n\"{topic}\"\n\n"
         "Mix in a couple of behavioral questions if the role calls for it, "
         "alongside the technical ones. Keep each question self-contained.\n\n"
         "{format_instructions}"),
    ]).partial(format_instructions=parser.get_format_instructions())

    return prompt | get_llm(temperature=0.6) | parser


def build_evaluation_chain():
    parser = PydanticOutputParser(pydantic_object=Evaluation)

    prompt = ChatPromptTemplate.from_messages([
        ("system",
         "You are a supportive but honest interview coach. You evaluate "
         "answers the way a thoughtful senior hiring manager would: fair, "
         "specific, and constructive. Never inflate the score to be nice — "
         "a mediocre answer gets a mediocre score, with clear reasoning."),
        ("human",
         "Interview question:\n\"{question}\"\n\n"
         "Candidate's answer:\n\"{answer}\"\n\n"
         "Evaluate this answer.\n\n{format_instructions}"),
    ]).partial(format_instructions=parser.get_format_instructions())

    return prompt | get_llm(temperature=0.3) | parser
