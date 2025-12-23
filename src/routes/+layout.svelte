<script lang="ts">
  import { DarkMode, Navbar, NavHamburger, NavUl, NavLi, P, Drawer, Button } from 'flowbite-svelte';
  import '../app.css';
  import { Route } from '$lib/constants/routes';
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import ListItem from '$lib/components/ListItem.svelte';
  import { logout, getCurrentUser } from '$lib/api/auth.remote';
  import { goto } from '$app/navigation';
  import {
    AdjustmentsHorizontalOutline,
    ArrowLeftToBracketOutline,
    ChartLineDownOutline,
    ExclamationCircleOutline,
    FileChartBarOutline,
    HomeOutline,
    UserAddOutline,
    UserCircleOutline,
  } from 'flowbite-svelte-icons';
  import { getIsDarkMode, setIsDarkMode } from '$lib/store/app.svelte';

  const txtActiveClass = 'text-primary-900 font-bold dark:text-primary-200';
  const txtNonActiveClass = 'text-primary-700 dark:text-primary-400';

  let { children } = $props();
  
  const currentUser = getCurrentUser();
  const user = $derived(currentUser.current);
  let activeUrl = $derived(page.url.pathname);
  let hidden = $state(false);
  let screenWidth = $state(0);
  let scrollY = $state(0);
  let navbarOpacity = $state(0);
  let blurValue = $state(0);
  let open = $state(false);
  let isDarkMode = $derived(getIsDarkMode());

  function updateScreenWidth() {
    screenWidth = window?.innerWidth;
  }

  function handleScroll() {
    scrollY = window?.scrollY || 0;
    navbarOpacity = Math.min(scrollY / 100, 0.95);
    blurValue = Math.min(navbarOpacity * 4, 8);
  }

  onMount(() => {
    updateScreenWidth();
    handleScroll();

    window?.addEventListener('resize', updateScreenWidth);
    window?.addEventListener('scroll', handleScroll);
    const themeMode = localStorage.getItem('THEME_PREFERENCE_KEY');
    // isDarkMode = themeMode !== 'light';
    setIsDarkMode(themeMode !== 'light');

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

  const closeDrawer = () => {
    open = false;
  };
</script>

<div
  class="fixed top-0 left-0 z-50 w-full transition-all duration-300"
  style={screenWidth >= 768
    ? `background-color: ${isDarkMode ? 'rgba(15, 23, 42, ' + navbarOpacity + ')' : 'rgba(255, 255, 255, ' + navbarOpacity + ')'}; backdrop-filter: blur(${blurValue}px)`
    : `background-color: ${isDarkMode ? 'var(--color-primary-900)' : 'var(--color-primary-600)'}`}
>
  <Navbar class="bg-transparent px-2 py-3">
    <div class="flex w-full items-center justify-between">
      <NavHamburger onclick={() => (open = !open)} />
      <div class="flex items-center">
        <P size="2xl" class={txtActiveClass}>BudgetmakerIO</P>
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
          {#if user}
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
            <form
              {...logout.enhance(async ({ submit }) => {
                try {
                  await submit();
                  if (logout.result?.redirectTo) {
                    goto(logout.result.redirectTo);
                  }
                } catch (error) {
                  console.error('Logout error:', error);
                  goto('/login');
                }
              })}
            >
              <Button outline class="border-none" type="submit" data-sveltekit-preload-data="off"
                >Logout</Button
              >
            </form>
          {:else}
            <NavLi
              activeClass={txtActiveClass}
              nonActiveClass={txtNonActiveClass}
              href={Route.login}>Login</NavLi
            >
          {/if}
        </NavUl>

        <div
          onclick={() => setIsDarkMode(!isDarkMode)}
          role="button"
          aria-label="Toggle dark mode"
          tabindex="0"
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setIsDarkMode(!isDarkMode);
            }
          }}
          class="cursor-pointer"
        >
          <DarkMode class="text-primary-900 cursor-pointer dark:text-white" size="lg" />
        </div>
      </div>
    </div>
  </Navbar>
</div>
<!-- NAV FILLER -->
<div class="mt-20"></div>
<Drawer bind:open>
  <div
    class="mt-10 flex items-center justify-between border-b-2 border-neutral-300 dark:border-neutral-700"
  ></div>
  <div class="flex flex-col gap-2 p-4">
    <ListItem onClick={closeDrawer} href={Route.home}>
      <HomeOutline class="text-primary-700 dark:text-primary-400" size="lg" />
      <P class="text-primary-700 dark:text-primary-400">Home</P>
    </ListItem>
    <ListItem onClick={closeDrawer} href={Route.calculators}>
      <AdjustmentsHorizontalOutline class="text-primary-700 dark:text-primary-400" size="lg" />
      <P class="text-primary-700 dark:text-primary-400">Calculators</P>
    </ListItem>
    {#if data.user}
      <ListItem onClick={closeDrawer} href={Route.budgets}>
        <FileChartBarOutline class="text-primary-700 dark:text-primary-400" size="lg" />
        <P class="text-primary-700 dark:text-primary-400">Budgets</P>
      </ListItem>
      <ListItem onClick={closeDrawer} href={Route.paydown}>
        <ChartLineDownOutline class="text-primary-700 dark:text-primary-400" size="lg" />
        <P class="text-primary-700 dark:text-primary-400">Paydown</P>
      </ListItem>
      <ListItem onClick={closeDrawer} href={Route.logout}>
        <ArrowLeftToBracketOutline class="text-primary-700 dark:text-primary-400" size="lg" />
        <P class="text-primary-700 dark:text-primary-400">Logout</P>
      </ListItem>
    {:else}
      <ListItem onClick={closeDrawer} href={Route.login}>
        <UserCircleOutline class="text-primary-700 dark:text-primary-400" size="lg" />
        <P class="text-primary-700 dark:text-primary-400">Login</P>
      </ListItem>
      <ListItem onClick={closeDrawer} href={Route.signup}>
        <UserAddOutline class="text-primary-700 dark:text-primary-400" size="lg" />
        <P class="text-primary-700 dark:text-primary-400">Signup</P>
      </ListItem>
      <ListItem onClick={closeDrawer} href={Route.reset}>
        <ExclamationCircleOutline class="text-primary-700 dark:text-primary-400" size="lg" />
        <P class="text-primary-700 dark:text-primary-400">Reset</P>
      </ListItem>
    {/if}
  </div>
</Drawer>
{@render children()}
