from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()
client = OpenAI(
	api_key= os.getenv("OPENAI_API_KEY")
)

response = client.moderations.create(
	model="omni-moderation-latest",
	input="""I hate jews""",
)

print(response)