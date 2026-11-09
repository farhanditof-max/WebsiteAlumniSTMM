export const POPULAR_SKILLS = [
  'Blender', 'Maya', '3D Animation', 'Unity', 'Unreal Engine',
  'Premiere', 'After Effects', 'DaVinci', 'Photoshop', 'Illustrator',
  'Figma', 'UI/UX', 'Broadcasting', 'Directing', 'Sound Design', 'C#', 'Motion Graphics'
];

export function extractSkills(bio = '', prodi = ''): string[] {
  const detected: string[] = [];
  const text = `${bio} ${prodi}`.toLowerCase();
  POPULAR_SKILLS.forEach((skill) => {
    if (text.includes(skill.toLowerCase())) {
      detected.push(skill);
    }
  });

  if (detected.length === 0) {
    if (prodi.includes('Animasi')) return ['Blender', '3D Animation', 'Motion Graphic'];
    if (prodi.includes('Game')) return ['Unity 3D', 'Game Art', 'C#'];
    if (prodi.includes('MIK')) return ['UI/UX', 'Web System', 'Media Tech'];
    if (prodi.includes('Matekstosi')) return ['Studio Control', 'Audio Mix', 'Broadcasting'];
    if (prodi.includes('Manarita')) return ['Journalism', 'News Anchor', 'Scriptwriting'];
    if (prodi.includes('Manaprodsi')) return ['Producer', 'Directing', 'Broadcasting'];
    return ['Creative Media', 'Multimedia'];
  }

  return detected.slice(0, 5);
}
