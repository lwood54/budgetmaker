<script lang="ts">
  import { Card, Button, Label, Helper, P, A, Spinner } from 'flowbite-svelte';
  import { EyeOutline, EyeSlashOutline } from 'flowbite-svelte-icons';
  import PasswordStrength from '$lib/components/PasswordStrength.svelte';
  import { signup, getSignupPageData } from '$lib/api/auth.remote';
  import { goto } from '$app/navigation';
  import Input from '$lib/components/Input.svelte';

  const pageData = getSignupPageData();

  // Handle redirect if user is already logged in
  $effect(() => {
    const data = pageData.current;
    if (data?.redirectTo) {
      goto(data.redirectTo);
    }
  });

  let showPassword = $state(false);
  let showConfirmPassword = $state(false);
  let loading = $state(false);

  // Get password value from form field for PasswordStrength component
  const password = $derived(signup.fields.password.value || '');
  const confirmPassword = $derived(signup.fields.confirmPassword.value || '');
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
            if (signup.result?.redirectTo) {
              goto(signup.result.redirectTo);
            }
          } catch (error) {
            console.error('Signup error:', error);
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
              name="password"
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
          <PasswordStrength {password} />
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
