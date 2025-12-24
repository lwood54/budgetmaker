<script lang="ts">
  import Verified from './components/Verified.svelte';
  import Unverified from './components/Unverified.svelte';
  import { getVerifyEmailData, resendVerification } from '$lib/api/auth.remote';
  import { page } from '$app/state';

  // NOTE: Get verify email data from query - handles token verification and auto-login
  const verifyData = $derived(
    await getVerifyEmailData({
      token: page.url.searchParams.get('token') || undefined,
      email: page.url.searchParams.get('email') || undefined,
      error: page.url.searchParams.get('error') || undefined,
    }),
  );
</script>

<svelte:head>
  <title>Verify Email - BudgetMaker</title>
</svelte:head>

<div class="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8">
  <div class="sm:mx-auto sm:w-full sm:max-w-md">
    <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
      {#if verifyData?.verified}
        Email Verified!
      {:else}
        Verify Your Email
      {/if}
    </h2>
  </div>

  <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <div class="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
      {#if verifyData?.verified}
        <Verified
          firstName={verifyData.firstName}
          email={verifyData.email}
          isAdmin={verifyData.isAdmin || false}
          userId={verifyData.userId}
          autoLoginFailed={verifyData.autoLoginFailed || false}
        />
      {:else}
        <Unverified
          email={verifyData?.email}
          error={verifyData?.error}
          isSuccess={Boolean(resendVerification.result?.success)}
          message={resendVerification.result?.message}
        />
      {/if}
    </div>
  </div>
</div>
