<script lang="ts">
  import Verified from './components/Verified.svelte';
  import Unverified from './components/Unverified.svelte';
  import { getVerifyEmailPageData, resendVerificationEmail } from '$lib/api/auth.remote';
  import { goto } from '$app/navigation';

  const data = getVerifyEmailPageData();

  // Handle redirect if user is already logged in or after successful verification
  $effect(() => {
    const pageData = data.current;
    if (pageData?.redirectTo) {
      goto(pageData.redirectTo);
    }
  });
</script>

<svelte:head>
  <title>Verify Email - BudgetMaker</title>
</svelte:head>

<div class="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8">
  <div class="sm:mx-auto sm:w-full sm:max-w-md">
    <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
      {#if data.current?.verified}
        Email Verified!
      {:else}
        Verify Your Email
      {/if}
    </h2>
  </div>

  <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <div class="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
      {#if data.current?.verified}
        <Verified
          firstName={data.current.firstName}
          email={data.current.email}
          isAdmin={data.current.isAdmin || false}
          userId={data.current.userId}
          autoLoginFailed={data.current.autoLoginFailed || false}
        />
      {:else}
        <Unverified
          email={data.current?.email}
          error={data.current?.error || resendVerificationEmail.fields.email.issues()?.[0]?.message}
          isSuccess={Boolean(resendVerificationEmail.result?.success)}
          message={resendVerificationEmail.result?.message}
        />
      {/if}
    </div>
  </div>
</div>
