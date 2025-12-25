<script lang="ts">
  import { Card, Range, Input, Label, P, Button } from 'flowbite-svelte';
  import { toLocalCurrency } from '$lib/helpers/conversions';

  import { onMount } from 'svelte';
  import CreditCardChart from './CreditCardChart.svelte';

  const { isSelected }: { isSelected: boolean } = $props();

  // INPUT STATE
  let principalBalance = $state(500);
  let annualInterestRate = $state(5.5);
  let monthlyPayment = $state(75);

  // RESULTANT STATE
  let monthsToPayOff = $state(0);
  let hasPayoffWarning = $state(false);
  let monthYear = $state('');
  let totalInterest = $state(0);
  let balances = $state<number[]>([]);
  let hasCalculated = $state(false);

  // FUNCTIONS
  const getMonthsToPayOff = () => {
    const monthlyInterestRate = annualInterestRate > 0 ? annualInterestRate / 100 / 12 : 0;
    const minimumPayment = principalBalance * monthlyInterestRate;
    if (monthlyPayment <= minimumPayment) {
      return;
    }
    const numeratorLogInput =
      monthlyPayment / (monthlyPayment - principalBalance * monthlyInterestRate);
    const numerator = Math.log(numeratorLogInput);
    const denominator = Math.log(1 + monthlyInterestRate);
    const remainingMonths =
      monthlyInterestRate > 0 ? numerator / denominator : principalBalance / monthlyPayment;
    return Math.ceil(remainingMonths);
  };
  const getMonthYear = (monthsToPayOff: number) => {
    const today = new Date();
    const payoffDate = new Date(today);
    payoffDate.setMonth(today.getMonth() + monthsToPayOff);
    return payoffDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  const setMonthsToPayOff = () => {
    const remainingMonths = getMonthsToPayOff();
    if (!remainingMonths) {
      hasPayoffWarning = true;
    }
    monthsToPayOff = remainingMonths ?? 0;
    monthYear = getMonthYear(monthsToPayOff);
  };

  const getTotalInterest = () => {
    let totalInterest = 0;
    let balance = principalBalance;
    const monthlyInterestRate = annualInterestRate / 100 / 12;

    for (let i = 0; i < monthsToPayOff; i++) {
      // Calculate interest that accrues on current balance
      const interest = balance * monthlyInterestRate;
      totalInterest += interest;

      // Principal is the portion of payment that reduces the balance
      // Payment first covers interest, then remainder goes to principal
      const principal = Math.min(monthlyPayment - interest, balance);

      // Reduce balance by principal only (not full payment)
      balance = Math.max(0, balance - principal);

      balances.push(balance);
    }
    return totalInterest;
  };

  const setTotalInterest = () => {
    totalInterest = getTotalInterest();
  };

  const handleRecalculate = () => {
    setMonthsToPayOff();
    setTotalInterest();
    hasCalculated = true;
  };

  onMount(() => {
    handleRecalculate();
  });

  const resetResultState = () => {
    hasCalculated = false;
    balances = [];
    totalInterest = 0;
    monthsToPayOff = 0;
    monthYear = '';
    hasPayoffWarning = false;
  };
</script>

{#if isSelected}
  <div class="flex flex-col gap-4 p-4">
    <P class="text-center font-semibold" size="lg">Credit Card Paydown</P>
    <div class="flex gap-4">
      <div class="flex flex-1 flex-col gap-4">
        <Card class="flex w-full max-w-none flex-col gap-4 md:flex-row">
          <div class="flex w-full flex-col gap-4 p-4">
            <div class="flex w-full flex-col gap-2">
              <Label for="principalBalance">Principal Balance</Label>
              <Input
                id="principalBalance"
                type="number"
                bind:value={principalBalance}
                oninput={resetResultState}
                min="0"
                step="100"
                class="text-lg"
              />
            </div>

            <div class="flex flex-col gap-2">
              <Label for="annualInterestRate">Annual Interest Rate (%)</Label>
              <Input
                id="annualInterestRate"
                type="number"
                bind:value={annualInterestRate}
                oninput={resetResultState}
                min="0"
                max="99"
                step="0.01"
                class="text-lg"
              />
              <Range
                id="annualInterestRate"
                bind:value={annualInterestRate}
                oninput={resetResultState}
                min="0"
                max="30"
                step="0.1"
              />
              <div class="mt-2 text-sm text-gray-500">
                {annualInterestRate}%
              </div>
            </div>

            <div class="flex flex-col gap-2">
              <Label for="monthlyPayment">Monthly Payment</Label>
              <Input
                id="monthlyPayment"
                type="number"
                bind:value={monthlyPayment}
                oninput={resetResultState}
                min="0"
                step="1"
                class="text-lg"
              />
              <Range
                id="monthlyPayment"
                bind:value={monthlyPayment}
                oninput={resetResultState}
                min="0"
                max={principalBalance + 1}
                step="1"
              />
              <div class="mt-2 text-sm text-gray-500">
                {toLocalCurrency(monthlyPayment)}
              </div>
            </div>
          </div>
        </Card>

        <Card class="flex w-full max-w-none flex-1">
          {#if hasCalculated}
            <div class="space-y-4 p-4">
              {#if !hasPayoffWarning}
                <P size="lg"
                  >If you pay {toLocalCurrency(monthlyPayment)} per month, you will pay off the debt
                  in
                  {monthsToPayOff}
                  months. Which would be {monthYear}.</P
                >
                <P size="lg">
                  Total Interest Paid: {toLocalCurrency(totalInterest)}
                </P>
              {:else}
                <P size="lg">
                  Your monthly payment is too low. Please increase your monthly payment.
                </P>
              {/if}
            </div>
          {:else}
            <Button onclick={handleRecalculate}>Recalculate</Button>
          {/if}
        </Card>
        <div class="flex flex-2 flex-col gap-4 md:hidden">
          <CreditCardChart {balances} />
        </div>
      </div>
      <div class="hidden flex-2 flex-col gap-4 md:flex">
        <CreditCardChart {balances} />
      </div>
    </div>
  </div>
{/if}
