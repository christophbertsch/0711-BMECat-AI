
export type BmecatFieldKey =
  | 'SUPPLIER_AID'
  | 'DESCRIPTION_SHORT'
  | 'DESCRIPTION_LONG'
  | 'EAN'
  | 'MANUFACTURER_AID'
  | 'MANUFACTURER_NAME'
  | 'PRICE_AMOUNT'
  | 'PRICE_CURRENCY'
  | 'PRICE_TYPE'
  | 'CATALOG_GROUP_ID'
  | 'ORDER_UNIT';

export interface BmecatField {
  key: BmecatFieldKey;
  label: string;
  description: string;
  required: boolean;
}

export const BMECAT_FIELDS: BmecatField[] = [
  {
    key: 'SUPPLIER_AID',
    label: 'Artikelnummer (SUPPLIER_AID)',
    description: 'Eindeutige Artikelnummer des Lieferanten.',
    required: true
  },
  {
    key: 'DESCRIPTION_SHORT',
    label: 'Kurzbeschreibung (DESCRIPTION_SHORT)',
    description: 'Der Name oder die kurze Beschreibung des Artikels.',
    required: true
  },
  {
    key: 'PRICE_AMOUNT',
    label: 'Preis (PRICE_AMOUNT)',
    description: 'Der Nettopreis des Artikels.',
    required: true
  },
  {
    key: 'PRICE_TYPE',
    label: 'Preistyp (price_type)',
    description: 'Art des Preises, z.B. "net_list" für Netto-Listenpreis. Wird als Attribut im <ARTICLE_PRICE> Tag verwendet.',
    required: true
  },
  {
    key: 'ORDER_UNIT',
    label: 'Bestelleinheit (ORDER_UNIT)',
    description: 'Die Einheit, in der der Artikel bestellt wird (z.B. Stück, PCE, C62).',
    required: true
  },
  {
    key: 'DESCRIPTION_LONG',
    label: 'Langbeschreibung (DESCRIPTION_LONG)',
    description: 'Eine ausführliche Beschreibung des Artikels. Kann HTML enthalten.',
    required: false
  },
  {
    key: 'EAN',
    label: 'EAN / GTIN',
    description: 'Die Europäische Artikelnummer oder Global Trade Item Number.',
    required: false
  },
  {
    key: 'MANUFACTURER_AID',
    label: 'Hersteller-Artikelnummer',
    description: 'Die Artikelnummer des ursprünglichen Herstellers.',
    required: false
  },
  {
    key: 'MANUFACTURER_NAME',
    label: 'Herstellername',
    description: 'Der Name des Herstellers.',
    required: false
  },
  {
    key: 'PRICE_CURRENCY',
    label: 'Währung (PRICE_CURRENCY)',
    description: 'Währung des Preises (z.B. EUR). Wenn nicht angegeben, wird der Wert aus den Katalog-Details verwendet.',
    required: false
  },
  {
    key: 'CATALOG_GROUP_ID',
    label: 'Katalog-Gruppen-ID',
    description: 'Die ID der Produktgruppe/-kategorie, zu der der Artikel gehört. (Aus Struktur-CSV).',
    required: false
  },
];


export interface BmecatHeaderInfo {
    catalogId: string;
    catalogVersion: string;
    catalogName: string;
    supplierName: string;
    territory: string;
    currency: string;
    supplierStreet: string;
    supplierZip: string;
    supplierCity: string;
    supplierCountry: string;
    supplierEmail: string;
    supplierUrl: string;
}

export type Mapping = {
  [key: string]: string;
};

export type ParsedCsvRow = {
  [key: string]: string;
};

export interface FeatureMapping {
  id: number;
  fname: string; // CSV header for FNAME
  fvalue: string; // CSV header for FVALUE
  funit: string; // CSV header for FUNIT
}

export interface TransformedFeature {
  fname: string;
  fvalue: string;
  funit?: string;
}

export type TransformedRow = {
  features?: TransformedFeature[];
  [key: string]: string | TransformedFeature[] | undefined;
};


export interface CatalogGroup {
  id: string;
  name: string;
  parentId: string | null;
  children: CatalogGroup[];
}

export interface ParsedStructureRow {
  GROUP_ID: string;
  GROUP_NAME: string;
  PARENT_ID: string;
}

export interface StoredSpecification {
  id: number;
  name: string;
  base64Content: string;
}

// NEW types for dynamic mapping
export interface DynamicBmecatField {
  key: string;
  label: string;
  description: string;
  required: boolean;
  mappedCsvHeader?: string;
}

export interface SmartMappingResult {
  identifiedFields: DynamicBmecatField[];
  featureMappings: Omit<FeatureMapping, 'id'>[];
}
