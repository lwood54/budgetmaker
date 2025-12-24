<script lang="ts">
  import CircleWithCheck from '$lib/assets/SvgComponents/combined/CircleWithCheck.svelte';
  import { P } from 'flowbite-svelte';
  import { manualLoginAfterVerification } from '$lib/api/auth.remote';

  type _Props = {
    firstName?: string | null;
    email?: string | null;
    isAdmin: boolean;
    userId?: string | null;
    autoLoginFailed: boolean;
  };
  let { firstName, email, isAdmin, userId, autoLoginFailed }: _Props = $props();
</script>

<div class="text-center">
  <CircleWithCheck />

  <h3 class="mb-2 text-lg font-medium text-gray-900">
    Welcome{firstName ? `, ${firstName}` : ''}!
  </h3>

  <p class="mb-6 text-sm text-gray-600">
    Your email has been successfully verified. You can now access all features of BudgetMaker.
  </p>

  {#if autoLoginFailed}
    <div class="mb-4 rounded-md border border-yellow-200 bg-yellow-50 p-3">
      <p class="text-sm text-yellow-600">Automatic login failed. Please click below to continue.</p>
    </div>

    <form
      {...manualLoginAfterVerification.enhance(async ({ submit }) => {
        await submit();
      })}
    >
      <input type="hidden" name="userId" value={userId || ''} />
      <input type="hidden" name="email" value={email || ''} />

      <button
        type="submit"
        class="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
      >
        Continue to Dashboard
      </button>
    </form>
  {:else}
    <P class="text-sm text-gray-500">Redirecting to dashboard...</P>
  {/if}
</div>
