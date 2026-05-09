<script lang="ts">
  import { Toast, ToastContainer } from 'flowbite-svelte';
  import { P } from 'flowbite-svelte';
  import { CheckCircleOutline } from 'flowbite-svelte-icons';

  let {
    message = $bindable<string | null>(null),
    autoDismissMs = 4000,
    dismissable = false,
  }: {
    message?: string | null;
    autoDismissMs?: number;
    dismissable?: boolean;
  } = $props();

  $effect(() => {
    if (message == null) return;
    const id = setTimeout(() => {
      message = null;
    }, autoDismissMs);
    return () => clearTimeout(id);
  });
</script>

{#if message}
  <ToastContainer position="bottom-left" class="z-[100]">
    <Toast {dismissable} color="green">
      {#snippet icon()}
        <CheckCircleOutline class="h-5 w-5" />
      {/snippet}
      <P class="text-sm font-medium text-gray-900 dark:text-white">{message}</P>
    </Toast>
  </ToastContainer>
{/if}
