declare module 'arabic-reshaper' {
  interface ArabicReshaper {
    convertArabic(text: string): string;
  }
  const reshaper: ArabicReshaper;
  export default reshaper;
}

declare module 'bidi-js' {
  interface EmbeddingLevels {
    levels: number[];
    paragraphs: Array<{ start: number; end: number; level: number }>;
  }

  interface BidiModule {
    getEmbeddingLevels(text: string, direction?: 'ltr' | 'rtl'): EmbeddingLevels;
    getReorderSegments(text: string, embeddingLevels: EmbeddingLevels): Array<[number, number]>;
    getMirroredCharactersMap(text: string, embeddingLevels: EmbeddingLevels): Map<number, string>;
  }

  const bidi: BidiModule;
  export default bidi;
}
