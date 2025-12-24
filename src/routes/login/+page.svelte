<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { Card, Button, Label, P, A } from 'flowbite-svelte';
  import { EyeOutline, EyeSlashOutline } from 'flowbite-svelte-icons';
  import { Route } from '$lib/constants/routes';
  import { getCurrentUser, login } from '$lib/api/auth.remote';
  import { goto } from '$app/navigation';
  import { Alert, Spinner } from 'flowbite-svelte';
  import Input from '$lib/components/Input.svelte';

  let showPassword = $state(false);
  let loading = $state(false);

  const message = $derived(page.url.searchParams.get('message'));
  const redirectTo = $derived(page.url.searchParams.get('redirectTo') || Route.home);

  onMount(async () => {
    try {
      const userQuery = getCurrentUser();
      const currentUser = await userQuery;
      if (currentUser) {
        goto(redirectTo, { replaceState: true });
      }
    } catch (error) {
      console.error('[login/+page.svelte] Error in onMount:', error);
    }
  });
</script>

<svelte:head>
  <title>Login - Budget Maker</title>
</svelte:head>

<div class="flex w-full flex-col justify-center gap-10 py-12 sm:px-6 lg:px-8">
  <div class="sm:mx-auto sm:w-full sm:max-w-md">
    <P size="3xl" class="text-primary-900 dark:text-primary-200 mb-2 text-center font-bold">
      Welcome back
    </P>
    <P class="text-center text-gray-600 dark:text-gray-400">Sign in to your Budget Maker account</P>
  </div>

  <div class="flex justify-center px-6">
    <Card class="max-w-[600px] px-4 py-8 shadow sm:rounded-lg sm:px-10">
      {#if message}
        <Alert color="green" class="mb-6">
          <span class="font-medium">Success:</span>
          {message}
        </Alert>
      {/if}

      {#if (login.result as any)?.needsVerification}
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
        novalidate
        {...login.enhance(async ({ submit }) => {
          loading = true;
          try {
            await submit();
            // NOTE: If submit succeeds, redirect is handled by the remote function throwing redirect()
            // SvelteKit automatically handles redirect objects
          } catch (error) {
            // NOTE: Re-throw redirects - redirect() throws a Redirect object with status and location
            // SvelteKit needs these to propagate to handle navigation
            if (
              error &&
              typeof error === 'object' &&
              'status' in error &&
              'location' in error &&
              typeof error.status === 'number' &&
              error.status >= 300 &&
              error.status < 400
            ) {
              throw error; // Re-throw redirect - SvelteKit will handle it
            }
            // NOTE: Validation errors are already displayed via Input component's field.issues()
            // Only log unexpected errors (not 422 validation errors)
            if (
              !(error && typeof error === 'object' && 'status' in error && error.status === 422)
            ) {
              console.error('[login/+page.svelte] Unexpected error:', error);
            }
          } finally {
            loading = false;
          }
        })}
        class="space-y-6"
      >
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <div>
          <Label for="email" class="mb-2">Email Address</Label>
          <Input
            id="email"
            field={login.fields.email}
            type="email"
            placeholder="your@email.com"
            class="block w-full text-lg"
            autocomplete="email"
          />
        </div>

        <div>
          <Label for="password" class="mb-2">Password</Label>
          <div class="relative">
            <Input
              id="password"
              field={login.fields.password}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              class="block w-full pr-10 text-lg"
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

        <div class="flex items-center justify-between">
          <div></div>
          <div class="text-sm">
            <A href={Route.reset} class="text-primary-600 hover:text-primary-500 font-medium">
              Forgot your password?
            </A>
          </div>
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
              Signing in...
            {:else}
              Sign In
            {/if}
          </Button>
        </div>

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
