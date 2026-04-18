<script lang="ts">
  import { onMount } from 'svelte';
  import { P } from 'flowbite-svelte';
  import { ChevronDownOutline } from 'flowbite-svelte-icons';
  import type { FormField } from '$lib/types/custom/forms';
  import { truncateText } from '$lib/helpers/ui';

  interface Option {
    value: string;
    name: string;
  }

  interface Props {
    items?: Option[];
    field?: FormField;
    class?: string;
    dropdownClass?: string;
    value?: string | null;
    placeholder?: string;
    searchPlaceholder?: string;
    disabled?: boolean;
    required?: boolean;
    id?: string;
    name?: string;
    size?: 'sm' | 'md' | 'lg';
    sortAlphabetically?: boolean;
    onSelect?: (option: Option) => void;
  }

  let {
    items = [],
    field,
    class: className = '',
    dropdownClass = '',
    value = $bindable('' as string | null),
    placeholder = 'Select an option',
    searchPlaceholder = 'Search...',
    disabled = false,
    required = false,
    id,
    name,
    size = 'md',
    sortAlphabetically = true,
    onSelect,
  }: Props = $props();

  let isOpen = $state(false);
  let searchQuery = $state('');
  let selectRef = $state<HTMLDivElement | null>(null);
  let buttonRef = $state<HTMLButtonElement | null>(null);
  let dropdownRef = $state<HTMLDivElement | null>(null);
  let searchInputRef = $state<HTMLInputElement | null>(null);

  let screenWidth = $state(typeof window !== 'undefined' ? window.innerWidth : 1024);

  $effect(() => {
    if (typeof window === 'undefined') return;

    function handleResize() {
      screenWidth = window.innerWidth;
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  const sortedItems = $derived.by(() => {
    if (!sortAlphabetically) return items;
    return [...items].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
    );
  });

  const filteredItems = $derived.by(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sortedItems;
    return sortedItems.filter((opt) => opt.name.toLowerCase().includes(q));
  });

  const truncatedItems = $derived(
    filteredItems.map((option) => ({
      ...option,
      name: truncateText(option.name, screenWidth),
    })),
  );

  const selectedItem = $derived(
    value ? sortedItems.find((item) => item.value === value) || null : null,
  );

  const displayText = $derived(
    selectedItem ? truncateText(selectedItem.name, screenWidth) : placeholder,
  );

  $effect(() => {
    if (!isOpen) searchQuery = '';
  });

  $effect(() => {
    if (isOpen && !disabled) {
      requestAnimationFrame(() => searchInputRef?.focus());
    }
  });

  function optionButtons(): HTMLButtonElement[] {
    return Array.from(dropdownRef?.querySelectorAll('button[role="option"]') ?? []);
  }

  function toggleDropdown() {
    if (disabled) return;
    isOpen = !isOpen;
  }

  function selectItem(itemValue: string) {
    value = itemValue;
    isOpen = false;

    if (onSelect) {
      const selectedOption = sortedItems.find((item) => item.value === itemValue);
      if (selectedOption) {
        onSelect(selectedOption);
      }
    }
  }

  $effect(() => {
    if (field && value) {
      const input = document.querySelector(`input[name="${name || id}"]`) as HTMLInputElement;
      if (input) {
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  });

  function handleClickOutside(event: MouseEvent) {
    if (
      selectRef &&
      !selectRef.contains(event.target as Node) &&
      dropdownRef &&
      !dropdownRef.contains(event.target as Node)
    ) {
      isOpen = false;
    }
  }

  function handleButtonKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      isOpen = false;
      buttonRef?.focus();
    } else if (event.key === 'ArrowDown' && !isOpen) {
      event.preventDefault();
      isOpen = true;
    } else if (event.key === 'ArrowDown' && isOpen) {
      event.preventDefault();
      searchInputRef?.focus();
    } else if (event.key === 'ArrowUp' && isOpen) {
      event.preventDefault();
      const opts = optionButtons();
      const currentIndex = opts.findIndex((el) => el === document.activeElement);
      if (currentIndex > 0) {
        opts[currentIndex - 1]?.focus();
      } else if (currentIndex === 0) {
        searchInputRef?.focus();
      } else {
        buttonRef?.focus();
      }
    }
  }

  function handleSearchKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      optionButtons()[0]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      buttonRef?.focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      isOpen = false;
      buttonRef?.focus();
    }
  }

  onMount(() => {
    if (typeof window !== 'undefined') {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  });

  const sizeClasses = {
    sm: 'h-8 text-sm px-3',
    md: 'h-10 text-base px-4',
    lg: 'h-12 text-lg px-5',
  };

  function setDropdownWidth(node: HTMLElement) {
    const updateWidth = () => {
      if (dropdownRef && node) {
        const width = node.offsetWidth;
        dropdownRef.style.width = `${width}px`;
      }
    };

    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(node);

    return {
      update: updateWidth,
      destroy: () => resizeObserver.disconnect(),
    };
  }

  $effect(() => {
    if (isOpen && buttonRef && dropdownRef) {
      requestAnimationFrame(() => {
        if (buttonRef && dropdownRef) {
          dropdownRef.style.width = `${buttonRef.offsetWidth}px`;
        }
      });
    }
  });
</script>

<div class={`relative ${className}`} bind:this={selectRef}>
  <button
    type="button"
    bind:this={buttonRef}
    {id}
    {name}
    {disabled}
    onclick={toggleDropdown}
    onkeydown={handleButtonKeydown}
    class={`focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 flex w-full items-center justify-between rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-400 ${sizeClasses[size]}`}
    aria-haspopup="listbox"
    aria-expanded={isOpen}
    aria-label={placeholder}
    use:setDropdownWidth
  >
    <span class="truncate text-left">{displayText}</span>
    <ChevronDownOutline
      class="ml-2 h-4 w-4 shrink-0 transition-transform {isOpen ? 'rotate-180' : ''}"
    />
  </button>

  <input type="hidden" {name} value={value || ''} {required} />

  {#if isOpen && !disabled}
    <div
      bind:this={dropdownRef}
      role="listbox"
      class={`absolute left-0 z-50 mt-1 flex max-h-60 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800 ${dropdownClass}`}
    >
      <div class="shrink-0 border-b border-neutral-200 p-2 dark:border-neutral-700">
        <input
          bind:this={searchInputRef}
          type="text"
          autocomplete="off"
          spellcheck="false"
          placeholder={searchPlaceholder}
          bind:value={searchQuery}
          onclick={(e) => e.stopPropagation()}
          onkeydown={handleSearchKeydown}
          class="focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-500 focus:ring-2 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-400"
        />
      </div>
      <div class="min-h-0 flex-1 overflow-auto p-1">
        {#if sortedItems.length === 0}
          <div class="px-4 py-2 text-sm text-neutral-500 dark:text-neutral-400">
            No options available
          </div>
        {:else if filteredItems.length === 0}
          <div class="px-4 py-2 text-sm text-neutral-500 dark:text-neutral-400">
            No matching options
          </div>
        {:else}
          {#each truncatedItems as item (item.value)}
            <button
              type="button"
              role="option"
              aria-selected={value === item.value}
              onclick={() => selectItem(item.value)}
              onkeydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  selectItem(item.value);
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  const opts = optionButtons();
                  const i = opts.findIndex((el) => el === e.currentTarget);
                  opts[i + 1]?.focus();
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  const opts = optionButtons();
                  const i = opts.findIndex((el) => el === e.currentTarget);
                  if (i > 0) {
                    opts[i - 1]?.focus();
                  } else {
                    searchInputRef?.focus();
                  }
                }
              }}
              class="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-neutral-900 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700 {value ===
              item.value
                ? 'bg-primary-50 text-primary-900 dark:bg-primary-900/20 dark:text-primary-400'
                : ''}"
            >
              {#if value === item.value}
                <svg
                  class="text-primary-600 dark:text-primary-400 h-4 w-4 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              {:else}
                <div class="h-4 w-4"></div>
              {/if}
              <span class="truncate">{item.name}</span>
            </button>
          {/each}
        {/if}
      </div>
    </div>
  {/if}
</div>

{#if field}
  {#each field.issues() ?? [] as issue}
    <P size="base" class="mt-1 text-red-600 dark:text-red-400">{issue.message}</P>
  {/each}
{/if}
