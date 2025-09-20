# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2024-12-19

### Added
- **Supabase Client Architecture**: Implemented proper client architecture with separate files for admin, server, and client usage
  - `lib/supabase/admin.ts` - Admin client with service role key for bypassing RLS
  - `lib/supabase/server.ts` - Server-side client with proper cookie handling
  - `lib/supabase/client.ts` - Client-side browser client with RLS enabled
  - `lib/supabase/types.ts` - TypeScript types for Supabase database schema

- **Type Safety Improvements**: Added proper Icon type definition
  - `Icon` type now properly supports `className` and `size` props
  - Compatible with Lucide React icons and other icon components

- **Unit Tests**: Added comprehensive testing for Icon type safety
  - `tests/icon-typing.test.tsx` - Tests rendering of Lucide icons with className
  - Validates type safety for icon components

- **Shop Product Count Improvements**: Enhanced product count accuracy and consistency
  - Improved count display in shop page with "Showing X of Y products"
  - Better error handling for count consistency during filtering
  - Enhanced user experience with informative messages for filtered results
  - Comprehensive Playwright tests for count accuracy validation

- **Enhanced Shop Features**: Extended shop functionality with advanced filtering and state management
  - Added price range filtering to existing category and search filters
  - Implemented URL state persistence for shareable filter configurations
  - Enhanced filter reset functionality and active filter indicators
  - Comprehensive Playwright test coverage for all filter operations

### Fixed
- **Supabase Import Issues**: Resolved all `supabaseAdmin` import errors in API routes
  - Updated imports to use correct paths from new Supabase client files
  - Fixed import statements in checkout, webhooks, auth, and other API routes

- **Edge Runtime Warnings**: Added `export const runtime = 'nodejs'` to API routes
  - Silences Edge runtime compatibility warnings for routes using `@supabase/ssr`
  - Ensures proper server-side execution environment

- **Error Handling**: Replaced `.catch()` on Postgrest builder with proper `try/catch` blocks
  - Improved error handling in database operations
  - Better error reporting and debugging capabilities

- **TypeScript Errors**: Fixed all Icon-related TypeScript compilation errors
  - Components using icons now properly type-check
  - Eliminated type mismatches in icon prop handling

### Changed
- **Supabase Client Structure**: Restructured Supabase client organization
  - Separated concerns between admin, server, and client usage
  - Improved type safety with proper Database interface
  - Better separation of server-side and client-side code

- **API Route Structure**: Updated API routes to use proper Supabase client imports
  - Consistent import patterns across all API endpoints
  - Proper error handling and type safety

### Technical Details
- **Database Types**: Added comprehensive TypeScript interfaces for Supabase tables
  - Users, Products, Orders, Shops tables fully typed
  - Custom functions like `decrement_stock` properly typed
  - Improved IntelliSense and compile-time error checking

- **Cookie Handling**: Improved server-side cookie management
  - Proper cookie handling for authentication flows
  - No-op cookie setters for server-side operations

### Migration Notes
- **Breaking Changes**: 
  - `supabaseAdmin` import paths have changed
  - API routes now require `runtime = 'nodejs'` export
  - Icon components must use proper typing

- **Update Required**:
  - Update all `supabaseAdmin` imports to use new file paths
  - Add runtime export to API routes using `@supabase/ssr`
  - Replace `.catch()` with `try/catch` in database operations

### Testing
- **New Tests**: Added comprehensive Icon type safety tests
- **Coverage**: Tests cover Lucide icon rendering and custom icon components
- **Validation**: Ensures proper className and size prop handling

---

## Previous Versions

*Note: This is the first documented version of the changelog.*
