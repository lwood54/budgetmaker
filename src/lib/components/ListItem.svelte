<script lang="ts">
  import { goto } from '$app/navigation';

  type _Props = {
    onClick: () => void;
    href: string;
    children: any;
  };
  let { onClick, href, children }: _Props = $props();

  const handleClick = () => {
    if (href) {
      goto(href);
    }
    onClick();
  };
</script>

<div
  class="flex w-full cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700"
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
