"""
Small factory for picking an LLM backend at runtime.

Keeping this isolated means chains.py never needs to know or care
whether it's talking to OpenAI or Anthropic — it just asks for "a chat
model" and gets one, configured from environment variables.
"""

import os


def get_llm(temperature: float = 0.4):
    provider = os.getenv("LLM_PROVIDER", "openai").lower()

    if provider == "anthropic":
        from langchain_anthropic import ChatAnthropic

        return ChatAnthropic(
            model=os.getenv("ANTHROPIC_MODEL", "claude-3-5-haiku-20241022"),
            temperature=temperature,
        )

    if provider == "openai":
        from langchain_openai import ChatOpenAI

        return ChatOpenAI(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            temperature=temperature,
        )

    raise ValueError(
        f"Unknown LLM_PROVIDER '{provider}'. Use 'openai' or 'anthropic'."
    )
