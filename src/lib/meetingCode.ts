// src/lib/meetingCode.ts

function randomLetters(length: number) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  let result = "";
  const n = alphabet.length;

  for (let i = 0; i < length; i++) {
    const index = Math.floor(Math.random() * n);
    result += alphabet[index];
  }

  return result;
}

/**
 * Generate a Google-Meet-ish join code, e.g. "abc-defg-hij"
 */
export function generateMeetingJoinCode() {
  const part1 = randomLetters(3);
  const part2 = randomLetters(4);
  const part3 = randomLetters(3);

  return `${part1}-${part2}-${part3}`;
}
