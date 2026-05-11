import { SKILLS } from '@shared/constants/characterConstants'

/**
 * @param {{ key?: string } | null | undefined} skill
 * @returns {string}
 */
export function getSkillId(skill) {
  return skill?.key ?? ''
}

/**
 * @param {{ key?: string } | null | undefined} skill
 * @returns {string}
 */
export function getSkillLabel(skill) {
  const skillId = getSkillId(skill)
  return Object.values(SKILLS).find((item) => item.key === skillId)?.label ?? skillId
}

/**
 * @template T
 * @param {Array<T & { key?: string }> | undefined | null} skills
 * @param {string} skillId
 * @returns {(T & { key?: string }) | null}
 */
export function findSkillById(skills, skillId) {
  if (!Array.isArray(skills) || !skillId) return null
  return skills.find((skill) => getSkillId(skill) === skillId) ?? null
}

/**
 * @param {{ type?: string, value?: { key?: string } } | null | undefined} modifier
 * @returns {string}
 */
export function getModifierStatKey(modifier) {
  if (modifier?.type !== 'stat') return ''
  return modifier.value?.key ?? ''
}

/**
 * @param {{ type?: string, value?: { label?: string } } | null | undefined} modifier
 * @returns {string}
 */
export function getModifierStatLabel(modifier) {
  if (modifier?.type !== 'stat') return ''
  return modifier.value?.label ?? ''
}