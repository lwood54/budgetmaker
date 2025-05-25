<script lang="ts">
  import {
    DarkMode,
    Navbar,
    NavHamburger,
    NavUl,
    NavLi,
    P,
    Drawer,
    CloseButton,
  } from 'flowbite-svelte';
  import '../app.css';
  import { Route } from '$lib/constants/routes';
  import { page } from '$app/state';
  import { onMount } from 'svelte';

  const txtActiveClass = 'text-primary-900 font-bold dark:text-primary-200';
  const txtNonActiveClass = 'text-primary-700 dark:text-primary-400';

  let { children, data } = $props();
  let activeUrl = $derived(page.url.pathname);
  let hidden = $state(false);
  let screenWidth = $state(0);
  let scrollY = $state(0);
  let navbarOpacity = $state(0);
  let blurValue = $state(0);
  let isDarkMode = $state(false);
  let isDrawerHidden = $state(true);
  $inspect('DATA ---> ', data);

  function updateScreenWidth() {
    screenWidth = window?.innerWidth;
  }

  function handleScroll() {
    scrollY = window?.scrollY || 0;
    navbarOpacity = Math.min(scrollY / 400, 0.95);
    blurValue = Math.min(navbarOpacity * 4, 8);
  }

  onMount(() => {
    updateScreenWidth();
    handleScroll();

    window?.addEventListener('resize', updateScreenWidth);
    window?.addEventListener('scroll', handleScroll);
    const themeMode = localStorage.getItem('THEME_PREFERENCE_KEY');
    isDarkMode = themeMode !== 'light';

    return () => {
      window?.removeEventListener('resize', updateScreenWidth);
      window?.removeEventListener('scroll', handleScroll);
    };
  });

  $effect(() => {
    if (screenWidth < 768) {
      hidden = true;
    } else {
      hidden = false;
    }
  });
</script>

<div
  class="fixed top-0 left-0 z-50 w-full transition-all duration-300"
  style={`background-color: ${isDarkMode ? 'rgba(15, 23, 42, ' + navbarOpacity + ')' : 'rgba(255, 255, 255, ' + navbarOpacity + ')'}; backdrop-filter: blur(${blurValue}px)`}
>
  <Navbar class="!bg-transparent !px-0 py-3">
    <div class="flex w-full items-center justify-between">
      <NavHamburger onclick={() => (isDrawerHidden = !isDrawerHidden)} />
      <div class="flex items-center">
        <P size="xl" class={txtActiveClass}>BudgetmakerIO</P>
      </div>

      <div class="flex items-center gap-4">
        <NavUl {hidden} {activeUrl}>
          <NavLi activeClass={txtActiveClass} nonActiveClass={txtNonActiveClass} href={Route.home}
            >Home</NavLi
          >
          <NavLi
            activeClass={txtActiveClass}
            nonActiveClass={txtNonActiveClass}
            href={Route.calculators}>Calculators</NavLi
          >
          {#if data.user}
            <NavLi
              activeClass={txtActiveClass}
              nonActiveClass={txtNonActiveClass}
              href={Route.budgets}>Budgets</NavLi
            >
            <NavLi
              activeClass={txtActiveClass}
              nonActiveClass={txtNonActiveClass}
              href={Route.paydown}>Paydown</NavLi
            >
          {:else}
            <NavLi
              activeClass={txtActiveClass}
              nonActiveClass={txtNonActiveClass}
              href={Route.login}>Login</NavLi
            >
          {/if}
        </NavUl>

        <div
          onclick={() => (isDarkMode = !isDarkMode)}
          role="button"
          aria-label="Toggle dark mode"
          tabindex="0"
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              isDarkMode = !isDarkMode;
            }
          }}
          class="cursor-pointer"
        >
          <DarkMode class="cursor-pointer text-white" size="lg" />
        </div>
      </div>
    </div>
  </Navbar>
</div>

<Drawer bind:hidden={isDrawerHidden}>
  <div
    class="flex items-center justify-between border-b border-b-2 border-neutral-300 dark:border-neutral-700"
  >
    <h5 id="drawer-label" class="mb-2 items-center font-semibold text-gray-500 dark:text-gray-400">
      MENU
    </h5>
    <CloseButton onclick={() => (isDrawerHidden = true)} class="mb-4 dark:text-white" />
  </div>
</Drawer>
{@render children()}
