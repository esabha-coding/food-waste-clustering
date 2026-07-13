from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware  # <-- ADD THIS IMPORT

app = FastAPI()

# <-- ADD THIS CORS CONFIGURATION BLOCK -->
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all websites to query your API (perfect for projects)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)