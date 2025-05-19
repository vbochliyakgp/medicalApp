from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import os
import logging
import tempfile
import shutil
import uuid
from typing import Dict, Any
from audioProcess import process_audio_file

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)

# Create directories for file storage
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
RESULTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "results")
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)

# FastAPI setup
app = FastAPI(title="Medical Audio Processing API")

# Configure CORS to allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
app.mount("/results", StaticFiles(directory=RESULTS_DIR), name="results")

# Store processed results in memory for quick access
# In a production app, you'd use a database instead
processed_files: Dict[str, Dict[str, Any]] = {}

@app.post("/upload")
async def upload_audio(file: UploadFile = File(...)):
    """
    Upload an audio file for processing
    """
    if not file.filename.endswith((".wav", ".mp3")):
        raise HTTPException(status_code=400, detail="Only .wav and .mp3 files are allowed")
    
    try:
        # Generate a unique ID for this file
        file_id = str(uuid.uuid4())
        
        # Create a unique filename with original extension
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{file_id}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        # Save uploaded file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logger.info(f"File saved at: {file_path}")
        
        # Create file info response
        file_url = f"/uploads/{unique_filename}"
        
        return JSONResponse(content={
            "file_id": file_id,
            "filename": unique_filename,
            "file_url": file_url,
            "original_filename": file.filename,
            "status": "uploaded"
        })
    
    except Exception as e:
        logger.error(f"Error during upload: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.get("/process/{file_id}")
async def process_audio(file_id: str):
    """
    Process a previously uploaded audio file
    """
    # Check if we've already processed this file
    if file_id in processed_files:
        return processed_files[file_id]
    
    try:
        # Find the file in the uploads directory
        files = os.listdir(UPLOAD_DIR)
        matching_files = [f for f in files if f.startswith(file_id)]
        
        if not matching_files:
            raise HTTPException(status_code=404, detail=f"File with ID {file_id} not found")
        
        file_path = os.path.join(UPLOAD_DIR, matching_files[0])
        logger.info(f"Processing file: {file_path}")
        
        # Process the audio file
        result = process_audio_file(file_path)
        
        # We don't need to include the audio URL anymore
        
        # Cache the result
        processed_files[file_id] = result
        
        return JSONResponse(content=result)
    
    except Exception as e:
        logger.error(f"Error processing audio: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "error": f"Audio processing failed: {str(e)}",
                "transcription": "Error during transcription",
                "translation": "Error during translation",
                "medical_summary": "Error generating medical summary",
                "final_summary": "Error formatting final summary"
            }
        )

@app.get("/files")
def list_files():
    """
    List all uploaded audio files
    """
    try:
        if not os.path.exists(UPLOAD_DIR):
            return {"files": []}
            
        files = os.listdir(UPLOAD_DIR)
        file_data = []
        
        for filename in files:
            # Check if it has a common audio extension or starts with our UUID pattern
            if filename.lower().endswith((".wav", ".mp3", ".audio")) or len(filename.split('.')[0]) > 30:
                file_id = filename.split(".")[0]
                file_data.append({
                    "file_id": file_id,
                    "filename": filename,
                    "file_url": f"/uploads/{filename}",
                    "processed": file_id in processed_files
                })
        
        return {"files": file_data}
    
    except Exception as e:
        logger.error(f"Error listing files: {str(e)}")
        # Return empty list instead of throwing an error
        return {"files": []}

@app.get("/health")
def health_check():
    """
    Health check endpoint
    """
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)