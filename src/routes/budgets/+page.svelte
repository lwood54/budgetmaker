<script lang="ts">
  import { enhance } from '$app/forms';
  let { data } = $props();
  let name = $state('');
</script>

<h2 class="mb-6 text-center text-2xl font-bold text-neutral-900 dark:text-neutral-50">
  Your Budgets
</h2>
<p class="mb-8 text-neutral-700 dark:text-neutral-300">Manage your finances with ease</p>

<div>
  {#each data.budgets as budget}
    <div
      class="flex flex-col gap-2 border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800"
    >
      <h3 class="text-neutral-800 dark:text-neutral-100">{budget.name}</h3>
      <p class="text-neutral-600 dark:text-neutral-400">{budget.createdAt}</p>
    </div>
  {:else}
    <p class="text-neutral-600 dark:text-neutral-400">No budgets yet</p>
  {/each}
</div>

<hr class="border-neutral-200 dark:border-neutral-700" />

<form method="post" use:enhance>
  <div class="flex max-w-md flex-col gap-2">
    <label for="name" class="text-neutral-800 dark:text-neutral-200">Name</label>
    <input
      id="name"
      type="text"
      bind:value={name}
      name="name"
      class="focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-400 dark:focus:ring-primary-400 border-neutral-300 bg-white text-neutral-800 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100"
    />
  </div>
  <button
    class="bg-primary-600 hover:bg-primary-500 dark:bg-primary-700 dark:hover:bg-primary-600 mt-4 rounded px-4 py-2 text-white"
    type="submit">Create Budget</button
  >
</form>
