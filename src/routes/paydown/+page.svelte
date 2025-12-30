<script lang="ts">
  import { Button, ButtonGroup, P } from 'flowbite-svelte';
  import Setup from './components/Setup.svelte';

  let activeTab = $state<'setup' | 'plan' | 'saved'>('setup');
  const tabActiveClass =
    'bg-primary-600 dark:bg-primary-400 text-primary-200 dark:text-primary-800 focus:bg-primary-700 dark:focus:bg-primary-500';
</script>

<div class="mx-2 mt-8 mb-4 flex flex-col gap-4">
  <ButtonGroup>
    <Button
      class={activeTab === 'setup' ? tabActiveClass : ''}
      onclick={() => (activeTab = 'setup')}>Setup</Button
    >
    <Button class={activeTab === 'plan' ? tabActiveClass : ''} onclick={() => (activeTab = 'plan')}
      >Generated Plan</Button
    >
    <Button
      class={activeTab === 'saved' ? tabActiveClass : ''}
      onclick={() => (activeTab = 'saved')}>Saved Plans</Button
    >
  </ButtonGroup>

  {#if activeTab === 'setup'}
    <Setup />
  {/if}

  {#if activeTab === 'plan'}
    <div>
      <P>Generated Plan</P>
    </div>
  {/if}

  {#if activeTab === 'saved'}
    <div>
      <P>Saved Plans</P>
    </div>
  {/if}
</div>
