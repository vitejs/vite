// prettier-ignore
// copied from https://unpkg.com/slash@5.0.0/index.js to reduce network issues in CI

export default function slash(path) {
	const isExtendedLengthPath = /^\\\\\?\\/.test(path);

	if (isExtendedLengthPath) {
		return path;
	}

	return path.replace(/\\/g, '/');
}
