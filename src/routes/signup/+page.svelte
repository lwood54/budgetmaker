<script lang="ts">
  import { Card, Button, Label, Input, Helper, P, A, Alert, Spinner } from 'flowbite-svelte';
  import { enhance } from '$app/forms';
  import { EyeOutline, EyeSlashOutline } from 'flowbite-svelte-icons';
  import PasswordStrength from '$lib/components/PasswordStrength.svelte';

  let { form } = $props();

  let showPassword = $state(false);
  let showConfirmPassword = $state(false);
  let loading = $state(false);
  let password = $state('');
  let confirmPassword = $state('');
</script>

<svelte:head>
  <title>Sign Up - Budget Maker</title>
</svelte:head>

<div class="flex min-h-screen flex-col justify-center gap-8 py-12 sm:px-6 lg:px-8">
  <div class="sm:mx-auto sm:w-full sm:max-w-md">
    <P size="3xl" class="text-primary-900 dark:text-primary-200 mb-2 text-center font-bold">
      Create your account
    </P>
    <P class="text-center text-gray-600 dark:text-gray-400">
      Join Budget Maker to start managing your finances
    </P>
  </div>

  <div class="flex justify-center px-6">
    <Card class="px-4 py-8 shadow sm:min-w-full sm:rounded-lg sm:px-10 md:min-w-[600px]">
      {#if form?.error}
        <Alert color="red" class="mb-6">
          <span class="font-medium">Error:</span>
          {form.error}
        </Alert>
      {/if}

      <form
        method="POST"
        action="?/signup"
        use:enhance={() => {
          loading = true;
          return async ({ update }) => {
            loading = false;
            await update();
          };
        }}
        class="space-y-6"
      >
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <Label for="firstName" class="mb-2">First Name</Label>
            <Input
              id="firstName"
              name="firstName"
              type="text"
              placeholder="First name"
              value={form?.firstName || ''}
              class="block w-full text-lg"
            />
          </div>
          <div>
            <Label for="lastName" class="mb-2">Last Name</Label>
            <Input
              id="lastName"
              name="lastName"
              type="text"
              placeholder="Last name"
              value={form?.lastName || ''}
              class="block w-full text-lg"
            />
          </div>
        </div>

        <div>
          <Label for="email" class="mb-2">Email Address *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="your@email.com"
            value={form?.email || ''}
            required
            class="block w-full text-lg"
          />
          <Helper class="mt-2 text-sm text-gray-500">
            We'll send you a verification email to confirm your account.
          </Helper>
        </div>

        <div>
          <Label for="password" class="mb-2">Password *</Label>
          <div class="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              required
              bind:value={password}
              class="block w-full pr-10 text-lg"
            />
            <button
              type="button"
              class="absolute inset-y-0 right-0 flex items-center pr-3"
              onclick={() => (showPassword = !showPassword)}
            >
              {#if showPassword}
                <EyeSlashOutline class="h-5 w-5 text-gray-400" />
              {:else}
                <EyeOutline class="h-5 w-5 text-gray-400" />
              {/if}
            </button>
          </div>
          <PasswordStrength {password} />
        </div>

        <div>
          <Label for="confirmPassword" class="mb-2">Confirm Password *</Label>
          <div class="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              required
              bind:value={confirmPassword}
              class="block w-full pr-10 text-lg"
            />
            <button
              type="button"
              class="absolute inset-y-0 right-0 flex items-center pr-3"
              onclick={() => (showConfirmPassword = !showConfirmPassword)}
            >
              {#if showConfirmPassword}
                <EyeSlashOutline class="h-5 w-5 text-gray-400" />
              {:else}
                <EyeOutline class="h-5 w-5 text-gray-400" />
              {/if}
            </button>
          </div>
        </div>

        <div>
          <Button
            size="lg"
            type="submit"
            class="flex w-full justify-center px-6 py-3"
            disabled={loading || password !== confirmPassword}
          >
            {#if loading}
              <Spinner class="mr-3" size="4" color="gray" />
              Creating account...
            {:else}
              Create Account
            {/if}
          </Button>
        </div>

        <div class="text-center">
          <P class="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?
            <A href="/login" class="text-primary-600 hover:text-primary-500 font-medium">
              Sign in here
            </A>
          </P>
        </div>
      </form>
    </Card>
  </div>
</div>
