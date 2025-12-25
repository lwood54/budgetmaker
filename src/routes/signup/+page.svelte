<script lang="ts">
  import { Card, Button, Label, Helper, P, A, Spinner } from 'flowbite-svelte';
  import Input from '$lib/components/Input.svelte';
  import { EyeOutline, EyeSlashOutline } from 'flowbite-svelte-icons';
  import PasswordStrength from '$lib/components/PasswordStrength.svelte';
  import { signup, getCurrentUser } from '$lib/api/auth.remote';
  import { Route } from '$lib/constants/routes';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let showPassword = $state(false);
  let showConfirmPassword = $state(false);
  let loading = $state(false);

  // NOTE: Make password value reactive so PasswordStrength updates as user types
  // Use field.as('text') to get the value, similar to how Input.svelte does it
  const passwordValue = $derived.by(() => {
    try {
      const attrs = signup.fields.password.as('text');
      return (attrs?.value as string) || '';
    } catch {
      return '';
    }
  });

  // NOTE: Make confirm password value reactive for button disabled state
  const confirmPasswordValue = $derived.by(() => {
    try {
      const attrs = signup.fields.confirmPassword.as('text');
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
      <form
        novalidate
        {...signup.enhance(async ({ submit }) => {
          loading = true;
          try {
            await submit();
            // NOTE: Redirect is handled by the remote function throwing redirect()
          } catch (error) {
            // NOTE: Validation errors are displayed via Input component's field.issues()
            // Only log unexpected errors (not 422 validation errors)
            if (
              !(error && typeof error === 'object' && 'status' in error && error.status === 422)
            ) {
              console.error('Signup error:', error);
            }
          } finally {
            loading = false;
          }
        })}
        class="space-y-6"
      >
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <Label for="firstName" class="mb-2">First Name</Label>
            <Input
              id="firstName"
              field={signup.fields.firstName}
              type="text"
              placeholder="First name"
              class="block w-full text-lg"
            />
          </div>
          <div>
            <Label for="lastName" class="mb-2">Last Name</Label>
            <Input
              id="lastName"
              field={signup.fields.lastName}
              type="text"
              placeholder="Last name"
              class="block w-full text-lg"
            />
          </div>
        </div>

        <div>
          <Label for="email" class="mb-2">Email Address *</Label>
          <Input
            id="email"
            field={signup.fields.email}
            type="email"
            placeholder="your@email.com"
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
              field={signup.fields.password}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
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
          <PasswordStrength password={passwordValue} />
        </div>

        <div>
          <Label for="confirmPassword" class="mb-2">Confirm Password *</Label>
          <div class="relative">
            <Input
              id="confirmPassword"
              field={signup.fields.confirmPassword}
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
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
            disabled={loading ||
              !passwordValue ||
              !confirmPasswordValue ||
              passwordValue !== confirmPasswordValue}
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
