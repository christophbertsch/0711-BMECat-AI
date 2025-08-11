import { GoogleGenAI, Type } from "@google/genai";
import { BmecatHeaderInfo, TransformedRow, CatalogGroup, ParsedStructureRow, TransformedFeature } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Extracts the first <ARTICLE> element from an XML string to use as a context snippet.
 * This prevents sending overly large template files to the AI, thus avoiding token limit errors.
 * @param xmlString The full XML content of the template file.
 * @returns The string of the first <ARTICLE> element, or null if not found.
 */
function extractFirstArticleSnippet(xmlString: string): string | null {
    if (!xmlString) return null;
    // Case-insensitive, multiline match for the first <ARTICLE> element.
    const match = xmlString.match(/<ARTICLE.*?>[\s\S]*?<\/ARTICLE>/i);
    return match ? match[0] : null;
}

function escapeXml(unsafe: string): string {
    if(typeof unsafe !== 'string') return '';
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}

const buildGroupTree = (groups: ParsedStructureRow[]): CatalogGroup[] => {
    const groupMap = new Map<string, CatalogGroup>();
    const rootGroups: CatalogGroup[] = [];

    groups.forEach(g => {
        groupMap.set(g.GROUP_ID, {
            id: g.GROUP_ID,
            name: g.GROUP_NAME,
            parentId: g.PARENT_ID || null,
            children: []
        });
    });

    groups.forEach(g => {
        const group = groupMap.get(g.GROUP_ID);
        if (!group) return;

        if (g.PARENT_ID && groupMap.has(g.PARENT_ID)) {
            const parent = groupMap.get(g.PARENT_ID);
            parent?.children.push(group);
        } else {
            rootGroups.push(group);
        }
    });

    return rootGroups;
};

const renderGroupSystemXml = (groups: CatalogGroup[], level: number = 0): string => {
    let xml = '';
    const indent = ' '.repeat((level + 1) * 2);
    groups.forEach(group => {
        xml += `\n${indent}<GROUP>`;
        xml += `\n${indent}  <GROUP_ID>${escapeXml(group.id)}</GROUP_ID>`;
        xml += `\n${indent}  <GROUP_NAME>${escapeXml(group.name)}</GROUP_NAME>`;
        if (group.children.length > 0) {
            xml += renderGroupSystemXml(group.children, level + 1);
        }
        xml += `\n${indent}</GROUP>`;
    });
    return xml;
};

const renderArticleToGroupMapXml = (data: TransformedRow[]): string => {
    return data
        .filter(row => row['SUPPLIER_AID'] && row['CATALOG_GROUP_ID'])
        .map(row => `
    <ARTICLE_TO_GROUP_MAP>
      <ART_ID>${escapeXml(row['SUPPLIER_AID']! as string)}</ART_ID>
      <CATALOG_GROUP_ID>${escapeXml(row['CATALOG_GROUP_ID']! as string)}</CATALOG_GROUP_ID>
    </ARTICLE_TO_GROUP_MAP>`)
        .join('');
};

function generateHeaderXml(headerInfo: BmecatHeaderInfo): string {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0];
  
    return `<HEADER>
    <CATALOG>
      <LANGUAGE>deu</LANGUAGE>
      <CATALOG_ID>${escapeXml(headerInfo.catalogId)}</CATALOG_ID>
      <CATALOG_VERSION>${escapeXml(headerInfo.catalogVersion)}</CATALOG_VERSION>
      <CATALOG_NAME>${escapeXml(headerInfo.catalogName)}</CATALOG_NAME>
      <DATETIME type="generation_date">
        <DATE>${date}</DATE>
        <TIME>${time}</TIME>
      </DATETIME>
      <TERRITORY>${escapeXml(headerInfo.territory)}</TERRITORY>
      <CURRENCY>${escapeXml(headerInfo.currency)}</CURRENCY>
    </CATALOG>
    <SUPPLIER>
      <SUPPLIER_NAME>${escapeXml(headerInfo.supplierName)}</SUPPLIER_NAME>
      <ADDRESS type="supplier">
        <STREET>${escapeXml(headerInfo.supplierStreet)}</STREET>
        <ZIP>${escapeXml(headerInfo.supplierZip)}</ZIP>
        <CITY>${escapeXml(headerInfo.supplierCity)}</CITY>
        <COUNTRY>${escapeXml(headerInfo.supplierCountry)}</COUNTRY>
        <EMAIL>${escapeXml(headerInfo.supplierEmail)}</EMAIL>
        <URL>${escapeXml(headerInfo.supplierUrl)}</URL>
      </ADDRESS>
    </SUPPLIER>
  </HEADER>`;
}

function generateFeaturesXml(features: TransformedFeature[] | undefined): string {
    if (!features || features.length === 0) {
        return '';
    }
    const featuresXml = features
      .map(feature => {
        // FNAME and FVALUE are guaranteed by the data transformer
        let featureBlock = `
        <FEATURE>
          <FNAME>${escapeXml(feature.fname)}</FNAME>
          <FVALUE>${escapeXml(feature.fvalue)}</FVALUE>`;
        if (feature.funit) {
          featureBlock += `
          <FUNIT>${escapeXml(feature.funit)}</FUNIT>`;
        }
        featureBlock += `
        </FEATURE>`;
        return featureBlock;
      })
      .join('');
  
    if (!featuresXml.trim()) return '';

    return `
      <PRODUCT_FEATURES>${featuresXml}
      </PRODUCT_FEATURES>`;
}

function generateArticleXml(row: TransformedRow): string {
  const get = (field: string): string => (row[field] as string) || '';
  
  const supplierAid = get('SUPPLIER_AID');
  if (!supplierAid) return '';

  const price = get('PRICE_AMOUNT');
  if (!price) return '';
  
  // This field is required, so a value should always exist. Fallback is for safety.
  const priceType = get('PRICE_TYPE') || 'net_list';

  return `
    <ARTICLE>
      <SUPPLIER_AID>${escapeXml(supplierAid)}</SUPPLIER_AID>
      <ARTICLE_DETAILS>
        <DESCRIPTION_SHORT>${escapeXml(get('DESCRIPTION_SHORT'))}</DESCRIPTION_SHORT>
        <DESCRIPTION_LONG><![CDATA[${get('DESCRIPTION_LONG')}]]></DESCRIPTION_LONG>
        ${get('MANUFACTURER_AID') ? `<MANUFACTURER_AID>${escapeXml(get('MANUFACTURER_AID'))}</MANUFACTURER_AID>` : ''}
        ${get('MANUFACTURER_NAME') ? `<MANUFACTURER_NAME>${escapeXml(get('MANUFACTURER_NAME'))}</MANUFACTURER_NAME>` : ''}
        ${get('EAN') ? `<EAN>${escapeXml(get('EAN'))}</EAN>` : ''}
        <ORDER_UNIT>${escapeXml(get('ORDER_UNIT'))}</ORDER_UNIT>
      </ARTICLE_DETAILS>${generateFeaturesXml(row.features)}
      <ARTICLE_PRICE_DETAILS>
        <ARTICLE_PRICE price_type="${escapeXml(priceType)}">
          <PRICE_AMOUNT>${escapeXml(price.replace(',', '.'))}</PRICE_AMOUNT>
          <PRICE_CURRENCY>${escapeXml(get('PRICE_CURRENCY') || 'EUR')}</PRICE_CURRENCY>
          <TAX>0.19</TAX>
        </ARTICLE_PRICE>
      </ARTICLE_PRICE_DETAILS>
    </ARTICLE>`;
}

/**
 * Assembles the content for the <T_NEW_CATALOG> tag, including group structure, articles, and mappings.
 * This centralized function ensures consistent output across all generation paths.
 */
function assembleTNewCatalogBody(
    articlesXml: string,
    groupSystemXml: string,
    articleToGroupMapXml: string
): string {
    let content = '';
    if (groupSystemXml.length > 0) {
        content += `\n    <CATALOG_GROUP_SYSTEM>${groupSystemXml}\n    </CATALOG_GROUP_SYSTEM>`;
    }
    content += `\n    ${articlesXml}`;
    if (articleToGroupMapXml.length > 0) {
        content += `\n    ${articleToGroupMapXml}`;
    }
    return content;
}

function generateClassicBmecat(headerInfo: BmecatHeaderInfo, data: TransformedRow[], structureData: ParsedStructureRow[]): string {
  const articlesXml = data.map(generateArticleXml).join('\n');
  const groupTree = buildGroupTree(structureData);
  const groupSystemXml = renderGroupSystemXml(groupTree);
  const articleToGroupMapXml = renderArticleToGroupMapXml(data);
  const headerXml = generateHeaderXml(headerInfo);
  
  const tNewCatalogContent = assembleTNewCatalogBody(articlesXml, groupSystemXml, articleToGroupMapXml);

  return `<?xml version="1.0" encoding="UTF-8"?>
<BMEcat version="1.2" xmlns="http://www.bmecat.org/bmecat/1.2/bmecat_new_catalog">
  ${headerXml}
  <T_NEW_CATALOG>${tNewCatalogContent}\n  </T_NEW_CATALOG>
</BMEcat>
`;
}

async function getAiArticleTemplate(
    xmlTemplateSnippet: string | null,
    pdfSpec: string | null,
    bsbContent: string | null
): Promise<string> {
    const parts: any[] = [];
    const systemInstruction = `You are an expert in various BMEcat standards (including 1.2 and 2005). Your task is to generate a single BMEcat <ARTICLE> XML element template based on the provided specification files.
- The template must use placeholders like {{FIELD_NAME}}.
- Ensure {{DESCRIPTION_LONG}} is inside a CDATA section.
- Your entire response MUST be a single, raw JSON object: { "articleTemplate": "<ARTICLE>...</ARTICLE>" }.
- Do not add any conversational text, explanations, or markdown formatting.`;

    const mainPrompt = `You are creating a BMEcat <ARTICLE> template. The exact structure must be derived from the provided specification files.
**Crucial:** Pay close attention to the BMEcat version (e.g., 1.2, 2005) indicated in the specifications. For example, BMEcat 2005 uses <PRODUCT_DETAILS> instead of <ARTICLE_DETAILS>. You MUST adapt the template to the correct version.

To determine the XML structure, you MUST follow this strict priority order for the provided sources:
1.  **BSB Specification (*.bsb):** Highest priority. Its structure is mandatory.
2.  **PDF Specification:** Medium priority. Use if no BSB file is provided.
3.  **XML Snippet:** Lowest priority. Use as a reference only if BSB/PDF are unavailable or unclear.

Generate the template using these placeholders for data mapping: {{SUPPLIER_AID}}, {{DESCRIPTION_SHORT}}, {{DESCRIPTION_LONG}}, {{EAN}}, {{PRICE_AMOUNT}}, {{PRICE_CURRENCY}}, {{MANUFACTURER_AID}}, {{MANUFACTURER_NAME}}, {{ORDER_UNIT}}, {{PRICE_TYPE}}.
- The {{PRICE_TYPE}} placeholder is for the 'price_type' attribute in the <ARTICLE_PRICE> tag.
- Replace all hardcoded data from any examples with these placeholders.
- **Inside the main article element**, immediately following the primary details block (which could be <ARTICLE_DETAILS>, <PRODUCT_DETAILS>, etc.), you MUST include this exact placeholder for dynamic features: \`<!-- {{PRODUCT_FEATURES}} -->\`. This is essential for adding product characteristics later.`;

    parts.push({ text: mainPrompt });

    if (bsbContent) {
        parts.push({ text: `--- SOURCE 1: BSB Specification (Top Priority) ---\nThis XML-based file defines the exact required structure. Adhere to it strictly.` });
        parts.push({ text: `\`\`\`xml\n${bsbContent}\n\`\`\`` });
    }

    if (pdfSpec) {
        parts.push({ text: `--- SOURCE 2: PDF Specification (Medium Priority) ---\nUse this to inform the structure if no BSB file is provided.` });
        parts.push({
            inlineData: { mimeType: 'application/pdf', data: pdfSpec },
        });
    }

    if (xmlTemplateSnippet) {
        parts.push({ text: `--- SOURCE 3: Existing XML Snippet (Lowest Priority) ---\nUse this as a structural guide only if higher priority sources are absent or unclear.` });
        parts.push({ text: `\`\`\`xml\n${xmlTemplateSnippet}\n\`\`\`` });
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: parts },
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.1,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        articleTemplate: {
                            type: Type.STRING,
                            description: "A single XML string for the <ARTICLE> element, starting with <ARTICLE> and ending with </ARTICLE>."
                        }
                    },
                    required: ["articleTemplate"]
                }
            }
        });

        const jsonText = response.text.trim();
        if (!jsonText) {
            throw new Error("AI did not return a valid JSON response (was empty).");
        }

        const jsonResponse = JSON.parse(jsonText);
        const text = (jsonResponse.articleTemplate || '').trim();
        
        // Add validation for the mandatory features placeholder to prevent features from being dropped.
        if (!text.includes('<!-- {{PRODUCT_FEATURES}} -->')) {
            console.error("AI-generated template is missing the required PRODUCT_FEATURES placeholder.", text);
            throw new Error("Die KI hat eine Vorlage ohne den notwendigen Platzhalter für Produktmerkmale generiert. Die Merkmale können nicht hinzugefügt werden.");
        }

        // Use a case-insensitive regex to validate the <ARTICLE> tag, allowing for attributes.
        const articleValidationRegex = /^<ARTICLE\b[^>]*>[\s\S]*?<\/ARTICLE>$/i;
        if (articleValidationRegex.test(text)) {
            return text;
        }
        
        console.error("Invalid <ARTICLE> template received from AI:", text);
        throw new Error("Die KI hat keine gültige <ARTICLE>-Vorlage zurückgegeben. Bitte prüfen Sie die Spezifikationen.");
    } catch (error) {
        console.error("Error getting article template from AI:", error);
        let userMessage = "Die KI konnte keine gültige Artikel-Vorlage erstellen. Bitte prüfen Sie die Eingabedateien und versuchen Sie es erneut.";
        const errorAsString = String(error);
        if (errorAsString.includes("document has no pages")) {
            userMessage = "Das hochgeladene PDF ist ungültig oder leer (hat keine Seiten). Bitte prüfen Sie die Datei.";
        } else if (errorAsString.includes("token count")) {
            userMessage = "Die Eingabedateien sind zu groß für die KI-Verarbeitung. Versuchen Sie, die Vorlagendatei zu verkleinern.";
        } else if (errorAsString.includes("JSON")) {
            userMessage = "Die KI hat in einem unerwarteten Format geantwortet. Dies ist möglicherweise ein vorübergehendes Problem. Bitte versuchen Sie es erneut.";
        } else if (errorAsString.includes("did not return a valid")) {
            userMessage = "Die KI hat eine ungültige Artikel-Vorlage zurückgegeben. Bitte versuchen Sie es erneut."
        } else if (errorAsString.includes("Platzhalter für Produktmerkmale")) {
            userMessage = errorAsString.replace("Error: ", "");
        }
        throw new Error(userMessage);
    }
}

function fillArticleTemplate(template: string, row: TransformedRow): string {
    let articleXml = template;
    const placeholders = template.match(/\{\{([A-Z_0-9]+)\}\}/g) || [];

    for (const placeholder of placeholders) {
        const key = placeholder.replace(/[{}]/g, '') as string;
        const value = (row[key] as string) || '';
        
        const regex = new RegExp(placeholder.replace(/\{/g, '\\{').replace(/\}/g, '\\}'), 'g');
        
        if (key === 'DESCRIPTION_LONG') {
            // For CDATA, don't escape. The value is inserted directly.
            articleXml = articleXml.replace(regex, value);
        } else {
            articleXml = articleXml.replace(regex, escapeXml(value));
        }
    }
    
    // Inject features, replacing the placeholder
    const featuresXml = generateFeaturesXml(row.features);
    articleXml = articleXml.replace('<!-- {{PRODUCT_FEATURES}} -->', featuresXml);

    return articleXml;
}

async function getAiBmecatBodyTemplate(
    headerInfo: BmecatHeaderInfo,
    xmlTemplate: string | null,
    pdfSpec: string | null,
    bsbContent: string | null
): Promise<string> {
    const parts: any[] = [];
    const systemInstruction = `You are an expert in various BMEcat standards (including 1.2 and 2005). Your task is to generate the main body structure of a BMEcat file based on the provided specification files.
- Start with the <BMEcat> tag. Do not include an XML declaration (<?xml ... ?>).
- The <T_NEW_CATALOG> element MUST contain exactly this placeholder: '<!-- {{T_NEW_CATALOG_CONTENT}} -->'.
- Your entire response MUST be a single, raw JSON object: { "bmecatBody": "<BMEcat>...</BMEcat>" }.
- Do not add any conversational text, explanations, or markdown formatting.`;
    
    const mainPrompt = `You are tasked with generating the main body of a BMEcat XML file, including the <HEADER>.
**The entire XML structure, including the <HEADER>, MUST be derived from the specification files provided.** Pay close attention to the BMEcat version (e.g., 1.2, 2005) indicated in the specifications.

To determine the XML structure, you MUST follow this strict priority order for the provided sources:
1.  **BSB Specification (*.bsb):** Highest priority. Its structure is mandatory.
2.  **PDF Specification:** Medium priority. Use if no BSB file is available.
3.  **Existing XML Template:** Lowest priority. Use as a guide only if other sources are absent.

Use the derived structure but populate the <HEADER> with the following specific data:
- Catalog ID: ${headerInfo.catalogId}
- Catalog Version: ${headerInfo.catalogVersion}
- Catalog Name: ${headerInfo.catalogName}
- Territory: ${headerInfo.territory}
- Currency: ${headerInfo.currency}
- Supplier Name: ${headerInfo.supplierName}
- Supplier Street: ${headerInfo.supplierStreet}
- Supplier ZIP: ${headerInfo.supplierZip}
- Supplier City: ${headerInfo.supplierCity}
- Supplier Country: ${headerInfo.supplierCountry}
- Supplier Email: ${headerInfo.supplierEmail}
- Supplier URL: ${headerInfo.supplierUrl}`;

    parts.push({ text: mainPrompt });
    
    if (bsbContent) {
        parts.push({ text: `--- SOURCE 1: BSB Specification (Top Priority) ---\nThis XML-based file defines the exact required structure for the entire BMEcat, especially the <HEADER>. Adhere to it strictly.` });
        parts.push({ text: `\`\`\`xml\n${bsbContent}\n\`\`\`` });
    }

    if (pdfSpec) {
        parts.push({ text: `--- SOURCE 2: PDF Specification (Medium Priority) ---\nUse this to inform the structure if no BSB file is provided.` });
        parts.push({ inlineData: { mimeType: 'application/pdf', data: pdfSpec } });
    }

    if (xmlTemplate) {
        const bodyTemplate = xmlTemplate
          .replace(/^\s*(<\?xml[\s\S]*?\?>)?\s*(<!DOCTYPE[\s\S]*?>)?/i, '')
          .replace(/<T_NEW_CATALOG>[\s\S]*?<\/T_NEW_CATALOG>/i, `<T_NEW_CATALOG></T_NEW_CATALOG>`);
        parts.push({ text: `--- SOURCE 3: Existing XML Snippet (Lowest Priority) ---\nUse this as a structural guide only if higher priority sources are absent or unclear.` });
        parts.push({ text: `\`\`\`xml\n${bodyTemplate.trim()}\n\`\`\`` });
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: parts },
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.1,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        bmecatBody: {
                            type: Type.STRING,
                            description: "A single XML string for the <BMEcat> body."
                        }
                    },
                    required: ["bmecatBody"]
                }
            }
        });
        
        const jsonText = response.text.trim();
        if (!jsonText) {
            throw new Error("AI did not return a valid JSON response (was empty).");
        }

        const jsonResponse = JSON.parse(jsonText);
        const text = (jsonResponse.bmecatBody || '').trim();
        
        // Use a case-insensitive regex to validate the start of the <BMEcat> tag, allowing for attributes.
        const bmecatValidationRegex = /^<BMECAT\b[^>]*>/i;
        if (bmecatValidationRegex.test(text) && text.includes('<!-- {{T_NEW_CATALOG_CONTENT}} -->')) {
            return text;
        }

        console.error("Invalid BMEcat body received from AI:", text);
        throw new Error("Die KI hat keine gültige BMEcat-Struktur mit dem erforderlichen Platzhalter zurückgegeben.");
    } catch (error) {
        console.error("Error getting BMEcat body from AI:", error);
        let userMessage = "Die KI konnte die BMEcat-Gesamtstruktur nicht erstellen. Bitte prüfen Sie Ihre Vorlagen/Spezifikationen.";
        const errorAsString = String(error);
        if (errorAsString.includes("document has no pages")) {
            userMessage = "Das hochgeladene PDF ist ungültig oder leer. Bitte laden Sie eine gültige PDF-Spezifikation hoch.";
        } else if (errorAsString.includes("JSON")) {
            userMessage = "Die KI hat in einem unerwarteten Format geantwortet. Dies ist möglicherweise ein vorübergehendes Problem. Bitte versuchen Sie es erneut.";
        } else if (errorAsString.includes("did not return a valid") || errorAsString.includes("erforderlichen Platzhalter")) {
            userMessage = "Die KI hat eine ungültige BMEcat-Struktur zurückgegeben. Bitte prüfen Sie die Spezifikationen oder versuchen Sie es erneut.";
        }
        throw new Error(userMessage);
    }
}

export async function generateBmecat(
    headerInfo: BmecatHeaderInfo, 
    data: TransformedRow[],
    template: string | null,
    structureData: ParsedStructureRow[],
    pdfSpec: string | null,
    bsbContent: string | null
): Promise<string> {

  const useAiPath = template || pdfSpec || bsbContent;

  // Path 1: Any AI-driven path (template, PDF spec, or BSB file provided).
  if (useAiPath) {
    if (template) {
        // Sub-path 1.1: Full XML template is provided.
        const articleSnippet = extractFirstArticleSnippet(template);
        const articleTemplate = await getAiArticleTemplate(articleSnippet, pdfSpec, bsbContent);

        const headerXml = generateHeaderXml(headerInfo);
        const articlesXml = data.map(row => fillArticleTemplate(articleTemplate, row)).join('\n');
        const groupTree = buildGroupTree(structureData);
        const groupSystemXml = renderGroupSystemXml(groupTree);
        const articleToGroupMapXml = renderArticleToGroupMapXml(data);

        const tNewCatalogContent = assembleTNewCatalogBody(articlesXml, groupSystemXml, articleToGroupMapXml);

        let finalXml = template;
        const headerRegex = /<HEADER>[\s\S]*?<\/HEADER>/i;
        const tNewCatalogRegex = /<T_NEW_CATALOG>[\s\S]*?<\/T_NEW_CATALOG>/i;
        
        if (headerRegex.test(finalXml)) {
            finalXml = finalXml.replace(headerRegex, headerXml);
        } else {
            console.warn("Provided template does not contain a <HEADER> tag. The generated file might be invalid.");
        }
        
        if (tNewCatalogRegex.test(finalXml)) {
            finalXml = finalXml.replace(tNewCatalogRegex, `<T_NEW_CATALOG>${tNewCatalogContent}\n  </T_NEW_CATALOG>`);
        } else {
            throw new Error("Die BMEcat-Vorlage enthält kein <T_NEW_CATALOG>-Tag. Die Artikel können nicht eingefügt werden.");
        }

        if (!finalXml.trim().startsWith('<?xml')) {
            finalXml = '<?xml version="1.0" encoding="UTF-8"?>\n' + finalXml;
        }

        return finalXml;

    } else {
        // Sub-path 1.2: AI-driven path (PDF spec or BSB, no full template).
        const xmlDeclaration = '<?xml version="1.0" encoding="UTF-8"?>';
        
        const articleTemplatePromise = getAiArticleTemplate(null, pdfSpec, bsbContent);
        const bodyTemplatePromise = getAiBmecatBodyTemplate(headerInfo, null, pdfSpec, bsbContent);
        
        const [articleTemplate, bodyTemplate] = await Promise.all([
          articleTemplatePromise,
          bodyTemplatePromise,
        ]);

        const articlesXml = data.map(row => fillArticleTemplate(articleTemplate, row)).join('\n');
        const groupTree = buildGroupTree(structureData);
        const groupSystemXml = renderGroupSystemXml(groupTree);
        const articleToGroupMapXml = renderArticleToGroupMapXml(data);

        const tNewCatalogContent = assembleTNewCatalogBody(articlesXml, groupSystemXml, articleToGroupMapXml);

        const bodyWithContent = bodyTemplate.replace('<!-- {{T_NEW_CATALOG_CONTENT}} -->', tNewCatalogContent);
        const finalXml = `${xmlDeclaration}\n${bodyWithContent}`;
        return finalXml;
    }
  }
  
  // Path 2: Classic BMEcat generation (no template, no spec, no bsb).
  return Promise.resolve(generateClassicBmecat(headerInfo, data, structureData));
}
