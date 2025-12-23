<script lang="ts">
  import { Card, Button, Label, P, A, Alert, Spinner } from 'flowbite-svelte';
  import { EyeOutline, EyeSlashOutline } from 'flowbite-svelte-icons';
  import { Route } from '$lib/constants/routes';
  import { login, getLoginPageData } from '$lib/api/auth.remote';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import Input from '$lib/components/Input.svelte';

  const pageData = getLoginPageData();

  // Handle redirect if user is already logged in
  $effect(() => {
    const data = pageData.current;
    if (data?.redirectTo) {
      goto(data.redirectTo);
    }
  });

  let showPassword = $state(false);
  let loading = $state(false);
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
    <Card class="max-w-[600px] px-4 py-8 shadow  sm:rounded-lg sm:px-10">
      {#if pageData.current?.message}
        <Alert color="green" class="mb-6">
          <span class="font-medium">Success:</span>
          {pageData.current.message}
        </Alert>
      {/if}

      {#if login.fields.email.issues()?.[0]?.message?.includes('verify your email')}
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
            if (login.result?.redirectTo) {
              goto(login.result.redirectTo);
            }
          } catch (error) {
            console.error('Login error:', error);
          } finally {
            loading = false;
          }
        })}
        class="space-y-6"
      >
        <input
          type="hidden"
          name="redirectTo"
          value={page.url.searchParams.get('redirectTo') || Route.home}
        />
        <div>
          <Label for="email" class="mb-2">Email Address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="your@email.com"
            field={login.fields.email}
            class="block w-full text-lg"
            autocomplete="email"
          />
        </div>

        <div>
          <Label for="password" class="mb-2">Password</Label>
          <div class="relative">
            <Input
              id="password"
              name="password"
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
