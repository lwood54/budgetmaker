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

  // Clean fieldAttrs to remove null values and incompatible properties
  const cleanedFieldAttrs = $derived(() => {
    const attrs = fieldAttrs;
    const cleaned: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(attrs)) {
      if (val !== null && key !== 'size' && key !== 'color') {
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
      <P size="sm" class="mt-1 text-red-600 dark:text-red-400">{issue.message}</P>
    {/each}
  {/if}
</div>
