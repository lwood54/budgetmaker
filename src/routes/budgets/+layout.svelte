<script lang="ts">
  import { Button } from 'flowbite-svelte';
  import { PlusOutline } from 'flowbite-svelte-icons';
  import AddItemDrawer from './components/AddItemDrawer.svelte';

  let { children } = $props();

  let drawerOpen = $state(false);

  function handleCreateItem() {
    drawerOpen = true;
  }
</script>

<div class="pb-12">
  {@render children()}
</div>

<div class="fixed right-4 bottom-4 z-20">
  <Button
    color="primary"
    size="xl"
    pill
    class="h-14 w-14 shadow-lg transition-shadow hover:shadow-xl"
    onclick={handleCreateItem}
    aria-label="Add new item"
  >
    <PlusOutline class="h-6 w-6" />
  </Button>
</div>

<AddItemDrawer bind:open={drawerOpen} />
