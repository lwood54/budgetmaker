<script lang="ts">
  import { Card, Button, Label, P, A, Alert, Spinner } from 'flowbite-svelte';
  import Input from '$lib/components/Input.svelte';
  import { EyeOutline, EyeSlashOutline } from 'flowbite-svelte-icons';
  import { Route } from '$lib/constants/routes';
  import PasswordStrength from '$lib/components/PasswordStrength.svelte';
  import {
    getPasswordResetData,
    requestPasswordResetForm,
    resetPasswordForm,
    getCurrentUser,
  } from '$lib/api/auth.remote';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let showPassword = $state(false);
  let showConfirmPassword = $state(false);
  let loading = $state(false);

  // NOTE: Get reset data from query - handles token validation and step management
  const resetData = $derived(
    await getPasswordResetData({
      token: page.url.searchParams.get('token') || undefined,
      step: page.url.searchParams.get('step') || undefined,
    }),
  );
  const currentStep = $derived(resetData?.step || 'request');
  const currentToken = $derived(resetData?.token || null);
  const resetError = $derived(resetData?.error || null);

  // NOTE: Make password value reactive so PasswordStrength updates as user types
  // Use field.as('text') to get the value, similar to how Input.svelte does it
  const resetPasswordValue = $derived.by(() => {
    if (currentStep !== 'reset') return '';
    try {
      const attrs = resetPasswordForm.fields.password.as('text');
      return (attrs?.value as string) || '';
    } catch {
      return '';
    }
  });

  // NOTE: Make confirm password value reactive for button disabled state
  const resetConfirmPasswordValue = $derived.by(() => {
    if (currentStep !== 'reset') return '';
    try {
      const attrs = resetPasswordForm.fields.confirmPassword.as('text');
      return (attrs?.value as string) || '';
    } catch {
      return '';
    }
  });

  // NOTE: Only check auth status once on mount, not reactively
  // Using onMount prevents premature redirects during navigation
  onMount(async () => {
    const userQuery = getCurrentUser();
    const currentUser = await userQuery;
    if (currentUser) {
      goto(Route.dashboard, { replaceState: true });
    }
  });
</script>

<svelte:head>
  <title>Reset Password - Budget Maker</title>
</svelte:head>

<div class="flex flex-col justify-center gap-8 py-12 sm:px-6 lg:px-8">
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

  <div class="flex justify-center px-6">
    <Card class="min-w-full px-4 py-8 shadow sm:min-w-[500px] sm:rounded-lg sm:px-10">
      {#if resetError}
        <Alert color="red" class="mb-6">
          <span class="font-medium">Error:</span>
          {resetError}
        </Alert>
      {/if}

      {#if currentStep === 'request'}
        <form
          novalidate
          {...requestPasswordResetForm.enhance(async ({ submit }) => {
            loading = true;
            try {
              await submit();
              // NOTE: Redirect is handled by the remote function throwing redirect()
            } catch (error) {
              console.error('Password reset request error:', error);
            } finally {
              loading = false;
            }
          })}
          class="space-y-6"
        >
          <div>
            <Label for="email" class="mb-2">Email Address</Label>
            <Input
              id="email"
              field={requestPasswordResetForm.fields.email}
              type="email"
              placeholder="your@email.com"
              class="block w-full text-lg"
              autocomplete="email"
            />
          </div>

          <div>
            <Button
              size="lg"
              type="submit"
              class="flex w-full justify-center px-6 py-3"
              disabled={loading}
            >
              {#if loading}
                <Spinner class="mr-3" size="4" color="gray" />
                Sending Reset Link...
              {:else}
                Send Reset Link
              {/if}
            </Button>
          </div>

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

          <div>
            <A href={Route.login} class="text-primary-600 hover:text-primary-500 font-medium">
              Back to Login
            </A>
          </div>
        </div>
      {:else if currentStep === 'reset'}
        <form
          novalidate
          {...resetPasswordForm.enhance(async ({ submit }) => {
            loading = true;
            try {
              await submit();
              // NOTE: Redirect is handled by the remote function throwing redirect()
            } catch (error) {
              console.error('Password reset error:', error);
            } finally {
              loading = false;
            }
          })}
          class="space-y-6"
        >
          <input type="hidden" name="token" value={currentToken || ''} />
          <div>
            <Label for="password" class="mb-2">New Password</Label>
            <div class="relative">
              <Input
                id="password"
                field={resetPasswordForm.fields.password}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                class="block w-full pr-10 text-lg"
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

          <div>
            <Label for="confirmPassword" class="mb-2">Confirm New Password</Label>
            <div class="relative">
              <Input
                id="confirmPassword"
                field={resetPasswordForm.fields.confirmPassword}
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                class="block w-full pr-10 text-lg"
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
          <PasswordStrength password={resetPasswordValue} />

          <div>
            <Button
              size="lg"
              type="submit"
              class="flex w-full justify-center px-6 py-3"
              disabled={loading ||
                !resetPasswordValue ||
                !resetConfirmPasswordValue ||
                resetPasswordValue !== resetConfirmPasswordValue}
            >
              {#if loading}
                <Spinner class="mr-3" size="4" color="gray" />
                Resetting Password...
              {:else}
                Reset Password
              {/if}
            </Button>
          </div>

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
