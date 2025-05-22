<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';

	let { data }: PageProps = $props();

	let name = $state('');
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>

<div>
	{#each data.budgets as budget}
		<div class="flex flex-col gap-2 border border-slate-200 p-4">
			<h3>{budget.name}</h3>
			<p>{budget.createdAt}</p>
		</div>
	{:else}
		<p>No budgets yet</p>
	{/each}
</div>

<hr />

<form method="post" use:enhance>
	<div class="flex max-w-md flex-col gap-2">
		<label for="name">Name</label>
		<input id="name" type="text" bind:value={name} name="name" />
	</div>
	<button class="rounded bg-sky-500 px-4 py-2 text-white hover:bg-sky-700" type="submit"
		>Create Budget</button
	>
</form>
