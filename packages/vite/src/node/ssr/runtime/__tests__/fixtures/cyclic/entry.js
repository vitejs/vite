export async function setupCyclic() {
	const mod = await import("./entry-cyclic.js");
	await mod.default();
}

export async function importAction(id) {
	return await import(/* @vite-ignore */ id);
}
