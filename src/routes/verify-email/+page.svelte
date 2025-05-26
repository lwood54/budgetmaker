<script lang="ts">
  import Verified from './components/Verified.svelte';
  import Unverified from './components/Unverified.svelte';

  let { data, form } = $props();
</script>

<svelte:head>
  <title>Verify Email - BudgetMaker</title>
</svelte:head>

<div
  class="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8 dark:bg-gray-900"
>
  <div class="sm:mx-auto sm:w-full sm:max-w-md">
    <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
      {#if data.verified}
        Email Verified!
      {:else}
        Verify Your Email
      {/if}
    </h2>
  </div>

  <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <div class="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
      {#if data.verified}
        <Verified
          firstName={data.firstName}
          email={data.email}
          isAdmin={data.isAdmin || false}
          userId={data.userId}
          autoLoginFailed={data.autoLoginFailed || false}
        />
      {:else}
        <Unverified
          email={data.email}
          error={data.error || form?.error}
          isSuccess={Boolean(form?.success)}
          message={form?.message}
        />
      {/if}
    </div>
  </div>
</div>
