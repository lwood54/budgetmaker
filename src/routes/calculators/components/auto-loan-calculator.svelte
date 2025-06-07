<script lang="ts">
  import { Card, Range, Input, Label, P, Button } from 'flowbite-svelte';
  import { toLocalCurrency } from '$lib/helpers/conversions';
  import { onMount } from 'svelte';
  import AutoLoanChart from './AutoLoanChart.svelte';

  const { isSelected }: { isSelected: boolean } = $props();

  // INPUT STATE
  let vehiclePrice = $state(30000);
  let downPayment = $state(5000);
  let tradeInValue = $state(0);
  let loanTerm = $state(60); // months
  let interestRate = $state(5.5); // annual percentage rate

  // RESULTANT STATE
  let monthlyPayment = $state(0);
  let totalInterest = $state(0);
  let totalCost = $state(0);
  let balances = $state<number[]>([]);
  let hasCalculated = $state(false);

  // FUNCTIONS
  const calculateMonthlyPayment = () => {
    const principal = vehiclePrice - downPayment - tradeInValue;
    const monthlyRate = interestRate / 100 / 12;
    const numerator = principal * monthlyRate * Math.pow(1 + monthlyRate, loanTerm);
    const denominator = Math.pow(1 + monthlyRate, loanTerm) - 1;
    return numerator / denominator;
  };

  const calculateAmortization = () => {
    const principal = vehiclePrice - downPayment - tradeInValue;
    const monthlyRate = interestRate / 100 / 12;
    let balance = principal;
    let totalInterest = 0;
    balances = [];

    for (let i = 0; i < loanTerm; i++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      balance -= principalPayment;
      totalInterest += interestPayment;
      balances.push(balance);
    }
    return totalInterest;
  };

  const handleRecalculate = () => {
    monthlyPayment = calculateMonthlyPayment();
    totalInterest = calculateAmortization();
    totalCost = vehiclePrice + totalInterest;
    hasCalculated = true;
  };

  const resetResultState = () => {
    hasCalculated = false;
    balances = [];
    monthlyPayment = 0;
    totalInterest = 0;
    totalCost = 0;
  };

  onMount(() => {
    handleRecalculate();
  });
</script>

{#if isSelected}
  <div class="flex flex-col gap-4 p-4">
    <P class="text-center font-semibold" size="lg">Auto Loan Calculator</P>
    <div class="flex flex-col gap-4 md:flex-row">
      <div class="flex flex-col gap-4 md:flex-1">
        <Card class="w-full max-w-none flex-2">
          <div class="space-y-4 p-4">
            <div class="flex flex-col gap-2">
              <Label for="vehiclePrice">Vehicle Price</Label>
              <Input
                id="vehiclePrice"
                type="number"
                bind:value={vehiclePrice}
                onchange={resetResultState}
                min="0"
                step="1000"
              />
            </div>

            <div class="flex flex-col gap-2">
              <Label for="downPayment">Down Payment</Label>
              <Input
                id="downPayment"
                type="number"
                bind:value={downPayment}
                onchange={resetResultState}
                min="0"
                step="500"
              />
            </div>

            <div class="flex flex-col gap-2">
              <Label for="tradeInValue">Trade-In Value</Label>
              <Input
                id="tradeInValue"
                type="number"
                bind:value={tradeInValue}
                onchange={resetResultState}
                min="0"
                step="500"
              />
            </div>

            <div class="flex flex-col gap-2">
              <Label for="loanTerm">Loan Term (months)</Label>
              <Input
                id="loanTerm"
                type="number"
                bind:value={loanTerm}
                onchange={resetResultState}
                min="12"
                max="84"
                step="12"
              />
              <Range
                id="loanTerm"
                bind:value={loanTerm}
                onchange={resetResultState}
                min="12"
                max="84"
                step="12"
              />
              <div class="mt-2 text-sm text-gray-500">
                {loanTerm} months
              </div>
            </div>

            <div class="flex flex-col gap-2">
              <Label for="interestRate">Interest Rate (%)</Label>
              <Input
                id="interestRate"
                type="number"
                bind:value={interestRate}
                onchange={resetResultState}
                min="0"
                max="20"
                step="0.1"
              />
              <Range
                id="interestRate"
                bind:value={interestRate}
                onchange={resetResultState}
                min="0"
                max="20"
                step="0.1"
              />
              <div class="mt-2 text-sm text-gray-500">
                {interestRate}%
              </div>
            </div>
          </div>
        </Card>

        <Card class="w-full max-w-none flex-1 p-4">
          {#if hasCalculated}
            <div class="space-y-4">
              <P size="lg">
                Monthly Payment: {toLocalCurrency(monthlyPayment)}
              </P>
              <P size="lg">
                Total Interest: {toLocalCurrency(totalInterest)}
              </P>
              <P size="lg">
                Total Cost: {toLocalCurrency(totalCost)}
              </P>
            </div>
          {:else}
            <Button onclick={handleRecalculate}>Calculate</Button>
          {/if}
        </Card>

        <div class="flex flex-2 flex-col gap-4 md:hidden">
          {#if hasCalculated}
            <AutoLoanChart {balances} />
          {/if}
        </div>
      </div>
      <div class="hidden flex-2 flex-col gap-4 md:flex">
        {#if hasCalculated}
          <AutoLoanChart {balances} />
        {/if}
      </div>
    </div>
  </div>
{/if}
