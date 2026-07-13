from fastapi import FastAPI

# Vercel needs this instance to be named exactly 'app'
app = FastAPI()

@app.get("/api/health")
def health():
    return {"status": "FastAPI is connected and running on Vercel!"}

@app.get("/api/predict")
def predict():
    return {"message": "K-Means logic placeholder"}