
import { StoredSpecification } from '../types';

const STORAGE_KEY = 'hollys-bmecat-specs';

/**
 * Retrieves all stored specifications from localStorage.
 * @returns An array of StoredSpecification objects.
 */
export function getStoredSpecifications(): StoredSpecification[] {
  try {
    const specsJson = localStorage.getItem(STORAGE_KEY);
    return specsJson ? JSON.parse(specsJson) : [];
  } catch (error) {
    console.error("Error reading specifications from localStorage", error);
    // In case of corruption, clear the invalid data.
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

/**
 * Saves a new specification to localStorage.
 * @param name The user-defined name for the specification.
 * @param base64Content The base64-encoded content of the PDF file.
 * @returns The newly created StoredSpecification object.
 */
export function saveSpecification(name: string, base64Content: string): StoredSpecification {
  const specs = getStoredSpecifications();
  const newSpec: StoredSpecification = {
    id: Date.now(),
    name,
    base64Content
  };
  const updatedSpecs = [...specs, newSpec];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSpecs));
  return newSpec;
}

/**
 * Deletes a specification from localStorage by its ID.
 * @param id The ID of the specification to delete.
 */
export function deleteSpecification(id: number): void {
  const specs = getStoredSpecifications();
  const updatedSpecs = specs.filter(spec => spec.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSpecs));
}