from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware  # <-- ADD THIS IMPORT

app = FastAPI()

# <-- ADD THIS CORS MIDDLEWARE BLOCK -->
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all domains (including your Vercel frontend) to access the API
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)