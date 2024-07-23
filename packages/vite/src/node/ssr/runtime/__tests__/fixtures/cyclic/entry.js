export async function setupCyclic() {
	const mod = await import("./entry-cyclic.js");
	await mod.default();
}

export async function importAction(id) {
	const action = await import(/* @vite-ignore */ id);
	console.log(action);
}
