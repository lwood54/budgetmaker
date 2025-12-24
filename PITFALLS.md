# Common Pitfalls & Patterns

## SvelteKit Remote Functions & Navigation

### ❌ Reactive Queries Blocking Navigation
**Problem**: Using `$derived(await getCurrentUser())` reactively in components causes navigation issues - components don't mount during client-side navigation.

**Example**:
```svelte
<!-- BAD - Blocks navigation -->
<script>
  const user = $derived(await getCurrentUser());
  $effect(() => {
    if (user) goto('/dashboard');
  });
</script>
```

**Solution**: Use `onMount()` for one-time checks, or use `+layout.server.ts` for synchronous data.
```svelte
<!-- GOOD - Non-blocking -->
<script>
  import { onMount } from 'svelte';
  
  onMount(async () => {
    const user = await getCurrentUser();
    if (user) goto('/dashboard');
  });
</script>
```

### ✅ Layout Server Load for Synchronous Data
**Pattern**: Use `+layout.server.ts` to provide synchronous data (like user auth status) that the layout needs before rendering.

**Example**:
```typescript
// +layout.server.ts
export const load: LayoutServerLoad = async ({ locals }) => {
  return {
    user: locals.user || null,
  };
};
```

```svelte
<!-- +layout.svelte -->
<script>
  let { data } = $props();
  const user = $derived(data?.user ?? null);
</script>
```

## Remote Form Fields & Component Mounting

### ❌ Top-Level Field Access Blocks Mounting
**Problem**: Accessing `field.as('text')` or `field.issues()` at the top level creates blocking reactive dependencies that prevent components from mounting during client-side navigation.

**Example**:
```svelte
<!-- BAD - Blocks mounting -->
<script>
  let { field } = $props();
  const fieldAttrs = field.as('text'); // Blocks!
</script>
```

**Solution**: Wrap field access in `$derived.by()` to make it lazy and non-blocking.
```svelte
<!-- GOOD - Non-blocking -->
<script>
  let { field } = $props();
  const fieldAttrs = $derived.by(() => {
    try {
      return field?.as('text') ?? {};
    } catch (error) {
      return {};
    }
  });
</script>
```

## Form Validation & Error Handling

### ❌ HTML5 Validation Interferes with Zod
**Problem**: Using `required` attributes and HTML5 validation shows browser-native errors instead of custom Zod validation messages.

**Solution**: 
- Add `novalidate` to forms
- Remove `required` attributes
- Rely on Zod validation with proper error display via Input component

**Example**:
```svelte
<!-- GOOD -->
<form novalidate {...form.enhance(...)}>
  <Input field={form.fields.email} type="email" />
  <!-- No 'required' attribute -->
</form>
```

### ✅ Error Display Pattern
- **Field errors**: Display via Input component's `field.issues()` - no Alert banners needed
- **Non-field errors**: Use Alert banners (e.g., `needsVerification`, server errors)

## Redirect Handling

### ❌ Throwing Redirect Inside Try/Catch
**Problem**: Throwing `redirect()` inside a try/catch block causes it to be caught as an error.

**Example**:
```typescript
// BAD - Redirect gets caught
try {
  // ... login logic ...
  throw redirect(302, '/dashboard'); // Caught by catch!
} catch (error) {
  // Redirect is treated as error
}
```

**Solution**: Handle errors in try/catch, then throw redirect() after the block if successful.
```typescript
// GOOD - Redirect only thrown on success
try {
  // ... login logic ...
} catch (error) {
  // Handle errors
  invalid(issue.email('Error occurred'));
}

// Only executes if try block succeeds
throw redirect(302, '/dashboard');
```

### ✅ Redirect Detection in Form Enhancement
**Pattern**: In form enhancement callbacks, detect and re-throw redirects so SvelteKit handles them.

```typescript
login.enhance(async ({ submit }) => {
  try {
    await submit();
  } catch (error) {
    // Re-throw redirects (they have status and location properties)
    if (
      error &&
      typeof error === 'object' &&
      'status' in error &&
      'location' in error &&
      typeof error.status === 'number' &&
      error.status >= 300 &&
      error.status < 400
    ) {
      throw error;
    }
    // Handle other errors...
  }
})
```

## Component Lifecycle

### ✅ onMount vs Reactive Queries
- **One-time checks**: Use `onMount()` (e.g., checking if user is logged in on login page)
- **Reactive data**: Use `+layout.server.ts` for synchronous data needed before render
- **Avoid**: `$derived(await query())` for one-time checks - causes premature redirects and navigation issues

## Error Handling Patterns

### ✅ Graceful Database Error Handling
**Pattern**: Wrap database queries in try/catch and return structured error objects.

**Example**:
```typescript
export const getBudgets = query(async () => {
  try {
    const data = await getBudgetsByUserId(db, userId);
    return { data, error: null };
  } catch (error) {
    return {
      data: [],
      error: 'Database schema mismatch detected. [db migrations needed]',
    };
  }
});
```

## Key Takeaways

1. **Navigation issues**: Usually caused by reactive queries or blocking field access - use `onMount()` or `+layout.server.ts`
2. **Form fields**: Always wrap `field.as()` and `field.issues()` in `$derived.by()` to prevent blocking
3. **Redirects**: Never throw inside try/catch - throw after successful completion
4. **Validation**: Use `novalidate` + Zod, not HTML5 `required` attributes
5. **Error display**: Field errors via Input component, non-field errors via Alert banners

