# AI Code Changes Reference Guide

## Purpose
This document serves as a comprehensive reference for AI assistants making code changes to the Telehealth Platform. It documents all known issues, problems encountered, and solutions implemented to prevent recurring issues and ensure consistency across the codebase.

## Core Principles

### 1. **Completion Criteria - DO NOT MARK AS COMPLETE WITHOUT TESTING**
**CRITICAL**: Never mark tasks as "✅ COMPLETED" based on UI implementation alone.

- **UI Implementation ≠ Working Feature**
- **Only mark as complete when:**
  - Functionality is fully developed AND tested
  - Data persistence works correctly
  - API endpoints respond properly
  - Error handling is implemented
  - End-to-end workflow is confirmed working

- **Mark as ⚠️ PENDING when:**
  - Forms look good but don't save data
  - Buttons don't trigger actions
  - Features are visually complete but functionally incomplete

**Historical Issue**: Multiple forms (ROS, Vitals, Physical Exam) were marked complete when they were just UI placeholders without data persistence.

### 2. **Input Text Visibility - ALWAYS ADD TEXT COLOR CLASSES**
**CRITICAL**: All input elements must have explicit text color classes to prevent invisible text issues.

- **Required**: `text-slate-900` class on all input, textarea, and select elements
- **Background**: Issues occur when Tailwind's default text color becomes invisible in certain themes/modes
- **Pattern**: `className="... focus:ring-2 focus:ring-blue-500 text-slate-900"`
- **Historical Issue**: Quick search input, medical form inputs, and various form fields had invisible text
- **Fix Applied**: Added `text-slate-900` to ALL input elements across the application
- **Files Affected**: Header, forms, medical notes, patient management, authentication

**Files Affected**: All form inputs across the application
**Historical Issue**: Patient share inputs, permission selects, and medical form inputs had invisible text

### 3. **Quick Search Panel Design - Sidebar-Style Animation**
**STANDARD**: Quick search should use sidebar-style animation and positioning.

- **Animation**: `transition-transform duration-300 ease-in-out` sliding from left
- **Positioning**: `fixed top-0 left-0` (full screen height, not under header)
- **Header Button**: Vertical layout with icon + "Quick Search" text underneath
- **Mobile Text**: Responsive sizing (`text-sm sm:text-base` for inputs, smaller for labels)
- **Border**: Left border (`border-l`) to match sidebar styling

**Historical Issue**: Quick search initially positioned under header with different animation
**Current Pattern**: Matches sidebar exactly for consistent UX

### 4. **API Route Usage - Never Bypass API Routes**
**CRITICAL**: Client components must use API routes, never direct Supabase operations.

- **WRONG**: `supabase.from('table').insert(data)` in client components
- **CORRECT**: `fetch('/api/table', { method: 'POST', body: JSON.stringify(data) })`
- **Why**: API routes handle authentication, RLS policy application, data validation, and audit trails
- **Pattern**: Always use API routes for CRUD operations from client-side code
- **Exception**: Read-only queries for dropdowns/search can use direct Supabase calls

**Historical Issue**: Visits creation bypassed API route and inserted directly to Supabase
**Fix Applied**: Updated `app/visits/new/page.tsx` to use `/api/visits` POST endpoint
**Files Affected**: All client-side CRUD operations

### 5. **Mobile/Portrait Responsiveness - Vertical Stacking Priority**
**CRITICAL**: All pages and components must prioritize vertical stacking and proper alignment in mobile/portrait mode.

- **Grid Layouts**: Use `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` pattern (single column on mobile, responsive columns on larger screens)
- **Flex Layouts**: Use `flex-col sm:flex-row` for vertical stacking on mobile
- **Spacing**: Use responsive spacing (`gap-4 sm:gap-6`, `p-4 sm:p-6`, `space-y-4 sm:space-y-6`)
- **Text Sizing**: Implement responsive text classes:
  - Inputs: `text-sm sm:text-base`
  - Labels: `text-sm sm:text-base`
  - Buttons: `text-sm sm:text-base`
  - Headings: `text-lg sm:text-xl lg:text-2xl`
- **Button Stacking**: Use `flex-col sm:flex-row gap-3` for button groups
- **Form Elements**: Stack form fields vertically on mobile with responsive spacing
- **Card Layouts**: Use `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` for responsive card grids
- **Containers**: Use `max-w-2xl mx-auto` for form containers with proper mobile padding

**Pattern**:
```tsx
// ✅ Correct responsive layout
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
  <div className="space-y-4 sm:space-y-6">
    <div className="flex flex-col sm:flex-row gap-3">
      <input className="text-sm sm:text-base px-3 py-2" />
      <button className="text-sm sm:text-base">Submit</button>
    </div>
  </div>
</div>
```

**Historical Issue**: Form elements and sections didn't stack properly on mobile devices
**Current Standard**: All new implementations must follow this vertical-first approach
**Implementation Pattern**: Use `hidden lg:block` for desktop tabs, `lg:hidden` for mobile accordion
**Example**: Visit detail page uses tabs on desktop, collapsible accordion on mobile
**Testing**: Always test in portrait/mobile view to ensure proper stacking

### 4. **Database Performance - RLS Policy Optimization**
**CRITICAL**: Avoid multiple permissive policies on the same table/role/action combination.

- **Problem**: Multiple SELECT policies for `authenticated` role cause N×N evaluation
- **Solution**: Consolidate to single policy per role/action
- **Pattern**: One restrictive policy + one permissive policy when needed

**Historical Issue**: Clinicians table had 4+ overlapping SELECT policies causing severe performance degradation

### 4. **Migration Safety - Test Before Production**
**CRITICAL**: Always test migrations locally before pushing to production.

- **Issue**: Migration rollbacks are difficult/impossible in production
- **Solution**: Test migrations on local database first
- **Pattern**: Run `supabase db reset --local` and test thoroughly

**Historical Issue**: Multiple broken migrations caused database inconsistencies

### 5. **State Management - Prevent Initialization Errors**
**CRITICAL**: Avoid calling functions during initial state declaration.

- **Problem**: `useState(() => { loadCurrentShares() })` causes "before initialization" errors
- **Solution**: Use `useEffect` for side effects, keep `useState` for simple values
- **Pattern**:
  ```tsx
  // ❌ Wrong
  const [shares, setShares] = useState(() => loadShares())

  // ✅ Correct
  const [shares, setShares] = useState([])
  useEffect(() => { loadShares() }, [])
  ```

**Historical Issue**: PatientShare component had initialization errors

### 6. **TypeScript Types - Ensure Proper Typing**
**CRITICAL**: Verify TypeScript types match actual data structures.

- **Problem**: `visit.patients` typed as array but returned as object
- **Solution**: Check actual API responses and update types accordingly
- **Pattern**: Use explicit type assertions when needed: `visit.patients as { first_name: string; last_name: string }`

**Historical Issue**: Dashboard stats caused TypeScript errors

### 7. **API Route Security - Proper Authentication Checks**
**CRITICAL**: Always verify user authentication in API routes.

- **Problem**: Missing auth checks allow unauthorized access
- **Solution**: Check `supabase.auth.getUser()` and return 401 if no user
- **Pattern**:
  ```ts
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  ```

**Historical Issue**: Multiple API routes had security vulnerabilities

### 8. **Database Constraints - Handle Foreign Key Issues**
**CRITICAL**: Account for orphaned records when deleting related data.

- **Problem**: Deleting patients leaves orphaned shares
- **Solution**: Either prevent deletion or clean up related records
- **Pattern**: Use database triggers or manual cleanup scripts

**Historical Issue**: Patient deletion left orphaned shares causing UI errors

### 9. **Session Timeout - Activity Tracking Implementation**
**CRITICAL**: Implement session timeout using proper hook architecture to avoid React violations.

- **Problem**: Conditional hook calls cause "Hooks called in wrong order" errors
- **Solution**: Create dedicated hook that runs unconditionally, but only sets up listeners for authenticated contexts
- **Pattern**:
  ```tsx
  // ❌ Conditional hook call (breaks React rules)
  if (user) {
    useSessionTimeout(5)
  }

  // ✅ Unconditional hook call with internal conditional logic
  useSessionTimeout(5) // Hook handles authentication state internally
  ```
- **Browser Check**: Include `typeof window === 'undefined'` check to prevent SSR issues
- **Event Cleanup**: Always clean up event listeners in useEffect return function
- **Historical Issue**: Session timeout implementation caused React hooks order violations

### 11. **Component Architecture - Separate Client/Server Components**
**CRITICAL**: Use proper Next.js 13+ app router patterns.

- **Problem**: Mixing client and server logic causes hydration issues
- **Solution**: Server components for data fetching, client components for interactivity
- **Pattern**: Server components return JSX, client components handle state/events

**Historical Issue**: Layout components caused hydration mismatches

### 10. **Error Handling - Graceful Degradation**
**CRITICAL**: Handle API errors and loading states properly.

- **Problem**: Unhandled errors crash the application
- **Solution**: Try/catch blocks, loading states, error boundaries
- **Pattern**: Always provide fallback UI for error states

**Historical Issue**: API failures caused white screens

### 12. **Appointment Status Updates - RLS Policy Conflicts**
**CRITICAL**: Service role client required for appointment updates due to RLS policy issues.

- **Problem**: RLS policies block legitimate appointment status updates even for appointment owners
- **Solution**: Use service role client for appointment updates while maintaining user authentication checks
- **Pattern**:
  ```typescript
  // ❌ Don't use regular client for updates (blocked by RLS)
  const { data, error } = await supabase.from('appointments').update(data)

  // ✅ Use service role client (bypasses RLS)
  const serviceClient = createClient(URL, SERVICE_ROLE_KEY)
  const { data, error } = await serviceClient.from('appointments').update(data)
  ```
- **Security**: Still validate user permissions before allowing updates
- **Historical Issue**: Appointment status updates failed silently due to RLS policy `USING ((clinician_id = auth.uid()))`

### 13. **Calendar Component Styling - React-Calendar Customization**
**STANDARD**: Use proper CSS-in-JS styling for react-calendar components.

- **Problem**: Default react-calendar styling conflicts with application themes
- **Solution**: Override with styled-jsx and proper CSS selectors
- **Pattern**:
  ```jsx
  <style jsx global>{`
    .react-calendar {
      border: none;
      font-family: inherit;
    }
    .react-calendar__tile {
      color: #1f2937;
      min-height: 3rem;
    }
    .react-calendar__tile--active {
      background: #3b82f6 !important;
      color: white !important;
    }
  `}</style>
  ```
- **Historical Issue**: Calendar dates appeared blank due to color conflicts

### 14. **Mobile Layout - Vertical Stacking Priority**
**CRITICAL**: Ensure all cards and components stack vertically on mobile with proper spacing.

- **Problem**: Horizontal layouts don't work on mobile, causing overflow and poor UX
- **Solution**: Use responsive classes and proper flex/grid layouts
- **Pattern**:
  ```jsx
  // ❌ Horizontal layout only
  <div className="flex items-center justify-between">

  // ✅ Responsive vertical stacking
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
  ```
- **Historical Issue**: Appointment cards and buttons overflowed on mobile devices

## File-Specific Issues

### Header.tsx
- **Search Animation**: Use `transition-transform duration-300 ease-in-out` for sidebar-like animations
- **Input Sizing**: Remove `text-lg` from search inputs for normal text size
- **Icon Layout**: Use `flex flex-col` for vertical icon + text layout

### PatientShare.tsx
- **Input Visibility**: All inputs must have `text-slate-900`
- **Search Functionality**: Ensure search works with clinician email/name
- **Permission Levels**: Validate permission values before API calls

### Dashboard Components
- **Appointment Updates**: Real-time status changes require proper API integration
- **Upcoming Appointments**: Display scheduled appointments in card grid layout
- **Stats Calculation**: Ensure dashboard stats reflect actual database state
- **Mobile Layout**: Test all screen sizes for proper responsive behavior

### Medical Forms (ROS, Vitals, Physical Exam)
- **Data Persistence**: Forms must save to database, not just display UI
- **Validation**: Medical data requires proper validation rules
- **Auto-save**: Implement debounced auto-save for better UX

### Appointment Management Pages
- **Status Updates**: Use service role client to bypass RLS policy issues
- **Loading States**: All buttons use animated circles that don't change size
- **Mobile Layout**: Cards stack vertically with proper responsive classes
- **Patient Selection**: Selected patient display stacks vertically on mobile (`flex flex-col sm:flex-row`)
- **Calendar Styling**: Override react-calendar defaults with styled-jsx

### API Routes
- **Appointment Updates**: Use service role client for database operations
- **Permission Checks**: Validate user access before operations
- **Error Handling**: Provide clear error messages for failed operations

## Implementation Audit Results (January 2025)

### Phase 1-4 Audit Findings:
- ✅ **All claimed features verified as implemented** - No gaps found
- ✅ **Edit Patient page** was marked as pending but is fully implemented with comprehensive form
- ✅ **Global search** fully implemented with advanced search across patients, visits, appointments
- ✅ **Messages page** includes alerts section with upcoming appointments
- ✅ **Patient profile** has complete tabbed interface with responsive design
- ✅ **All major CRUD operations** working for patients, visits, appointments
- ✅ **Security features** properly implemented (RLS, session timeout, etc.)

### Testing Checklist

### Before Marking Complete:
- [x] UI renders correctly on all screen sizes
- [x] Data saves to database successfully
- [x] API endpoints return correct responses
- [x] Error states are handled gracefully
- [x] Loading states are shown appropriately
- [x] Authentication is properly enforced
- [x] TypeScript compilation passes
- [x] No console errors in browser

### Performance Checks:
- [ ] Database queries are optimized
- [ ] No N+1 query issues
- [ ] RLS policies are consolidated
- [ ] Bundle size is reasonable
- [ ] Initial page load is fast

## Migration Best Practices

### Database Changes:
- [ ] Test migrations locally first
- [ ] Include rollback scripts when possible
- [ ] Document breaking changes
- [ ] Update related API endpoints
- [ ] Consider data migration for existing records

### Code Changes:
- [ ] Update TypeScript types
- [ ] Test component integration
- [ ] Update documentation
- [ ] Consider accessibility impact
- [ ] Test with real data

## Emergency Fixes

When issues occur in production:
1. **Identify the root cause** using this reference
2. **Check if it's a known issue** documented here
3. **Apply the documented solution**
4. **Test thoroughly** before marking as resolved
5. **Document new issues** by updating this reference

## Maintenance Notes

- **Review this document** before making any code changes
- **Update this document** when new issues are discovered
- **Test all changes** against the completion criteria
- **Document workarounds** for third-party limitations
- **Keep examples current** with the latest codebase patterns

---

**Last Updated**: January 2025
**Maintained by**: AI Assistant
**Purpose**: Prevent recurring issues and ensure consistent, high-quality code changes
