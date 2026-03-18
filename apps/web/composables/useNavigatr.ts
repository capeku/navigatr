import type { Navigatr } from '@navigatr/web'

let navigatrInstance: Navigatr | null = null

export function useNavigatr() {
  async function getNavigatr(): Promise<Navigatr> {
    if (!navigatrInstance) {
      const { Navigatr } = await import('@navigatr/web')
      navigatrInstance = new Navigatr()
    }
    return navigatrInstance
  }

  return {
    getNavigatr
  }
}
