<script lang="ts">
  import { Card, Button, Label, Input, P, A, Alert, Spinner } from 'flowbite-svelte';
  import { enhance } from '$app/forms';
  import { EyeOutline, EyeSlashOutline } from 'flowbite-svelte-icons';
  import { Route } from '$lib/constants/routes';

  let { data, form } = $props();

  let showPassword = $state(false);
  let showConfirmPassword = $state(false);
  let loading = $state(false);

  let currentStep = $derived(form?.step || data?.step || 'request');
  let currentToken = $derived(form?.token || data?.token);
</script>

<svelte:head>
  <title>Reset Password - Budget Maker</title>
</svelte:head>

<div
  class="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8 dark:bg-gray-900"
>
  <div class="sm:mx-auto sm:w-full sm:max-w-md">
    {#if currentStep === 'request'}
      <P size="3xl" class="text-primary-900 dark:text-primary-200 mb-2 text-center font-bold">
        Forgot Password?
      </P>
      <P class="text-center text-gray-600 dark:text-gray-400">
        Enter your email address and we'll send you a link to reset your password
      </P>
    {:else if currentStep === 'sent'}
      <P size="3xl" class="text-primary-900 dark:text-primary-200 mb-2 text-center font-bold">
        Check Your Email
      </P>
      <P class="text-center text-gray-600 dark:text-gray-400">
        We've sent you a password reset link
      </P>
    {:else if currentStep === 'reset'}
      <P size="3xl" class="text-primary-900 dark:text-primary-200 mb-2 text-center font-bold">
        Reset Password
      </P>
      <P class="text-center text-gray-600 dark:text-gray-400">Enter your new password below</P>
    {/if}
  </div>

  <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <Card class="px-4 py-8 shadow sm:rounded-lg sm:px-10">
      {#if form?.error || data?.error}
        <Alert color="red" class="mb-6">
          <span class="font-medium">Error:</span>
          {form?.error || data?.error}
        </Alert>
      {/if}

      {#if currentStep === 'request'}
        <!-- Request Password Reset Form -->
        <form
          method="POST"
          action="?/request"
          use:enhance={() => {
            loading = true;
            return async ({ update }) => {
              loading = false;
              await update();
            };
          }}
          class="space-y-6"
        >
          <!-- Email Field -->
          <div>
            <Label for="email" class="mb-2">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="your@email.com"
              value={form?.email || ''}
              required
              class="block w-full"
              autocomplete="email"
            />
          </div>

          <!-- Submit Button -->
          <div>
            <Button type="submit" class="flex w-full justify-center px-4 py-2" disabled={loading}>
              {#if loading}
                <Spinner class="mr-3" size="4" color="gray" />
                Sending Reset Link...
              {:else}
                Send Reset Link
              {/if}
            </Button>
          </div>

          <!-- Back to Login Link -->
          <div class="text-center">
            <P class="text-sm text-gray-600 dark:text-gray-400">
              Remember your password?
              <A href={Route.login} class="text-primary-600 hover:text-primary-500 font-medium">
                Back to Login
              </A>
            </P>
          </div>
        </form>
      {:else if currentStep === 'sent'}
        <!-- Email Sent Confirmation -->
        <div class="space-y-6 text-center">
          <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
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

          <div>
            <h3 class="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">
              Reset Link Sent!
            </h3>
            <P class="mb-4 text-sm text-gray-600 dark:text-gray-400">
              If an account with that email exists, we've sent you a password reset link. Check your
              email and click the link to reset your password.
            </P>
            <P class="text-xs text-gray-500 dark:text-gray-500">
              The reset link will expire in 1 hour.
            </P>
          </div>

          <!-- Back to Login Link -->
          <div>
            <A href={Route.login} class="text-primary-600 hover:text-primary-500 font-medium">
              Back to Login
            </A>
          </div>
        </div>
      {:else if currentStep === 'reset'}
        <!-- Reset Password Form -->
        <form
          method="POST"
          action="?/reset"
          use:enhance={() => {
            loading = true;
            return async ({ update }) => {
              loading = false;
              await update();
            };
          }}
          class="space-y-6"
        >
          <input type="hidden" name="token" value={currentToken} />

          <!-- New Password Field -->
          <div>
            <Label for="password" class="mb-2">New Password</Label>
            <div class="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                required
                class="block w-full pr-10"
                autocomplete="new-password"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 flex items-center pr-3"
                onclick={() => (showPassword = !showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {#if showPassword}
                  <EyeSlashOutline class="h-5 w-5 text-gray-400" />
                {:else}
                  <EyeOutline class="h-5 w-5 text-gray-400" />
                {/if}
              </button>
            </div>
          </div>

          <!-- Confirm Password Field -->
          <div>
            <Label for="confirmPassword" class="mb-2">Confirm New Password</Label>
            <div class="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                required
                class="block w-full pr-10"
                autocomplete="new-password"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 flex items-center pr-3"
                onclick={() => (showConfirmPassword = !showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {#if showConfirmPassword}
                  <EyeSlashOutline class="h-5 w-5 text-gray-400" />
                {:else}
                  <EyeOutline class="h-5 w-5 text-gray-400" />
                {/if}
              </button>
            </div>
          </div>

          <!-- Password Requirements -->
          <div class="text-sm text-gray-600 dark:text-gray-400">
            <P class="mb-1">Password must contain:</P>
            <ul class="list-inside list-disc space-y-1 text-xs">
              <li>At least 8 characters</li>
              <li>One uppercase letter</li>
              <li>One lowercase letter</li>
              <li>One number</li>
              <li>One special character (!@#$%^&*)</li>
            </ul>
          </div>

          <!-- Submit Button -->
          <div>
            <Button type="submit" class="flex w-full justify-center px-4 py-2" disabled={loading}>
              {#if loading}
                <Spinner class="mr-3" size="4" color="gray" />
                Resetting Password...
              {:else}
                Reset Password
              {/if}
            </Button>
          </div>

          <!-- Back to Login Link -->
          <div class="text-center">
            <P class="text-sm text-gray-600 dark:text-gray-400">
              Remember your password?
              <A href={Route.login} class="text-primary-600 hover:text-primary-500 font-medium">
                Back to Login
              </A>
            </P>
          </div>
        </form>
      {/if}
    </Card>
  </div>
</div>
