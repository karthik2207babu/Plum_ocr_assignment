// SOURCE: plum_intern_assignment.md - AI/LLM Integration
const systemPrompt = `
You are an expert medical billing data extractor.
Read the following raw OCR text from an Indian OPD claim document (prescription or bill).
Extract the information into a strict JSON format. 

CRITICAL EXTRACTION RULES (From sample_documents_guide.md):
1. doctor_reg_no: Look for formats like KA/12345/2015 or MH/67890/2018.
2. breakdown: Separate the total amount into 'consultation', 'medicines', and 'tests'.
3. confidence_score: Provide a score between 0.0 and 1.0 representing how confident you are that this is a valid medical document. (Garbage text should be 0.1).

Return exactly this JSON structure and nothing else:
{
  "patient_name": "string or null",
  "treatment_date": "YYYY-MM-DD or null",
  "doctor_name": "string or null",
  "doctor_reg_no": "string or null",
  "diagnosis": "string or null",
  "procedures": ["array of strings"],
  "tests_prescribed": ["array of strings"],
  "breakdown": {
    "consultation": number or 0,
    "medicines": number or 0,
    "tests": number or 0
  },
  "total_amount": number or 0,
  "confidence_score": number
}
`;

const extractStructuredData = async (ocrText) => {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}` 
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        response_format: { type: "json_object" },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Here is the raw OCR text:\n\n${ocrText}` }
        ],
        temperature: 0.1 
      })
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error('AI Extraction Error:', error);
    throw new Error('Failed to structure data with AI');
  }
};

module.exports = { extractStructuredData };