
import { ParsedCsvRow, Mapping, TransformedRow, BmecatFieldKey, FeatureMapping, TransformedFeature } from "../types";

/**
 * Transforms raw CSV data into a standardized array of objects where keys are BMEcat field keys.
 * This is a crucial pre-processing step to ensure the generator works with clean, unambiguous data.
 *
 * @param csvData - The array of raw data rows from the parsed CSV.
 * @param mapping - The mapping configuration for standard BMEcat keys to CSV headers.
 * @param featureMappings - An array of mapping configurations for product features.
 * @returns An array of transformed rows, ready for XML generation.
 */
export function transformCsvData(csvData: ParsedCsvRow[], mapping: Mapping, featureMappings: FeatureMapping[]): TransformedRow[] {
  if (!csvData) {
    return [];
  }

  return csvData.map(csvRow => {
    const transformedRow: TransformedRow = {};

    // Iterate over the defined mapping for standard fields
    for (const key in mapping) {
      const bmecatKey = key as BmecatFieldKey;
      const csvHeader = mapping[bmecatKey];
      
      // If a mapping exists for this BMEcat key and the CSV header is valid
      if (csvHeader && csvRow.hasOwnProperty(csvHeader)) {
        transformedRow[bmecatKey] = csvRow[csvHeader];
      }
    }

    // Handle dynamic feature mappings
    const features: TransformedFeature[] = [];
    featureMappings.forEach(fm => {
      const fname = fm.fname ? csvRow[fm.fname] : '';
      const fvalue = fm.fvalue ? csvRow[fm.fvalue] : '';
      const funit = fm.funit ? csvRow[fm.funit] : '';

      // Both name and value must exist for a feature to be valid.
      if (fname && fvalue) {
        const feature: TransformedFeature = { fname, fvalue };
        if (funit) {
          feature.funit = funit;
        }
        features.push(feature);
      }
    });


    if (features.length > 0) {
      transformedRow.features = features;
    }

    return transformedRow;
  });
}
