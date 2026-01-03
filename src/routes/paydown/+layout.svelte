<script lang="ts">
  import { Button, ButtonGroup } from 'flowbite-svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';

  let { children } = $props();

  const tabActiveClass =
    'bg-primary-600 dark:bg-primary-400 text-primary-200 dark:text-primary-800 focus:bg-primary-700 dark:focus:bg-primary-500';

  const currentPath = $derived(page.url.pathname);

  function isActive(path: string): boolean {
    return currentPath === path || currentPath.startsWith(path + '/');
  }

  function navigateTo(path: string) {
    goto(path);
  }
</script>

<div class="mx-2 mb-4 flex flex-col gap-4">
  <ButtonGroup class="mt-8">
    <Button
      class={currentPath === '/paydown' ? tabActiveClass : ''}
      onclick={() => navigateTo('/paydown')}>Setup</Button
    >
    <Button
      class={isActive('/paydown/generate') ? tabActiveClass : ''}
      onclick={() => navigateTo('/paydown/generate')}>Generate Plan</Button
    >
    <Button
      class={isActive('/paydown/saved') ? tabActiveClass : ''}
      onclick={() => navigateTo('/paydown/saved')}>Saved Plans</Button
    >
  </ButtonGroup>

  {@render children()}
</div>
