<script lang="ts">
  import {
    Card,
    Range,
    Input,
    Label,
    P,
    Button,
    Table,
    TableHead,
    TableHeadCell,
    TableBody,
    TableBodyRow,
    TableBodyCell,
  } from 'flowbite-svelte';
  import { toLocalCurrency } from '$lib/helpers/conversions';
  import { onMount } from 'svelte';
  import MortgageChart from './MortgageChart.svelte';

  const { isSelected }: { isSelected: boolean } = $props();

  // INPUT STATE
  let homePrice = $state(425000);
  let downPaymentPercent = $state(20);
  // let downPayment = $state(80000);
  let downPayment = $derived((homePrice * downPaymentPercent) / 100);
  let loanTerm = $state(30); // years
  let interestRate = $state(5); // annual percentage rate
  let propertyTax = $state(280); // per month
  let homeInsurance = $state(66); // per month
  let pmiRate = $state(0.5); // annual percentage rate
  let hasPMI = $state(false);
  let finalPaymentDate = $state('');
  let isShowAmortizationTable = $state(false);

  // RESULTANT STATE
  let monthlyPayment = $state(0);
  let principalAndInterest = $state(0);
  let totalInterest = $state(0);
  let totalCost = $state(0);
  let balances = $state<number[]>([]);
  let balancesAndMonths = $state<
    { balance: number; interestPayment: number; principalPayment: number; month: string }[]
  >([]);
  let hasCalculated = $state(false);

  // FUNCTIONS
  const calculatePrincipalAndInterest = () => {
    const loanAmount = homePrice - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;
    const numerator = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments);
    const denominator = Math.pow(1 + monthlyRate, numberOfPayments) - 1;
    return numerator / denominator;
  };

  const calculatePMI = () => {
    if (!hasPMI || downPaymentPercent >= 20) return 0;
    const loanAmount = homePrice - downPayment;
    return (loanAmount * (pmiRate / 100)) / 12;
  };

  const calculateMonthlyPayment = () => {
    const pi = calculatePrincipalAndInterest();
    const pmi = calculatePMI();
    return pi + pmi + propertyTax + homeInsurance;
  };

  const calculateAmortization = () => {
    const loanAmount = homePrice - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;
    let balance = loanAmount;
    let totalInterest = 0;
    balances = [];
    balancesAndMonths = []; // Reset the array

    const getMonthString = (month: number) => {
      const date = new Date();
      date.setMonth(date.getMonth() + month);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });
    };

    for (let i = 0; i < numberOfPayments; i++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = principalAndInterest - interestPayment;
      balance -= principalPayment;

      // Ensure balance doesn't go negative due to floating point precision
      if (balance < 0) balance = 0;

      // Round balance to avoid precision issues with very small numbers
      balance = Math.round(balance * 100) / 100;

      totalInterest += interestPayment;

      // Only add to chart data every 3 months (quarterly) or at the very end
      if (i % 3 === 0 || i === numberOfPayments - 1) {
        balances.push(balance);
      }

      // Keep full monthly data for the amortization table
      balancesAndMonths.push({
        balance: Math.round(balance * 100) / 100,
        interestPayment: Math.round(interestPayment * 100) / 100,
        principalPayment: Math.round(principalPayment * 100) / 100,
        month: getMonthString(i),
      });
    }

    return totalInterest;
  };

  const calculateFinalPaymentDate = () => {
    const today = new Date();
    const finalDate = new Date(today);
    finalDate.setMonth(today.getMonth() + loanTerm * 12);
    return finalDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  const handleRecalculate = () => {
    principalAndInterest = calculatePrincipalAndInterest();
    monthlyPayment = calculateMonthlyPayment();
    totalInterest = calculateAmortization();
    const annualPropertyTax = propertyTax * 12;
    const annualHomeInsurance = homeInsurance * 12;
    totalCost = homePrice + totalInterest + annualPropertyTax + annualHomeInsurance;
    finalPaymentDate = calculateFinalPaymentDate();
    hasCalculated = true;
  };

  const resetResultState = () => {
    hasCalculated = false;
    balances = [];
    monthlyPayment = 0;
    totalInterest = 0;
    totalCost = 0;
    finalPaymentDate = '';
  };

  const updateDownPayment = () => {
    hasPMI = downPaymentPercent < 20;
    resetResultState();
  };

  onMount(() => {
    handleRecalculate();
  });
</script>

{#if isSelected}
  <div class="flex flex-col gap-4 p-4">
    <P class="text-center font-semibold" size="lg">Mortgage Calculator</P>
    <div class="flex flex-col gap-4 md:flex-row">
      <div class="flex flex-col gap-4 md:flex-1">
        <Card class="w-full max-w-none flex-2 p-4">
          <div class="space-y-4 p-4">
            <div class="flex flex-col gap-2">
              <Label for="homePrice">Home Price</Label>
              <Input
                id="homePrice"
                type="number"
                bind:value={homePrice}
                onchange={resetResultState}
                min="0"
                step="10000"
              />
            </div>

            <div class="flex flex-col gap-2">
              <Label for="downPaymentPercent">Down Payment (%)</Label>
              <Input
                id="downPaymentPercent"
                type="number"
                bind:value={downPaymentPercent}
                onchange={updateDownPayment}
                min="0"
                max="100"
                step="1"
              />
              <Range
                id="downPaymentPercent"
                bind:value={downPaymentPercent}
                onchange={updateDownPayment}
                min="0"
                max="100"
                step="1"
              />
              <div class="mt-2 text-sm text-gray-500">
                {downPaymentPercent}% ({toLocalCurrency(downPayment)})
              </div>
            </div>

            <div class="flex flex-col gap-2">
              <Label for="loanTerm">Loan Term (years)</Label>
              <Input
                id="loanTerm"
                type="number"
                bind:value={loanTerm}
                onchange={resetResultState}
                min="10"
                max="30"
                step="5"
              />
              <Range
                id="loanTerm"
                bind:value={loanTerm}
                onchange={resetResultState}
                min="10"
                max="30"
                step="5"
              />
              <div class="mt-2 text-sm text-gray-500">
                {loanTerm} years
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

            <div class="flex flex-col gap-2">
              <Label for="propertyTax">Monthly Property Tax</Label>
              <Input
                id="propertyTax"
                type="number"
                bind:value={propertyTax}
                onchange={resetResultState}
                min="0"
                step="100"
              />
            </div>

            <div class="flex flex-col gap-2">
              <Label for="homeInsurance">Monthly Home Insurance</Label>
              <Input
                id="homeInsurance"
                type="number"
                bind:value={homeInsurance}
                onchange={resetResultState}
                min="0"
                step="100"
              />
            </div>
          </div>
        </Card>

        <Card class="w-full max-w-none flex-1">
          {#if hasCalculated}
            <div class="space-y-4 p-4">
              <P size="lg">
                Monthly Payment: {toLocalCurrency(monthlyPayment)}
              </P>
              <P size="sm">
                Principal & Interest: {toLocalCurrency(principalAndInterest)}
              </P>
              {#if hasPMI && downPaymentPercent < 20}
                <P size="sm">
                  PMI: {toLocalCurrency(calculatePMI())}
                </P>
              {/if}
              <P size="sm">
                Property Tax: {toLocalCurrency(propertyTax)}
              </P>
              <P size="sm">
                Home Insurance: {toLocalCurrency(homeInsurance)}
              </P>
              <P size="lg">
                Total Interest: {toLocalCurrency(totalInterest)}
              </P>
              <P size="lg">
                Total Cost: {toLocalCurrency(totalCost)}
              </P>
              <P size="lg">
                Final Payment Date: {finalPaymentDate}
              </P>
            </div>
          {:else}
            <Button onclick={handleRecalculate}>Calculate</Button>
          {/if}
        </Card>

        <div class="flex flex-2 flex-col gap-4 md:hidden">
          {#if hasCalculated}
            <MortgageChart {balances} />
          {/if}
        </div>
      </div>
      <div class="hidden flex-2 flex-col gap-4 md:flex">
        {#if hasCalculated}
          <MortgageChart {balances} />
        {/if}
      </div>
    </div>
  </div>
  <div class="mt-4 flex justify-start p-4">
    <Button onclick={() => (isShowAmortizationTable = !isShowAmortizationTable)}>
      {isShowAmortizationTable ? 'Hide Amortization Table' : 'Show Amortization Table'}
    </Button>
  </div>
  {#if isShowAmortizationTable}
    <Table class="mt-4">
      <TableHead>
        <TableHeadCell class="w-1/4 text-left">Month</TableHeadCell>
        <TableHeadCell class="w-1/4 text-left">Balance</TableHeadCell>
        <TableHeadCell class="w-1/4 text-left">Interest Payment</TableHeadCell>
        <TableHeadCell class="w-1/4 text-left">Principal Payment</TableHeadCell>
      </TableHead>
      {#each balancesAndMonths as balance}
        <TableBody>
          <TableBodyRow>
            <TableBodyCell class="w-1/4 text-left">{balance.month}</TableBodyCell>
            <TableBodyCell class="w-1/4 text-left">{toLocalCurrency(balance.balance)}</TableBodyCell
            >
            <TableBodyCell class="w-1/4 text-left"
              >{toLocalCurrency(balance.interestPayment)}</TableBodyCell
            >
            <TableBodyCell class="w-1/4 text-left"
              >{toLocalCurrency(balance.principalPayment)}</TableBodyCell
            >
          </TableBodyRow>
        </TableBody>
      {/each}
    </Table>
  {/if}
{/if}
