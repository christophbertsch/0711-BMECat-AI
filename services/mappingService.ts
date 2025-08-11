import { GoogleGenAI, Type } from "@google/genai";
import { DynamicBmecatField, FeatureMapping, SmartMappingResult } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getSmartMapping(
  csvHeaders: string[],
  specPdfBase64: string | null,
  specBsbContent: string | null,
  specXmlTemplate: string | null
): Promise<SmartMappingResult> {
  
  const schema = {
    type: Type.OBJECT,
    properties: {
        identifiedFields: {
            type: Type.ARRAY,
            description: "Array of all identified BMEcat fields from the specification, with their corresponding CSV header mapping.",
            items: {
                type: Type.OBJECT,
                properties: {
                    key: { type: Type.STRING, description: "The BMEcat XML tag name (e.g., SUPPLIER_AID, PRODUCT_DETAILS)." },
                    label: { type: Type.STRING, description: "A user-friendly label for the field (e.g., 'Artikelnummer', 'Produktdetails')." },
                    description: { type: Type.STRING, description: "A brief description of the field's purpose." },
                    required: { type: Type.BOOLEAN, description: "Whether the field appears to be mandatory based on the spec." },
                    mappedCsvHeader: { type: Type.STRING, description: "The CSV header that maps to this key. This field is optional and should be omitted if no mapping is found." }
                },
                required: ["key", "label", "description", "required"]
            }
        },
        featureMappings: {
            type: Type.ARRAY,
            description: "Array of detected product feature mappings.",
            items: {
                type: Type.OBJECT,
                properties: {
                    fname: { type: Type.STRING, description: "The CSV header for the feature name (FNAME)." },
                    fvalue: { type: Type.STRING, description: "The CSV header for the feature value (FVALUE)." },
                    funit: { type: Type.STRING, description: "The CSV header for the feature unit (FUNIT, optional)." }
                },
                required: ["fname", "fvalue"]
            }
        }
    },
    required: ["identifiedFields", "featureMappings"]
  };

  const systemInstruction = `You are an expert assistant for mapping product data from a CSV file to a specific BMEcat XML structure. Your task is to analyze the provided CSV headers and, if available, BMEcat specification files (PDF, BSB, XML) to create a comprehensive mapping. Your entire response MUST be a single, raw JSON object conforming to the provided schema. Do not add any conversational text, explanations, or markdown formatting.`;

  const userPrompt = `
You are tasked with a two-step process:
1.  **Discover ALL BMEcat Fields:** Analyze the provided specification sources to find ALL possible BMEcat XML element tags meant for product data. This includes version-specific tags like <PRODUCT_DETAILS> for BMEcat 2005. You MUST follow this strict priority order for the sources: 1. BSB Content, 2. PDF Specification, 3. XML Snippet. If no specification is provided, you MUST fall back to a comprehensive list of standard BMEcat 1.2 fields. For each identified tag, determine a user-friendly label, a brief description, and whether it's mandatory. The \`key\` must be the exact XML tag name.
2.  **Map ALL CSV Columns:** Analyze the provided list of CSV headers. For EACH BMEcat field you identified, intelligently find the best matching CSV header. If a good match is found, include the \`mappedCsvHeader\` property. Also, analyze all CSV headers to find any groups that represent product features (e.g., a name, value, and optional unit) and map them to the \`featureMappings\` array. Try to find a mapping for as many CSV columns as possible.

**Crucial Mapping Hint:** Pay close attention to domain-specific synonyms. For example, the German term "Supplier product number" is synonymous with "Artikelnummer" and MUST be mapped to the BMEcat field \`SUPPLIER_AID\`. Use this knowledge to improve mapping accuracy.

**Available CSV Headers:**
[${csvHeaders.join(', ')}]

${specBsbContent ? `**Source 1 (Highest Priority): BSB Specification**\nThis file defines the exact BMEcat structure. Extract all relevant product data tags from it.\n\`\`\`xml\n${specBsbContent}\n\`\`\`` : ''}
${specXmlTemplate ? `**Source 3 (Lowest Priority): XML Snippet**\nUse this as a structural example. Extract all relevant product data tags from it.\n\`\`\`xml\n${specXmlTemplate}\n\`\`\`` : ''}

**Crucial Instructions for Output:**
- Your response MUST include an \`identifiedFields\` array containing an object for EVERY field you discovered in the specification.
- For each discovered field, if you find a suitable mapping in the CSV headers, add a \`mappedCsvHeader\` property with the exact header string. If no mapping is found, you MUST omit this property for that field.
- Your response MUST include a \`featureMappings\` array. Identify columns that represent product characteristics (e.g., 'Merkmalname1', 'Merkmalwert1', 'Einheit1') and create corresponding objects.
- The value for any mapping MUST be one of the exact strings from the "Available CSV Headers" list. Do not invent headers.
`;

  const parts: any[] = [{ text: userPrompt }];
  if (specPdfBase64) {
      parts.push({ text: `**Source 2 (Medium Priority): PDF Specification**\nThis PDF describes the required BMEcat structure. Analyze its text and tables to find all field names.` });
      parts.push({
          inlineData: { mimeType: 'application/pdf', data: specPdfBase64 },
      });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: parts },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.2,
      },
    });

    const jsonText = response.text.trim();
    if (!jsonText) {
        console.warn("Gemini API returned empty text for smart mapping.");
        return { identifiedFields: [], featureMappings: [] };
    }
    const suggestedResult = JSON.parse(jsonText);

    // --- Validation and Cleaning ---
    const cleanedResult: SmartMappingResult = {
      identifiedFields: [],
      featureMappings: []
    };

    // Clean identified fields and their mappings
    if (suggestedResult.identifiedFields && Array.isArray(suggestedResult.identifiedFields)) {
      suggestedResult.identifiedFields.forEach((field: any) => {
        if (field && typeof field === 'object' && field.key && field.label) {
          const cleanedField: DynamicBmecatField = {
            key: field.key,
            label: field.label,
            description: field.description || '',
            required: !!field.required,
          };
          if (field.mappedCsvHeader && csvHeaders.includes(field.mappedCsvHeader)) {
            cleanedField.mappedCsvHeader = field.mappedCsvHeader;
          }
          cleanedResult.identifiedFields.push(cleanedField);
        }
      });
    }

    // Clean feature mappings
    if (suggestedResult.featureMappings && Array.isArray(suggestedResult.featureMappings)) {
      suggestedResult.featureMappings.forEach((fm: any) => {
        if (fm && typeof fm === 'object') {
          const { fname, fvalue, funit } = fm;
          // FNAME and FVALUE must exist and be valid headers
          if (fname && csvHeaders.includes(fname) && fvalue && csvHeaders.includes(fvalue)) {
            const cleanFm: Omit<FeatureMapping, 'id'> = { fname, fvalue, funit: '' };
            // FUNIT is optional, but if present, must be a valid header
            if (funit && csvHeaders.includes(funit)) {
              cleanFm.funit = funit;
            }
            cleanedResult.featureMappings.push(cleanFm);
          }
        }
      });
    }
    
    return cleanedResult;
  } catch (error) {
    console.error("Error getting smart mapping from Gemini API:", error);
    // Throw a user-friendly error to be caught by the UI layer.
    const errorString = String(error);
    if(errorString.includes("PDF")){
        throw new Error("Die KI-Zuordnung konnte nicht abgeschlossen werden, da das PDF nicht verarbeitet werden konnte. Prüfen Sie, ob es eine valide, textbasierte PDF-Datei ist.");
    }
    throw new Error("Die KI-Zuordnung konnte nicht abgeschlossen werden. Bitte prüfen Sie Ihre Spezifikationsdateien oder versuchen Sie es erneut.");
  }
}