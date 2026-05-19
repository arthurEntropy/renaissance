import { ref, watch, nextTick } from 'vue'

export function useMarkNavigation(scrollContainer, displayedHtml) {
  const currentMarkIndex = ref(0)
  const markCount = ref(0)

  const scrollToMark = (index) => {
    const container = scrollContainer.value
    if (!container) return
    const marks = container.querySelectorAll('mark')
    markCount.value = marks.length
    if (index < 0 || index >= marks.length) return
    marks.forEach(m => m.classList.remove('active-mark'))
    const target = marks[index]
    target.classList.add('active-mark')
    const containerRect = container.getBoundingClientRect()
    const markRect = target.getBoundingClientRect()
    container.scrollTo({
      top: container.scrollTop + markRect.top - containerRect.top - 40,
      behavior: 'smooth',
    })
    currentMarkIndex.value = index
  }

  const navigateMark = (delta) => {
    scrollToMark(currentMarkIndex.value + delta)
  }

  watch(displayedHtml, async () => {
    await nextTick()
    const marks = scrollContainer.value?.querySelectorAll('mark') ?? []
    markCount.value = marks.length
    if (currentMarkIndex.value >= marks.length) currentMarkIndex.value = 0
    marks.forEach(m => m.classList.remove('active-mark'))
    if (marks[currentMarkIndex.value]) {
      marks[currentMarkIndex.value].classList.add('active-mark')
    }
  })

  return { currentMarkIndex, markCount, scrollToMark, navigateMark }
}
