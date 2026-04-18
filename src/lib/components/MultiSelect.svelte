<script lang="ts">
  import { Checkbox } from 'flowbite-svelte';
  import { ChevronDownOutline } from 'flowbite-svelte-icons';
  import { onMount } from 'svelte';

  interface Option {
    value: string;
    name: string;
  }

  interface Props {
    items?: Option[];
    value?: string[];
    placeholder?: string;
    class?: string;
    disabled?: boolean;
    label?: string;
    onChange?: (selectedValues: string[]) => void;
  }

  let {
    items = [],
    value = $bindable([]),
    placeholder = 'Select categories...',
    class: className = '',
    disabled = false,
    label,
    onChange,
  }: Props = $props();

  const sortedItems = $derived(
    [...items].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
    ),
  );

  let isOpen = $state(false);
  let dropdownRef = $state<HTMLElement | null>(null);

  // Close dropdown when clicking outside
  onMount(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
        isOpen = false;
      }
    }

    if (typeof window !== 'undefined') {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  });

  function toggleCategory(categoryValue: string) {
    if (disabled) return;

    let newValue: string[];
    if (value.includes(categoryValue)) {
      newValue = value.filter((v) => v !== categoryValue);
    } else {
      newValue = [...value, categoryValue];
    }
    value = newValue;
    onChange?.(newValue);
  }

  function clearAll(e: Event) {
    e.stopPropagation();
    e.preventDefault();
    if (disabled) return;
    value = [];
    onChange?.([]);
  }

  function removeCategory(categoryValue: string, e: Event) {
    e.stopPropagation();
    e.preventDefault();
    if (disabled) return;
    const newValue = value.filter((v) => v !== categoryValue);
    value = newValue;
    onChange?.(newValue);
  }

  const selectedNames = $derived(() => {
    return items.filter((item) => value.includes(item.value)).map((item) => item.name);
  });

  const displayText = $derived(() => {
    if (value.length === 0) return placeholder;
    if (value.length === 1) return selectedNames()[0];
    return `${value.length} categories selected`;
  });
</script>

<div class="relative {className}" bind:this={dropdownRef}>
  {#if label}
    <label
      for="multiselect-button"
      class="mb-2 block text-sm font-medium text-neutral-900 dark:text-neutral-300"
    >
      {label}
    </label>
  {/if}

  <button
    id="multiselect-button"
    type="button"
    onclick={() => {
      if (!disabled) isOpen = !isOpen;
    }}
    {disabled}
    class="focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 flex w-full items-center justify-between rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-400"
  >
    <span class="truncate">{displayText()}</span>
    <div class="flex items-center gap-1">
      {#if value.length > 0}
        <span
          role="button"
          tabindex="0"
          onclick={(e) => clearAll(e)}
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              clearAll(e);
            }
          }}
          class="cursor-pointer text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
          aria-label="Clear all selections"
        >
          <svg
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </span>
      {/if}
      <ChevronDownOutline class="h-4 w-4 transition-transform {isOpen ? 'rotate-180' : ''}" />
    </div>
  </button>

  {#if isOpen && !disabled}
    <div
      class="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
    >
      {#if sortedItems.length === 0}
        <div class="px-3 py-2 text-sm text-neutral-500 dark:text-neutral-400">
          No options available
        </div>
      {:else}
        <div class="p-2">
          {#each sortedItems as item (item.value)}
            <label
              class="flex cursor-pointer items-center gap-2 rounded px-2 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700"
            >
              <Checkbox
                checked={value.includes(item.value)}
                onchange={() => toggleCategory(item.value)}
              />
              <span class="text-sm text-neutral-900 dark:text-neutral-200">{item.name}</span>
            </label>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  {#if value.length > 0 && !isOpen}
    <div class="mt-2 flex flex-wrap gap-1">
      {#each selectedNames() as name}
        {@const categoryValue = items.find((item) => item.name === name)?.value}
        {#if categoryValue}
          <span
            class="bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs"
          >
            {name}
            <span
              role="button"
              tabindex="0"
              onclick={(e) => removeCategory(categoryValue, e)}
              onkeydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  removeCategory(categoryValue, e);
                }
              }}
              class="text-primary-600 hover:text-primary-800 dark:text-primary-300 dark:hover:text-primary-100 cursor-pointer"
              aria-label="Remove {name}"
            >
              <svg
                class="h-3 w-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </span>
          </span>
        {/if}
      {/each}
    </div>
  {/if}
</div>
