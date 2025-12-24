<script lang="ts">
  import { performCleanupAction } from '$lib/api/auth.remote';

  let isLoading = $state(false);
</script>

<div class="mx-auto max-w-2xl p-6">
  <h1 class="mb-6 text-2xl font-bold">Manual Cleanup</h1>

  <form
    {...performCleanupAction.enhance(async ({ submit }) => {
      isLoading = true;
      try {
        await submit();
      } finally {
        isLoading = false;
      }
    })}
  >
    <button
      type="submit"
      disabled={isLoading}
      class="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
    >
      {isLoading ? 'Running Cleanup...' : 'Run Manual Cleanup'}
    </button>
  </form>

  {#if performCleanupAction.result?.success}
    <div class="mt-4 rounded border border-green-400 bg-green-100 p-4 text-green-700">
      <h3 class="font-bold">Cleanup Completed!</h3>
      <p>Deleted {performCleanupAction.result.deletedCount} unverified users</p>
      <p>Deleted {performCleanupAction.result.deletedTokenCount} expired tokens</p>
      <p>Timestamp: {performCleanupAction.result.timestamp}</p>
    </div>
  {/if}

  {#if performCleanupAction.result?.error}
    <div class="mt-4 rounded border border-red-400 bg-red-100 p-4 text-red-700">
      <p>Error: {performCleanupAction.result.error}</p>
    </div>
  {/if}
</div>
