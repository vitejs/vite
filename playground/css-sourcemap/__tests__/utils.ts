interface SourcemapWithSourcesContent {
  sourcesContent?: (string | null)[]
}

export function removeSourceMappingURL<T extends SourcemapWithSourcesContent>(
  sourcemap: T,
): T {
  // The sourceMappingURL comment is detected by Vitest and it tries to load the file
  // causing false warnings
  return {
    ...sourcemap,
    sourcesContent: sourcemap.sourcesContent?.map((source) =>
      source?.replace(/\n?\/\*# sourceMappingURL=.*?\*\//g, ''),
    ),
  }
}
