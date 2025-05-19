from groq import Groq
from huggingface_hub import InferenceClient
from langchain_groq import ChatGroq
from langchain.prompts import PromptTemplate
from dotenv import load_dotenv
import os
import traceback
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# API keys from environment variables
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
HF_API_KEY = os.getenv('HF_API_KEY')

def transcribe_audio(file_path):
    """
    Transcribes audio file to text using Groq's Whisper model.
    
    Args:
        file_path (str): Path to the audio file
        
    Returns:
        str: Transcribed text
    """
    logger.info(f"Transcribing audio file: {file_path}")
    
    if not GROQ_API_KEY:
        logger.error("GROQ_API_KEY not set in environment")
        return "Error: GROQ_API_KEY not set"
    
    try:
        client = Groq(api_key=GROQ_API_KEY)
        
        with open(file_path, "rb") as file:
            transcription = client.audio.transcriptions.create(
                file=(file_path, file.read()),
                model="whisper-large-v3",
                response_format="verbose_json",
            )
        
        return transcription.text
    except Exception as e:
        logger.error(f"Transcription error: {str(e)}")
        return f"Error during transcription: {str(e)}"

def translate_to_english(text):
    """
    Translates text to English if needed using Groq's LLaMA 3 model.

    Args:
        text (str): The text to potentially translate

    Returns:
        str: The English translation or original text if already in English
    """
    logger.info("Checking if translation is needed")
    
    if not GROQ_API_KEY:
        logger.error("GROQ_API_KEY not set in environment")
        return text
    
    try:
        # First check if translation is needed
        client = Groq(api_key=GROQ_API_KEY)
        
        detection_response = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {"role": "system", "content": "You detect languages. Respond with only the language name in one word."},
                {"role": "user", "content": f"What language is this: {text[:100]}"}
            ]
        )
        
        detected_language = detection_response.choices[0].message.content.strip().lower()
        logger.info(f"Detected language: {detected_language}")
        
        # If not English, translate
        if "english" not in detected_language:
            translation_response = client.chat.completions.create(
                model="llama3-70b-8192",
                messages=[
                    {"role": "system", "content": "You are a translator. Translate text to English accurately."},
                    {"role": "user", "content": f"Translate this to English: {text}"}
                ]
            )
            
            translated_text = translation_response.choices[0].message.content
            logger.info("Translation completed")
            return translated_text
        else:
            logger.info("Text is already in English, skipping translation")
            return text
            
    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        return text  # Return original text on error

def generate_medical_summary(english_text):
    """
    Generates a medical summary from English text using Hugging Face's biomedical model.

    Args:
        english_text (str): The English text to summarize

    Returns:
        str: Medical summary based on the input text
    """
    logger.info("Generating medical summary")
    
    if not HF_API_KEY:
        logger.error("HF_API_KEY not set in environment")
        return "Error: HF_API_KEY not set"
    
    try:
        client = InferenceClient(
            provider="nebius",
            api_key=HF_API_KEY
        )
        
        completion = client.chat.completions.create(
            model="aaditya/Llama3-OpenBioLLM-70B",
            messages=[
                {
                    "role": "system",
                    "content": "You are an AI assistant for doctors. Based on the patient's description, provide a detailed point-by-point description of what the patient is trying to communicate to the doctor. Do not provide any diagnosis."
                },
                {
                    "role": "user",
                    "content": english_text
                }
            ],
            max_tokens=2000,
        )

        return completion.choices[0].message.content
    except Exception as e:
        logger.error(f"Medical summary error: {str(e)}")
        return f"Error generating medical summary: {str(e)}"

def format_final_summary(medical_summary):
    """
    Formats the medical summary into a more structured format.
    
    Args:
        medical_summary (str): The detailed medical summary
        
    Returns:
        str: Formatted summary with main problem and point-by-point issues
    """
    logger.info("Formatting final summary")
    
    if not GROQ_API_KEY:
        logger.error("GROQ_API_KEY not set in environment")
        return medical_summary
    
    try:
        # Initialize the ChatGroq model
        os.environ["GROQ_API_KEY"] = GROQ_API_KEY
        llm = ChatGroq(model_name="llama3-8b-8192")
        
        # Create a prompt template
        template = """
        Format this medical context into a clear, structured summary for a doctor:
        1. The first line should identify the major problem faced by the patient.
        2. The rest should be a point-by-point list of all other problems mentioned.
        3. Do not add any diagnosis or information not contained in the original text.
        
        Medical context: {user_query}
        """
        
        prompt = PromptTemplate(
            input_variables=["user_query"],
            template=template
        )
        
        # Use the modern RunnableSequence approach
        chain = prompt | llm
        
        # Invoke the chain
        response = chain.invoke({"user_query": medical_summary})
        
        # Extract the content from the response
        if hasattr(response, 'content'):
            return response.content
        return str(response)
    except Exception as e:
        logger.error(f"Final summary formatting error: {str(e)}")
        return medical_summary  # Return original on error

def process_audio_file(file_path):
    """
    Process an audio file through the complete pipeline:
    1. Transcribe audio to text
    2. Translate text to English (if needed)
    3. Generate medical summary
    4. Format final summary
    
    Args:
        file_path (str): Path to the audio file
        
    Returns:
        dict: Results of each processing step
    """
    try:
        # Step 1: Transcribe audio
        logger.info(f"Starting processing of file: {file_path}")
        transcribed_text = transcribe_audio(file_path)
        
        # Step 2: Translate to English if needed
        translated_text = translate_to_english(transcribed_text)
        
        # Step 3: Generate medical summary
        medical_summary = generate_medical_summary(translated_text)
        
        # Step 4: Format final summary
        final_summary = format_final_summary(medical_summary)
        
        # Return all results
        return {
            "transcription": transcribed_text,
            "translation": translated_text,
            "medical_summary": medical_summary,
            "final_summary": final_summary,
            "status": "completed"
        }
    except Exception as e:
        logger.error(f"Error in process_audio_file: {str(e)}")
        logger.error(traceback.format_exc())
        
        # Return a more informative error that can be displayed to the user
        return {
            "error": f"Processing failed: {str(e)}",
            "transcription": "Error during transcription",
            "translation": "Error during translation",
            "medical_summary": "Error generating medical summary",
            "final_summary": "Error formatting final summary",
            "status": "error"
        }