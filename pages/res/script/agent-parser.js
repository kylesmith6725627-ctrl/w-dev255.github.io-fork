export function parseCommand(input) {
  const matches = input.match(/[^\s"']+|"[^"]*"|'[^']*'/g) || [];
  return matches.map((part) => part.replace(/^("|')|("|')$/g, '').trim());
}
