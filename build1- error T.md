hooks/use-products.ts:188:20 - error TS2339: Property 'category' does not exist on type 'never'.

188           acc[item.category] = (acc[item.category] || 0) + 1   
                       ~~~~~~~~

hooks/use-products.ts:188:42 - error TS2339: Property 'category' does not exist on type 'never'.

188           acc[item.category] = (acc[item.category] || 0) + 1   
                                             ~~~~~~~~

lib/auth-context.tsx:35:18 - error TS2339: Property 'id' does not exist on type 'never'.

35         id: data.id,
                    ~~

lib/auth-context.tsx:36:21 - error TS2339: Property 'email' does not exist on type 'never'.

36         email: data.email,
                       ~~~~~

lib/auth-context.tsx:37:20 - error TS2339: Property 'name' does not exist on type 'never'.

37         name: data.name,
                      ~~~~

lib/auth-context.tsx:38:20 - error TS2339: Property 'role' does not exist on type 'never'.

38         role: data.role as UserRole,
                      ~~~~

lib/auth-context.tsx:39:22 - error TS2339: Property 'avatar' does not exist on type 'never'.

39         avatar: data.avatar,
                        ~~~~~~

lib/auth-context.tsx:40:24 - error TS2339: Property 'verified' does not exist on type 'never'.

40         verified: data.verified,
                          ~~~~~~~~

lib/auth-context.tsx:41:25 - error TS2339: Property 'created_at' does not exist on type 'never'.

41         createdAt: data.created_at,
                           ~~~~~~~~~~

lib/auth-context.tsx:42:25 - error TS2339: Property 'updated_at' does not exist on type 'never'.

42         updatedAt: data.updated_at,
                           ~~~~~~~~~~

middleware.ts:75:25 - error TS2339: Property 'role' does not exist on type 'never'.

75   const userRole = user.role
                           ~~~~


Found 88 errors in 23 files.

Errors  Files
     6  app/api/admin/users/[id]/verify/route.ts:21
     1  app/api/admin/users/route.ts:21
     8  app/api/admin/verification/[requestId]/review/route.ts:16  
     1  app/api/auth/sign-in/route.ts:85
    15  app/api/checkout/route.ts:12
     4  app/api/commissions/route.ts:62
     1  app/api/dashboard/supplier/route.ts:51
     5  app/api/influencer/shop/[id]/route.ts:23
     5  app/api/influencer/shop/route.ts:53
     2  app/api/onboarding/brand/route.ts:12
     1  app/api/onboarding/docs/[id]/route.ts:11
     2  app/api/onboarding/docs/route.ts:26
     2  app/api/onboarding/influencer/route.ts:29
     3  app/api/orders/[id]/route.ts:15
     1  app/api/orders/route.ts:13
     7  app/api/products/[id]/route.ts:70
     1  app/api/products/export/route.ts:20
     2  app/api/products/import/route.ts:38
     1  app/api/products/route.ts:22
     9  app/api/shop/[handle]/route.ts:92
     2  hooks/use-products.ts:188
     8  lib/auth-context.tsx:35
     1  middleware.ts:75
 ELIFECYCLE  Command failed with exit code 2.
PS C:\Users\LENOVO\Desktop\Workspce\vo-onelink-google> 
 *  History restored 

PS C:\Users\LENOVO\Desktop\Workspce\vo-onelink-google> npm run dev 

> my-v0-project@0.1.0 dev
> next dev

   ▲ Next.js 15.2.4
   - Local:        http://localhost:3000
   - Network:      http://172.30.1.49:3000
   - Environments: .env.local

 ✓ Starting...
 ✓ Ready in 6.5s
 ○ Compiling /middleware ...
 ✓ Compiled /middleware in 2s (171 modules)
 ○ Compiling / ...
<w> [webpack.cache.PackFileCacheStrategy] Serializing big strings (108kiB) impacts deserialization performance (consider using Buffer instead and decode when needed)
 ✓ Compiled / in 12.3s (1096 modules)
 GET / 200 in 13975ms
 ○ Compiling /shop ...
 ✓ Compiled /shop in 5.3s (1272 modules)
 GET /shop 200 in 5608ms
 GET /shop 200 in 76ms
 ○ Compiling /sign-in ...
 ✓ Compiled /sign-in in 2.7s (1409 modules)
 GET /sign-in?redirectTo=%2Fblog 200 in 3033ms
 ○ Compiling /sign-up ...
 ✓ Compiled /sign-up in 1190ms (1432 modules)
 GET /sign-up 200 in 1467ms
 ○ Compiling /api/auth/sign-up ...
 ✓ Compiled /api/auth/sign-up in 3.6s (1527 modules)
Testing Supabase connection...
Environment variables check:
NEXT_PUBLIC_SUPABASE_URL: SET
NEXT_PUBLIC_SUPABASE_ANON_KEY: SET
SUPABASE_SERVICE_ROLE_KEY: SET
Supabase admin connection test successful
Sign-up request body: {
  firstName: 'Sam',
  lastName: 'Konneh',
  email: 'skonneh2020@gmail.com',
  password: '[REDACTED]',
  confirmPassword: '[REDACTED]',
  role: 'supplier'
}
Processing sign-up for: {
  email: 'skonneh2020@gmail.com',
  role: 'supplier',
  name: 'Sam Konneh'
}
Checking if user exists...
Creating Supabase auth user with admin client...
Auth user created with admin client, creating profile...
Creating user profile with: {
  userId: '2dd5a017-cbf5-429b-8bd8-87b3416542d6',
  email: 'skonneh2020@gmail.com',
  name: 'Sam Konneh',
  role: 'supplier'
}
User profile created successfully: {
  id: '2dd5a017-cbf5-429b-8bd8-87b3416542d6',
  email: 'skonneh2020@gmail.com',
  name: 'Sam Konneh',
  role: 'supplier',
  avatar: null,
  verified: false,
  created_at: '2025-09-05T15:02:48.256+00:00',
  updated_at: '2025-09-05T15:02:48.256+00:00'
}
User profile created successfully
 POST /api/auth/sign-up 200 in 6647ms
 │ GET https://fgnkymynpslqpnwfsxth.supabase.co/rest/v1/users?select=count&limit=1 200 in 1187ms (cache skip)
 │ │ Cache skipped reason: (auto no cache)
 │ GET https://fgnkymynpslqpnwfsxth.supabase.co/rest/v1/users?select=*&email=eq.skonneh2020%40gmail.com 406 in 460ms (cache skip)     
 │ │ Cache skipped reason: (auto no cache)
 │ POST https://fgnkymynpslqpnwfsxth.supabase.co/auth/v1/admin/users 200 in 782ms (cache skip)
 │ │ Cache skipped reason: (auto no cache)
 │ POST https://fgnkymynpslqpnwfsxth.supabase.co/rest/v1/users?select=* 201 in 175ms (cache skip)
 │ │ Cache skipped reason: (auto no cache)
 GET /sign-in?redirectTo=%2Fauth%2Fonboarding 200 in 148ms
 GET /sign-in?redirectTo=%2Fapi%2Fdebug%2Fenv 200 in 994ms
