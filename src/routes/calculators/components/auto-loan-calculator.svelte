<script lang="ts">
  import { Card, Range, Input, Chart, Label, P, Button } from 'flowbite-svelte';
  import { toLocalCurrency } from '$lib/helpers/conversions';
  import { onMount } from 'svelte';

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
  <div class="space-y-6 p-4">
    <P class="font-semibold" size="lg">Auto Loan Calculator</P>
    <div class="flex gap-4">
      <div class="flex flex-1 flex-col gap-4">
        <Card class="flex-2">
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

        <Card class="flex-1 p-4">
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
      </div>
      <div class="flex flex-2 flex-col gap-4">
        <Card size="xl" class="h-full p-4">
          {#if hasCalculated}
            <Chart
              options={{
                series: [
                  {
                    name: 'Remaining Balance',
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
                colors: ['#0EC7C1'],
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
                  text: 'Loan Amortization',
                  align: 'center',
                  style: {
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#0EC7C1',
                  },
                },
              }}
            />
          {/if}
        </Card>
      </div>
    </div>
  </div>
{/if}
