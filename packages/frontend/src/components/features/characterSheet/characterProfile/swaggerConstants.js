import shield1 from '@/assets/icons/swagger/shield_1.png'
import shield2 from '@/assets/icons/swagger/shield_2.png'
import shield3 from '@/assets/icons/swagger/shield_3.png'
import shield4 from '@/assets/icons/swagger/shield_4.png'
import shield5 from '@/assets/icons/swagger/shield_5.png'
import shield6 from '@/assets/icons/swagger/shield_6.png'
import shield7 from '@/assets/icons/swagger/shield_7.png'
import shield8 from '@/assets/icons/swagger/shield_8.png'
import shield9 from '@/assets/icons/swagger/shield_9.png'
import shield10 from '@/assets/icons/swagger/shield_10.png'

export const LANDSKNECHT_MESTIERE_ID = '45ca935d-938b-4974-961c-4171cc388904'
export const SWAGGER_MAX = 5
export const SWAGGER_ICONS = [
  shield1,
  shield2,
  shield3,
  shield4,
  shield5,
  shield6,
  shield7,
  shield8,
  shield9,
  shield10,
]

export function shieldMaskStyle(src, color) {
  return {
    maskImage: `url(${src})`,
    WebkitMaskImage: `url(${src})`,
    maskSize: 'contain',
    WebkitMaskSize: 'contain',
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
    maskPosition: 'center',
    WebkitMaskPosition: 'center',
    backgroundColor: color,
  }
}
