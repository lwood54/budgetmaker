<script lang="ts">
  import { Select, Card } from 'flowbite-svelte';
  import CreditCardCalculator from './components/credit-card-calculator.svelte';
  import type { Union } from '$lib/types/custom/utils';
  import AutoLoanCalculator from './components/auto-loan-calculator.svelte';
  import MortgageCalculator from './components/mortgage-calculator.svelte';
  const CALCULATOR = {
    CREDIT: 'CREDIT',
    AUTO: 'AUTO',
    MORTGAGE: 'MORTGAGE',
  } as const;

  type Calculator = Union<typeof CALCULATOR>;
  let selectedCalculator = $state<Calculator>(CALCULATOR.CREDIT);
  const calculators = [
    { value: CALCULATOR.CREDIT, label: 'Credit Card' },
    { value: CALCULATOR.AUTO, label: 'Auto Loan' },
    { value: CALCULATOR.MORTGAGE, label: 'Mortgage' },
  ];
</script>

<div class="container mx-auto px-4 py-8">
  <div class="mx-auto mb-6 w-full">
    <Select
      size="lg"
      classes={{ select: 'h-12' }}
      bind:value={selectedCalculator}
      class="w-full text-lg md:w-1/3"
    >
      {#each calculators as calculator}
        <option value={calculator.value}>{calculator.label}</option>
      {/each}
    </Select>
  </div>

  <Card class="w-full" size="xl">
    {#if selectedCalculator === CALCULATOR.MORTGAGE}
      <MortgageCalculator isSelected />
    {:else if selectedCalculator === CALCULATOR.AUTO}
      <AutoLoanCalculator isSelected />
    {:else if selectedCalculator === CALCULATOR.CREDIT}
      <CreditCardCalculator isSelected />
    {/if}
  </Card>
</div>
