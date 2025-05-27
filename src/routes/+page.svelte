<script lang="ts">
  import backgroundImg from '$lib/assets/images/desk-with-whiteboard.png';
  import { P } from 'flowbite-svelte';
</script>

<div class="fixed inset-0 -z-10">
  <img class="h-full w-full object-cover" src={backgroundImg} alt="BudgetmakerIO" />
  <div class="bg-secondary-500/60 dark:bg-secondary-900/70 absolute inset-0"></div>
  <div class="absolute inset-0 bg-neutral-900/10 dark:bg-neutral-900/30"></div>
</div>

<div class="flex h-[calc(100vh-6rem)] items-center justify-center px-4">
  <div class="text-center">
    <P size="5xl" class="text-primary-900 dark:text-primary-200 text-center font-bold">
      BudgetmakerIO
    </P>
    <P size="lg" class="text-primary-800 dark:text-primary-400 text-center font-semibold">
      Take control of your finances and let us help you plan, track, and monitor your bills.
    </P>
  </div>
</div>

<div class="relative min-h-screen bg-white px-4 py-12 shadow-xl dark:bg-neutral-900">
  <div class="h-24"></div>

  <div class="container mx-auto max-w-6xl">
    <P size="4xl" class="mb-6 font-bold text-neutral-900 dark:text-neutral-50">Key Features</P>
    <P size="lg" class="mb-12 text-neutral-700 dark:text-neutral-300">
      BudgetmakerIO offers a comprehensive suite of tools to help you manage your finances
      effectively.
    </P>

    <div class="grid grid-cols-1 gap-8 md:grid-cols-3">
      <div
        class="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-800"
      >
        <div class="text-primary-600 dark:text-primary-400 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 class="mb-2 text-xl font-semibold text-neutral-900 dark:text-neutral-50">
          Budget Tracking
        </h3>
        <p class="text-neutral-700 dark:text-neutral-300">
          Easily track your purchases and stay within your budget. Categorize your spending and see
          where your money goes.
        </p>
      </div>

      <div
        class="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-800"
      >
        <div class="text-primary-600 dark:text-primary-400 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 class="mb-2 text-xl font-semibold text-neutral-900 dark:text-neutral-50">
          Financial Calculator
        </h3>
        <p class="text-neutral-700 dark:text-neutral-300">
          Calculate various financial scenarios, including auto loans, mortgages, and investments.
          Make informed decisions about your financial future.
        </p>
      </div>

      <div
        class="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-800"
      >
        <div class="text-primary-600 dark:text-primary-400 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
        </div>
        <h3 class="mb-2 text-xl font-semibold text-neutral-900 dark:text-neutral-50">
          Credit Paydown Visualization
        </h3>
        <p class="text-neutral-700 dark:text-neutral-300">
          Visualize how different payment strategies can help you pay down your credit faster. See
          the impact of extra payments and interest rates.
        </p>
      </div>
    </div>

    <div class="mt-20 text-center">
      <h2 class="mb-4 text-3xl font-bold text-neutral-900 dark:text-neutral-50">
        Ready to Transform Your Financial Future?
      </h2>
      <a
        href="/signup"
        class="bg-primary-600 hover:bg-primary-500 focus:ring-primary-500 dark:bg-primary-700 dark:hover:bg-primary-600 inline-block rounded-md px-6 py-3 text-white focus:ring-2 focus:ring-offset-2 focus:outline-none"
      >
        Get Started
      </a>
    </div>

    <footer class="mt-24 border-t border-neutral-200 pt-8 dark:border-neutral-700">
      <div class="flex flex-col justify-between gap-4 md:flex-row">
        <a
          href="/"
          class="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
          >Privacy Policy</a
        >
        <a
          href="/"
          class="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
          >Terms of Service</a
        >
        <a
          href="/"
          class="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
          >Contact Us</a
        >
      </div>
      <p class="mt-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
        © 2025 BudgetmakerIO. All rights reserved.
      </p>
    </footer>
  </div>
</div>
