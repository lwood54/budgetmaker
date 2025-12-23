<script lang="ts">
  import { logout } from '$lib/api/auth.remote';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let formElement: HTMLFormElement;

  onMount(() => {
    // Auto-submit the form on mount
    if (formElement) {
      formElement.requestSubmit();
    }
  });
</script>

<div class="flex min-h-screen items-center justify-center">
  <p>Logging out...</p>

  <form
    bind:this={formElement}
    {...logout.enhance(async ({ submit }) => {
      try {
        await submit();
        if (logout.result?.redirectTo) {
          goto(logout.result.redirectTo);
        } else {
          goto('/login');
        }
      } catch (error) {
        console.error('Logout error:', error);
        goto('/login');
      }
    })}
    style="display: none;"
  ></form>
</div>
