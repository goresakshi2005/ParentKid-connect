import google.generativeai as genai
from django.conf import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

class GeminiInsightService:
    @staticmethod
    def generate_insights(assessment_data):
        prompt = f"""
        Analyze the following assessment results and provide concise insights:
        {assessment_data}
        """
        model = genai.GenerativeModel('gemini-flash-3.5')
        response = model.generate_content(prompt)
        return response.text