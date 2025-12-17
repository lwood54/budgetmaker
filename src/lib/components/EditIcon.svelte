<script lang="ts">
  import { Button } from 'flowbite-svelte';
  import { PenOutline } from 'flowbite-svelte-icons';

  type IconSize = 'sm' | 'md' | 'lg' | 'xl';

  interface Props {
    onclick: (e: MouseEvent) => void;
    disabled?: boolean;
    ariaLabel?: string;
    class?: string;
    size?: IconSize;
  }

  let {
    onclick,
    disabled = false,
    ariaLabel = 'Edit',
    class: className = '',
    size = 'md',
  }: Props = $props();

  const sizeClasses = $derived(() => {
    switch (size) {
      case 'sm':
        return {
          button: 'h-6 w-6',
          icon: 'h-3 w-3',
        };
      case 'md':
        return {
          button: 'h-10 w-10',
          icon: 'h-5 w-5',
        };
      case 'lg':
        return {
          button: 'h-12 w-12',
          icon: 'h-6 w-6',
        };
      case 'xl':
        return {
          button: 'h-14 w-14',
          icon: 'h-7 w-7',
        };
    }
  });
</script>

<Button
  color="blue"
  size="xs"
  pill
  outline
  class="edit-btn border-none p-0 shadow-sm transition-all hover:shadow-md {sizeClasses()
    .button} {className}"
  {onclick}
  {disabled}
  aria-label={ariaLabel}
>
  <PenOutline class="{sizeClasses().icon} text-blue-600 dark:text-blue-400" />
</Button>
