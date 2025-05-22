import { budgets } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const result = await locals.db.select().from(budgets).limit(10).orderBy(desc(budgets.createdAt));
	return {
		budgets: result
	};
};

export const actions: Actions = {
	default: async ({ locals, request, platform }) => {
		const formData = await request.formData();
		const name = formData.get('name');
		const country = platform?.cf?.country ?? 'Unknown';
		console.info('COUNTRY: ', country);

		await locals.db.insert(budgets).values({
			uuid: crypto.randomUUID(),
			name: name as string,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		});

		return { success: true };
	}
};
