<script lang="ts">
  import { goto } from '$app/navigation';

  type _Props = {
    children: any;
    href?: string;
    isActive?: boolean;
    onClick?: () => void;
  };
  let { onClick, href, children, isActive }: _Props = $props();

  const handleClick = () => {
    if (href) {
      goto(href);
    }
    onClick?.();
  };
</script>

<div
  class="flex w-full cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 {isActive
    ? 'bg-primary-200 dark:bg-primary-700'
    : ''}"
  onclick={handleClick}
  onkeydown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
  role="button"
  aria-label="Toggle dark mode"
  tabindex="0"
>
  {@render children()}
</div>
