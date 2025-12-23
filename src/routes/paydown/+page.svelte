<script lang="ts">
  // import Input from '$lib/components/Input.svelte';
  import { Button, P } from 'flowbite-svelte';
</script>

<P>Paydown</P>

<div>
  <P>Add a new debt</P>
  <form>
    <!-- <Input field={addDebt.fields.name} placeholder="Debt Name" />
    <Input field={addDebt.fields.amount} type="number" placeholder="Debt Amount" />
    <Input field={addDebt.fields.interestRate} type="number" placeholder="Interest Rate" />
    <Input field={addDebt.fields.monthlyPayment} type="number" placeholder="Monthly Payment" /> -->
    <Button type="submit">Add Debt</Button>
  </form>
</div>
