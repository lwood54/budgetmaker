<script lang="ts">
  import { Select as FlowbiteSelect, P } from 'flowbite-svelte';
  import type { SelectProps } from 'flowbite-svelte/types';
  import type { FormField } from '$lib/types/custom/forms';
  import { truncateText } from '$lib/helpers/ui';

  interface Option {
    value: string;
    name: string;
  }

  interface Props extends Omit<SelectProps<string>, 'items' | 'value'> {
    items?: Option[];
    field?: FormField;
    class?: string;
    value?: string;
  }

  let {
    items = [],
    field,
    class: className = '',
    value = $bindable(),
    ...restProps
  }: Props = $props();

  // Track screen width for truncation
  let screenWidth = $state(typeof window !== 'undefined' ? window.innerWidth : 1024);

  $effect(() => {
    if (typeof window === 'undefined') return;

    function handleResize() {
      screenWidth = window.innerWidth;
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  // Truncate items based on screen width
  const truncatedItems = $derived(
    items.map((option) => ({
      ...option,
      name: truncateText(option.name, screenWidth),
    })),
  );

  // If field is provided, get attributes from it (for Superforms integration)
  const fieldAttrs = $derived(field ? field.as('text') : {});

  // Initialize value from field if present
  const fieldValue = $derived(fieldAttrs.value as string | undefined);

  // Sync field value to component value
  $effect(() => {
    if (field && fieldValue !== undefined && fieldValue !== value) {
      value = fieldValue;
    }
  });

  // Sync component value back to form field when it changes
  $effect(() => {
    if (field && value !== undefined && value !== fieldValue) {
      // Update the hidden input that the form uses
      const fieldName = fieldAttrs.name;
      if (fieldName) {
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          const hiddenInput = document.querySelector(
            `input[type="hidden"][name="${fieldName}"]`,
          ) as HTMLInputElement;
          if (hiddenInput && value !== undefined) {
            hiddenInput.value = value;
            // Trigger input event to notify form system
            hiddenInput.dispatchEvent(new Event('input', { bubbles: true }));
            hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
      }
    }
  });

  // Clean fieldAttrs to remove null values and incompatible properties
  const cleanedFieldAttrs = $derived(() => {
    const attrs = fieldAttrs;
    const cleaned: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(attrs)) {
      if (val !== null && key !== 'size' && key !== 'color' && key !== 'value') {
        cleaned[key] = val;
      }
    }
    return cleaned;
  });
</script>

<div>
  <FlowbiteSelect
    {...cleanedFieldAttrs}
    {...restProps}
    class={className}
    items={truncatedItems}
    bind:value
  />

  {#if field}
    {#each field.issues() ?? [] as issue}
      <P size="base" class="mt-1 text-red-600 dark:text-red-400">{issue.message}</P>
    {/each}
  {/if}
</div>
