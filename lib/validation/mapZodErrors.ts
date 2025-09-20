import { z } from 'zod'

/**
 * Maps Zod validation errors to a field-specific error object
 * @param error - Zod error object
 * @returns Object with field names as keys and error messages as values
 */
export function mapZodErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {}
  
  error.errors.forEach((err) => {
    const field = err.path.join('.')
    if (field) {
      fieldErrors[field] = err.message
    }
  })
  
  return fieldErrors
}

/**
 * Maps Zod validation errors to a field-specific error object with fallback
 * @param result - Result from Zod safeParse
 * @returns Object with field names as keys and error messages as values, or empty object if valid
 */
export function mapZodResult<T>(
  result: z.SafeParseReturnType<T, T>
): Record<string, string> {
  if (result.success) {
    return {}
  }
  
  return mapZodErrors(result.error)
}

/**
 * Gets the first error message for a specific field
 * @param errors - Field errors object from mapZodErrors
 * @param field - Field name to get error for
 * @returns Error message or undefined if no error
 */
export function getFieldError(
  errors: Record<string, string>,
  field: string
): string | undefined {
  return errors[field]
}

/**
 * Checks if a specific field has an error
 * @param errors - Field errors object from mapZodErrors
 * @param field - Field name to check
 * @returns True if field has an error
 */
export function hasFieldError(
  errors: Record<string, string>,
  field: string
): boolean {
  return field in errors
}
