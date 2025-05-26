<script lang="ts">
  import { enhance } from '$app/forms';

  let { data, form } = $props();
  let isResending = $state(false);
</script>

<svelte:head>
  <title>Verify Email - BudgetMaker</title>
</svelte:head>

<div class="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
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
        <!-- Success State -->
        <div class="text-center">
          <div
            class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100"
          >
            <svg
              class="h-6 w-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
          </div>

          <h3 class="mb-2 text-lg font-medium text-gray-900">
            Welcome{data.firstName ? `, ${data.firstName}` : ''}!
          </h3>

          <p class="mb-6 text-sm text-gray-600">
            Your email has been successfully verified. You can now access all features of
            BudgetMaker.
          </p>

          {#if data.autoLoginFailed}
            <!-- Show manual login button only if auto-login failed -->
            <div class="mb-4 rounded-md border border-yellow-200 bg-yellow-50 p-3">
              <p class="text-sm text-yellow-600">
                Automatic login failed. Please click below to continue.
              </p>
            </div>

            <form method="post" action="?/login" use:enhance>
              <input type="hidden" name="userId" value={data.userId} />
              <input type="hidden" name="email" value={data.email} />
              <input type="hidden" name="isAdmin" value={data.isAdmin} />

              <button
                type="submit"
                class="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
              >
                Continue to Dashboard
              </button>
            </form>
          {:else}
            <!-- This should rarely be seen since auto-login redirects immediately -->
            <p class="text-sm text-gray-500">Redirecting to dashboard...</p>
          {/if}
        </div>
      {:else}
        <!-- Verification Needed State -->
        <div class="text-center">
          <div
            class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100"
          >
            <svg
              class="h-6 w-6 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              ></path>
            </svg>
          </div>

          <h3 class="mb-2 text-lg font-medium text-gray-900">Check Your Email</h3>

          {#if data.email}
            <p class="mb-4 text-sm text-gray-600">
              We've sent a verification link to <strong>{data.email}</strong>
            </p>
          {/if}

          <p class="mb-6 text-sm text-gray-600">
            Click the link in the email to verify your account and complete your registration.
          </p>

          {#if data.error || form?.error}
            <div class="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
              <p class="text-sm text-red-600">
                {data.error || form?.error}
              </p>
            </div>
          {/if}

          {#if form?.success}
            <div class="mb-4 rounded-md border border-green-200 bg-green-50 p-3">
              <p class="text-sm text-green-600">
                {form.message}
              </p>
            </div>
          {/if}

          {#if data.email}
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
              <input type="hidden" name="email" value={data.email} />

              <button
                type="submit"
                disabled={isResending}
                class="flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {#if isResending}
                  <svg
                    class="mr-3 -ml-1 h-5 w-5 animate-spin text-gray-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Sending...
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
      {/if}
    </div>
  </div>
</div>
