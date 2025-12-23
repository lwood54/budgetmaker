<script lang="ts">
  import { enhance } from '$app/forms';
  import CircleWithWarning from '$lib/assets/SvgComponents/combined/CircleWithWarning.svelte';
  import { Spinner } from 'flowbite-svelte';

  type _Props = {
    email?: string | null;
    error?: string | null;
    isSuccess: boolean;
    message?: string;
  };
  let { email, error, isSuccess, message }: _Props = $props();

  let isResending = $state(false);
</script>

<div class="text-center">
  <CircleWithWarning />
  <h3 class="mb-2 text-lg font-medium text-gray-900">Check Your Email</h3>

  {#if email}
    <p class="mb-4 text-sm text-gray-600">
      We've sent a verification link to <strong>{email}</strong>
    </p>
  {/if}

  <p class="mb-6 text-sm text-gray-600">
    Click the link in the email to verify your account and complete your registration.
  </p>

  {#if error}
    <div class="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
      <p class="text-sm text-red-600">
        {error}
      </p>
    </div>
  {/if}

  {#if isSuccess}
    <div class="mb-4 rounded-md border border-green-200 bg-green-50 p-3">
      <p class="text-sm text-green-600">
        {message}
      </p>
    </div>
  {/if}

  {#if email}
    <form
      method="post"
      action="?/resend"
      use:enhance={() => {
        isResending = true;
        return async ({ update }) => {
          await update();
          isResending = false;
        };
      }}
    >
      <input type="hidden" name="email" value={email} />

      <button
        type="submit"
        disabled={isResending}
        class="flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        {#if isResending}
          <div class="flex items-center gap-2">
            <Spinner color="green" size="6" />
            Sending...
          </div>
        {:else}
          Resend Verification Email
        {/if}
      </button>
    </form>
  {/if}

  <div class="mt-6">
    <a href="/login" class="text-sm text-indigo-600 hover:text-indigo-500">
      Already verified? Sign in
    </a>
  </div>
</div>
