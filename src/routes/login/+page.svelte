<script lang="ts">
  import { Card, Button, Label, Input, P, A, Alert, Spinner } from 'flowbite-svelte';
  import { enhance } from '$app/forms';
  import { EyeOutline, EyeSlashOutline } from 'flowbite-svelte-icons';
  import { Route } from '$lib/constants/routes';

  let { form, data } = $props();

  let showPassword = $state(false);
  let loading = $state(false);
</script>

<svelte:head>
  <title>Login - Budget Maker</title>
</svelte:head>

<div
  class="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8 dark:bg-gray-900"
>
  <div class="sm:mx-auto sm:w-full sm:max-w-md">
    <P size="3xl" class="text-primary-900 dark:text-primary-200 mb-2 text-center font-bold">
      Welcome back
    </P>
    <P class="text-center text-gray-600 dark:text-gray-400">Sign in to your Budget Maker account</P>
  </div>

  <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <Card class="px-4 py-8 shadow sm:rounded-lg sm:px-10">
      {#if data?.message}
        <Alert color="green" class="mb-6">
          <span class="font-medium">Success:</span>
          {data.message}
        </Alert>
      {/if}

      {#if form?.error}
        <Alert color="red" class="mb-6">
          <span class="font-medium">Error:</span>
          {form.error}
        </Alert>
      {/if}

      {#if form?.needsVerification}
        <Alert color="yellow" class="mb-6">
          <span class="font-medium">Email verification required:</span>
          Please check your email and click the verification link before logging in.
          <div class="mt-2">
            <A href={Route.verifyEmail} class="text-yellow-800 underline dark:text-yellow-300">
              Resend verification email
            </A>
          </div>
        </Alert>
      {/if}

      <form
        method="POST"
        action="?/login"
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
            placeholder="john@example.com"
            value={form?.email || ''}
            required
            class="block w-full"
            autocomplete="email"
          />
        </div>

        <!-- Password Field -->
        <div>
          <Label for="password" class="mb-2">Password</Label>
          <div class="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              required
              class="block w-full pr-10"
              autocomplete="current-password"
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

        <!-- Forgot Password Link -->
        <div class="flex items-center justify-between">
          <div></div>
          <div class="text-sm">
            <A href={Route.reset} class="text-primary-600 hover:text-primary-500 font-medium">
              Forgot your password?
            </A>
          </div>
        </div>

        <!-- Submit Button -->
        <div>
          <Button type="submit" class="flex w-full justify-center px-4 py-2" disabled={loading}>
            {#if loading}
              <Spinner class="mr-3" size="4" color="gray" />
              Signing in...
            {:else}
              Sign In
            {/if}
          </Button>
        </div>

        <!-- Sign Up Link -->
        <div class="text-center">
          <P class="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?
            <A href={Route.signup} class="text-primary-600 hover:text-primary-500 font-medium">
              Create one here
            </A>
          </P>
        </div>
      </form>
    </Card>
  </div>
</div>
