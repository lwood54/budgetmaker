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
    ...restProps
  }: Props = $props();

  const fieldAttrs = field.as('text');

  // Filter out incompatible properties and null values in a single pass
  // HTML input has size as number, but Flowbite Input expects size as "sm" | "md" | "lg" | undefined
  // HTML input has color as string, but Flowbite Input expects color as specific color values
  // HTMLInputAttributes can have null, but Flowbite Input doesn't accept null
  const cleanedAttrs = Object.fromEntries(
    Object.entries(fieldAttrs).filter(
      ([key, value]) => key !== 'size' && key !== 'color' && value !== null,
    ),
  );

  // Merge attributes, prioritizing explicit props over field attrs
  const inputAttrs = {
    ...cleanedAttrs,
    ...restProps,
    placeholder: placeholder ?? fieldAttrs.placeholder ?? undefined,
    disabled: disabled ?? fieldAttrs.disabled ?? undefined,
    type: type ?? fieldAttrs.type ?? 'text',
    class: className,
    ...(size !== undefined && { size }),
    ...(color !== undefined && { color }),
  };
</script>

<div>
  <Input {...inputAttrs} />

  {#each field.issues() ?? [] as issue}
    <P size="sm" class="mt-1 text-red-600 dark:text-red-400">{issue.message}</P>
  {/each}
</div>
