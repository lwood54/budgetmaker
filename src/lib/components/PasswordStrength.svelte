<script lang="ts">
  import { checkPasswordStrength } from '$lib/helpers/auth.js';
  import { Helper } from 'flowbite-svelte';

  let { password } = $props();

  // NOTE: Ensure password is always a string - handle form field objects and undefined
  // During SSR, form fields might not be initialized, so we need to safely extract the string value
  const passwordString = $derived.by(() => {
    // If it's already a string, use it
    if (typeof password === 'string') {
      return password;
    }
    // If it's an object with a value property (form field object)
    if (password && typeof password === 'object') {
      if ('value' in password) {
        const value = password.value;
        // If value is a string, use it; otherwise try to convert or default to empty string
        if (typeof value === 'string') {
          return value;
        }
        // If value is undefined/null, return empty string
        if (value === null || value === undefined) {
          return '';
        }
        // Try to convert to string as last resort
        try {
          return String(value);
        } catch {
          return '';
        }
      }
    }
    // Default to empty string for any other case
    return '';
  });

  let passwordStrength = $derived(checkPasswordStrength(passwordString));
</script>

<div class="mt-2">
  <div class="mb-1 flex items-center justify-between">
    <span class="text-sm text-gray-600 dark:text-gray-400">Password strength:</span>
    <span class="text-sm font-medium text-{passwordStrength.color}-600">
      {passwordStrength.text}
    </span>
  </div>
  <div class="h-2 w-full rounded-full bg-gray-200">
    <div
      class="bg-{passwordStrength.color}-600 h-2 rounded-full transition-all duration-300"
      style="width: {(passwordStrength.validCount / 5) * 100}%"
    ></div>
  </div>
</div>

<div class="mt-3 space-y-1">
  <Helper class="text-xs">Password must contain:</Helper>
  <div class="grid grid-cols-1 gap-1 text-xs">
    <div class="flex items-center space-x-2">
      <span
        class="h-2 w-2 rounded-full {passwordStrength.state.minLength
          ? 'bg-green-500'
          : 'bg-gray-300'}"
      ></span>
      <span class={passwordStrength.state.minLength ? 'text-green-600' : 'text-gray-500'}>
        At least 8 characters
      </span>
    </div>
    <div class="flex items-center space-x-2">
      <span
        class="h-2 w-2 rounded-full {passwordStrength.state.hasUpperCase
          ? 'bg-green-500'
          : 'bg-gray-300'}"
      ></span>
      <span class={passwordStrength.state.hasUpperCase ? 'text-green-600' : 'text-gray-500'}>
        One uppercase letter
      </span>
    </div>
    <div class="flex items-center space-x-2">
      <span
        class="h-2 w-2 rounded-full {passwordStrength.state.hasLowerCase
          ? 'bg-green-500'
          : 'bg-gray-300'}"
      ></span>
      <span class={passwordStrength.state.hasLowerCase ? 'text-green-600' : 'text-gray-500'}>
        One lowercase letter
      </span>
    </div>
    <div class="flex items-center space-x-2">
      <span
        class="h-2 w-2 rounded-full {passwordStrength.state.hasNumbers
          ? 'bg-green-500'
          : 'bg-gray-300'}"
      ></span>
      <span class={passwordStrength.state.hasNumbers ? 'text-green-600' : 'text-gray-500'}>
        One number
      </span>
    </div>
    <div class="flex items-center space-x-2">
      <span
        class="h-2 w-2 rounded-full {passwordStrength.state.hasSpecialChar
          ? 'bg-green-500'
          : 'bg-gray-300'}"
      ></span>
      <span class={passwordStrength.state.hasSpecialChar ? 'text-green-600' : 'text-gray-500'}>
        One special character
      </span>
    </div>
  </div>
</div>
