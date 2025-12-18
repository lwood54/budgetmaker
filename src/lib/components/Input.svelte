<script lang="ts">
  import { P, Input } from 'flowbite-svelte';
  import type { InputProps } from 'flowbite-svelte/types';
  import type { FormField } from '$lib/types/custom/forms';

  interface Props {
    field: FormField;
    class?: string;
    size?: InputProps['size'];
    color?: InputProps['color'];
    placeholder?: string;
    disabled?: boolean;
    type?: string;
    initialValue?: string | number;
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
    ...restProps
  }: Props = $props();

  const fieldAttrs = field.as('text');

  // Filter out incompatible properties and null values in a single pass
  // HTML input has size as number, but Flowbite Input expects size as "sm" | "md" | "lg" | undefined
  // HTML input has color as string, but Flowbite Input expects color as specific color values
  // HTMLInputAttributes can have null, but Flowbite Input doesn't accept null
  // Also exclude 'value' to handle it separately with initialValue support
  const cleanedAttrs = Object.fromEntries(
    Object.entries(fieldAttrs).filter(
      ([key, value]) => key !== 'size' && key !== 'color' && key !== 'value' && value !== null,
    ),
  );

  // Determine the value to use: field value takes precedence, then initialValue
  // Treat empty strings as "no value" when initialValue is provided (for edit forms)
  // This allows initialValue to populate fields when the form field is empty
  const isEmptyString = typeof fieldAttrs.value === 'string' && fieldAttrs.value.trim() === '';
  const hasFieldValue =
    fieldAttrs.value !== undefined && fieldAttrs.value !== null && !isEmptyString;

  const resolvedValue = hasFieldValue
    ? fieldAttrs.value
    : initialValue !== undefined
      ? initialValue
      : undefined;

  // Merge attributes, prioritizing explicit props over field attrs
  // For value: use field value if present, otherwise use initialValue if provided
  const inputAttrs = {
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
  };
</script>

<div>
  <Input {...inputAttrs} />

  {#each field.issues() ?? [] as issue}
    <P size="sm" class="mt-1 text-red-600 dark:text-red-400">{issue.message}</P>
  {/each}
</div>
