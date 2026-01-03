<script lang="ts">
  import { Card } from 'flowbite-svelte';
  import Select from '$lib/components/Select.svelte';
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
    { value: CALCULATOR.CREDIT, name: 'Credit Card' },
    { value: CALCULATOR.AUTO, name: 'Auto Loan' },
    { value: CALCULATOR.MORTGAGE, name: 'Mortgage' },
  ];
</script>

<div class="container mx-auto px-4 py-8">
  <div class="mx-auto mb-6 w-full">
    <Select
      size="lg"
      items={calculators}
      bind:value={selectedCalculator}
      placeholder="Select a calculator"
      class="w-full text-lg md:w-1/3"
    />
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
