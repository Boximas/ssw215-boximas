import os

from dotenv import load_dotenv
from openai import APIError, OpenAI
from pydantic import BaseModel, Field


load_dotenv()


class ProjectDetails(BaseModel):
    title: str = Field(min_length=1, max_length=120, description="A short project title.")
    summary: str = Field(
        min_length=1,
        max_length=500,
        description="A project summary in one or two sentences.",
    )
    technologies: list[str] = Field(description="Technologies used in the project.")


class ModelRefusalError(Exception):
    pass


class ProviderUnavailableError(Exception):
    pass


api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key) if api_key else None


def extract_project_details(notes: str) -> ProjectDetails:
    if client is None:
        raise ProviderUnavailableError("The OPENAI_API_KEY environment variable is not set")

    try:
        completion = client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            temperature=0.1,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Extract a short project title, a one- or two-sentence summary, "
                        "and a list of technologies from the user's notes."
                    ),
                },
                {"role": "user", "content": notes},
            ],
            response_format=ProjectDetails,
        )
    except APIError as error:
        raise ProviderUnavailableError("The AI provider request failed") from error

    if not completion.choices:
        raise ProviderUnavailableError("The AI provider returned no project details")

    message = completion.choices[0].message
    if message.refusal:
        raise ModelRefusalError("The AI provider refused to process these notes")
    if message.parsed is None:
        raise ProviderUnavailableError("The AI provider returned no project details")

    return message.parsed
