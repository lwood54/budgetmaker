<script lang="ts">
  import { Card, Range, Input, Chart, Label, P, Button } from 'flowbite-svelte';
  import { toLocalCurrency } from '$lib/helpers/conversions';

  import { onMount } from 'svelte';

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
    for (let i = 0; i < monthsToPayOff; i++) {
      totalInterest += balance * (annualInterestRate / 100 / 12);
      balance -= monthlyPayment;
      if (balance < 0) {
        balance = 0;
      }
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
  <div class="space-y-6 p-4">
    <P class="font-semibold" size="lg">Credit Card Paydown</P>
    <div class="flex gap-4">
      <div class="flex flex-1 flex-col gap-4">
        <Card class="flex-2 p-4">
          <div class="space-y-4 p-4">
            <div class="flex flex-col gap-2">
              <Label for="principalBalance">Principal Balance</Label>
              <Input
                id="principalBalance"
                type="number"
                bind:value={principalBalance}
                oninput={resetResultState}
                min="0"
                step="100"
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

        <Card class="flex-1">
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
      </div>
      <div class="flex flex-2 flex-col gap-4">
        <Card size="xl" class="h-full p-4">
          <Chart
            options={{
              series: [
                {
                  name: 'Balance',
                  data: balances,
                },
              ],
              chart: {
                type: 'line',
                height: '100%',
                toolbar: {
                  show: false,
                },
                zoom: {
                  enabled: true,
                },
              },
              colors: ['#0EC7C1'], // Keep the original teal color
              stroke: {
                width: 2,
                curve: 'smooth',
              },
              grid: {
                show: true,
                borderColor: '#E5E7EB',
                strokeDashArray: 4,
                padding: {
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                },
              },
              xaxis: {
                categories: balances.map((_, index) => `Month ${index}`),
                labels: {
                  style: {
                    colors: '#6B7280',
                  },
                },
                axisBorder: {
                  show: true,
                  color: '#E5E7EB',
                },
                axisTicks: {
                  show: true,
                  color: '#E5E7EB',
                },
              },
              yaxis: {
                labels: {
                  style: {
                    colors: '#6B7280',
                  },
                  formatter: function (value: number) {
                    return toLocalCurrency(value);
                  },
                },
              },
              tooltip: {
                shared: true,
                intersect: false,
                y: {
                  formatter: function (value: number) {
                    return toLocalCurrency(value);
                  },
                },
              },
              title: {
                text: 'Paydown Progress',
                align: 'center',
                style: {
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#0EC7C1',
                },
              },
            }}
          />
        </Card>
      </div>
    </div>
  </div>
{/if}
