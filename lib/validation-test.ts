// Simple validation tests for One-Link auth schemas
// Run this file to test Zod schema validation

import { z } from "zod"

// Email validation schema
const emailSchema = z.string().email("Please enter a valid email address")

// Password validation schema
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain at least one uppercase letter, one lowercase letter, and one number",
  )

// Role validation schema
const roleSchema = z.enum(["supplier", "influencer", "customer"], {
  required_error: "Please select your account type",
})

// Test cases
export const runValidationTests = () => {
  console.log("🧪 Running One-Link Validation Tests...")

  // Email validation tests
  console.log("\n📧 Email Validation Tests:")

  const emailTests = [
    { input: "user@example.com", expected: true },
    { input: "foo@", expected: false },
    { input: "@bar.com", expected: false },
    { input: "invalid-email", expected: false },
    { input: "test@domain", expected: false },
  ]

  emailTests.forEach(({ input, expected }) => {
    try {
      emailSchema.parse(input)
      console.log(`✅ "${input}" - Valid (expected: ${expected})`)
    } catch (error) {
      console.log(`❌ "${input}" - Invalid (expected: ${expected})`)
    }
  })

  // Password validation tests
  console.log("\n🔒 Password Validation Tests:")

  const passwordTests = [
    { input: "Password123", expected: true },
    { input: "weak", expected: false },
    { input: "password123", expected: false }, // no uppercase
    { input: "PASSWORD123", expected: false }, // no lowercase
    { input: "Password", expected: false }, // no number
    { input: "Pass1", expected: false }, // too short
  ]

  passwordTests.forEach(({ input, expected }) => {
    try {
      passwordSchema.parse(input)
      console.log(`✅ "${input}" - Valid (expected: ${expected})`)
    } catch (error) {
      console.log(`❌ "${input}" - Invalid (expected: ${expected})`)
    }
  })

  // Role validation tests
  console.log("\n👤 Role Validation Tests:")

  const roleTests = [
    { input: "supplier", expected: true },
    { input: "influencer", expected: true },
    { input: "customer", expected: true },
    { input: "admin", expected: false },
    { input: "", expected: false },
    { input: undefined, expected: false },
  ]

  roleTests.forEach(({ input, expected }) => {
    try {
      roleSchema.parse(input)
      console.log(`✅ "${input}" - Valid (expected: ${expected})`)
    } catch (error) {
      console.log(`❌ "${input}" - Invalid (expected: ${expected})`)
    }
  })

  console.log("\n✨ Validation tests complete!")
}

// Export schemas for use in components
export { emailSchema, passwordSchema, roleSchema }
