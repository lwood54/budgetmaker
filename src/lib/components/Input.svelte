<script lang="ts">
  import { P, Input } from 'flowbite-svelte';
  import type { InputProps } from 'flowbite-svelte/types';
  import type { FormField } from '$lib/types/custom/forms';

  interface Props {
    field?: FormField;
    class?: string;
    size?: InputProps['size'];
    color?: InputProps['color'];
    placeholder?: string;
    disabled?: boolean;
    type?: string;
    initialValue?: string | number;
    value?: string | number;
    isDirty?: boolean;
    [key: string]: unknown;
  }

  let {
    field,
    class: className = '',
    size,
    color,
    placeholder,
    disabled,
    type = 'text',
    initialValue,
    value = $bindable<string | number | undefined>(undefined),
    isDirty,
    ...restProps
  }: Props = $props();

  // NOTE: Safely access field attributes - wrap in derived.by() to avoid blocking reactive dependencies
  // This prevents components from blocking during client-side navigation
  const fieldAttrs = $derived.by(() => {
    try {
      return field?.as('text') ?? {};
    } catch (error) {
      console.error('[Input.svelte] Error accessing field.as():', error);
      return {};
    }
  });

  // NOTE: Filter out incompatible properties and null values
  // HTML input has size as number, but Flowbite Input expects size as "sm" | "md" | "lg" | undefined
  // HTML input has color as string, but Flowbite Input expects color as specific color values
  // HTMLInputAttributes can have null, but Flowbite Input doesn't accept null
  // Also exclude 'value' to handle it separately with initialValue support
  const cleanedAttrs = $derived(
    Object.fromEntries(
      Object.entries(fieldAttrs).filter(
        ([key, val]) => key !== 'size' && key !== 'color' && key !== 'value' && val !== null,
      ),
    ),
  );

  // NOTE: Determine the value to use - field value takes precedence, then bindable value, then initialValue
  // Treat empty strings as "no value" when initialValue is provided (for edit forms)
  // This allows initialValue to populate fields when the form field is empty
  const isEmptyString = $derived(
    typeof fieldAttrs.value === 'string' && fieldAttrs.value.trim() === '',
  );
  const hasFieldValue = $derived(
    fieldAttrs.value !== undefined && fieldAttrs.value !== null && !isEmptyString,
  );

  const resolvedValue = $derived(
    hasFieldValue
      ? fieldAttrs.value
      : value !== undefined
        ? value
        : initialValue !== undefined
          ? initialValue
          : undefined,
  );

  // NOTE: Merge attributes, prioritizing explicit props over field attrs
  // For value: use field value if present, otherwise use initialValue if provided
  const inputAttrs = $derived({
    ...cleanedAttrs,
    ...restProps,
    placeholder: placeholder ?? fieldAttrs.placeholder ?? undefined,
    disabled: disabled ?? fieldAttrs.disabled ?? undefined,
    type: type ?? fieldAttrs.type ?? 'text',
    class: className,
    ...(size !== undefined && { size }),
    ...(color !== undefined && { color }),
    // Pass value to Flowbite Input: field value takes precedence, then initialValue
    ...(resolvedValue !== undefined ? { value: resolvedValue } : {}),
  });

  // NOTE: Safely access field issues - wrap in derived.by() to avoid blocking
  const fieldIssues = $derived.by(() => {
    if (isDirty === false) return [];
    try {
      return field?.issues() ?? [];
    } catch (error) {
      console.error('[Input.svelte] Error accessing field.issues():', error);
      return [];
    }
  });
</script>

<div>
  {#if field}
    <Input {...inputAttrs} />
  {:else}
    <Input {...inputAttrs} bind:value />
  {/if}

  {#each fieldIssues as issue}
    <P size="sm" class="mt-1 text-red-600 dark:text-red-400">{issue.message}</P>
  {/each}
</div>
