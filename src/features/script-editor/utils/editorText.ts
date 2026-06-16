export const countReadableUnits = (text: string) => {
  const chineseChars = text.match(/[\u4e00-\u9fff]/g) ?? [];
  const words = text
    .replace(/[\u4e00-\u9fff]/g, ' ')
    .match(/[A-Za-z0-9]+(?:[-_'][A-Za-z0-9]+)*/g) ?? [];

  return chineseChars.length + words.length;
};

export const textFromHtml = (html: string) => {
  const parser = new DOMParser();
  return parser.parseFromString(html, 'text/html').body.textContent ?? '';
};
