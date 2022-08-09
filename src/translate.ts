/* eslint-disable no-await-in-loop */
import * as fs from 'fs'
import puppeteer, { Browser, Page } from 'puppeteer'
import PQueue from 'p-queue'


type SourceLanguage = 'bg' | 'zh' | 'cs' | 'da' | 'nl' | 'en' | 'et' | 'fi'
  | 'fr' | 'de' | 'el' | 'hu' | 'it' | 'ja' | 'lv' | 'lt' | 'pl' | 'pt'
  | 'ro' | 'ru' | 'sk' | 'sl' | 'es' | 'sv'
const TargetLanguageMap = {
  'bg-BG': 'bg',
  'zh-CN': 'zh',
  'cs-CZ': 'cs',
  'da-DK': 'da',
  'nl-NL': 'nl',
  'en-US': 'en-US',
  'en-GB': 'en-GB',
  'et-ET': 'et',
  'fi-FI': 'fi',
  'fr-FR': 'fr',
  'de-DE': 'de',
  'el-GR': 'el',
  'hu-HU': 'hu',
  'it-IT': 'it',
  'ja-JP': 'ja',
  'lv-LV': 'lv',
  'lt-LT': 'lt',
  'pl-PL': 'pl',
  'pt-PT': 'pt-PT',
  'pt-BR': 'pt-BR',
  'ro-RO': 'ro',
  'ru-RU': 'ru',
  'sk-SK': 'sk',
  'sl-SL': 'sl',
  'es-ES': 'es',
  'sv-SV': 'sv',
}
type TargetLanguage = keyof typeof TargetLanguageMap

export interface Options {
  sourceLanguage?: SourceLanguage,
  targetLanguage: TargetLanguage,
  formality?: 'formal' | 'informal',
  defaultDelay?: number,
}

let browserPromise: Promise<Browser> | undefined
const getBrowser = () => {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      // executablePath: '/usr/bin/chromium',
      headless: true,
      args: [
        // '--no-sandbox',
        // '--disable-setuid-sandbox',

        '--disable-gpu',
        // '--disable-dev-shm-usage',
        '--no-first-run',
        // '--no-zygote',
      ],
      // args: ['--no-sandbox', '--disable-setuid-sandbox'],
      // defaultViewport: {
      //   width: 1650,
      //   height: 1050,
      // },
    })
  }
  return browserPromise
}

export async function kill() {
  if (!browserPromise) return
  const browser = await getBrowser()
  await browser.close()
}

const sleepMs = (ms: number) => new Promise(r => setTimeout(r, ms))
const hasSelector = (page: Page, selector: string) => page.evaluate(s =>
  !!document.querySelector(s), [selector])

export async function translatePhrase(text: string, options: Options) {
  const queryWait = {
    timeout: 30 * 1000,
  }
  const browser = await getBrowser()
  const page = await browser.newPage()
  await page.emulate(puppeteer.devices['iPad Pro'])
  // page.setDefaultNavigationTimeout(60 * 1000) // 60 seconds
  // page.setDefaultTimeout(61 * 1000) // 61 seconds
  // await page.setRequestInterception(true)
  // page.on('request', (request) => {
  //   if (request.isNavigationRequest() && request.redirectChain().length !== 0) {
  //     request.abort();
  //   } else {
  //     request.continue();
  //   }
  // })
  const defaultDelay = options.defaultDelay || 150
  const targetLanguage = TargetLanguageMap[options.targetLanguage]

  const waitForTranslation = async () => {
    await sleepMs(1000)
    await page.waitForSelector('.lmt:not(.lmt--active_translation_request)', queryWait)
    await sleepMs(1000)
  }

  await page.goto('https://www.deepl.com/en/translator')
  // setTimeout(() => {
  //   page.screenshot({
  //     type: 'jpeg',
  //     path: '/tmp/s.jpg',
  //   })
  //   page.evaluate(() => document.body.innerHTML).then((html) => {
  //     fs.writeFileSync('/tmp/body.html', html)
  //   }).catch((err) => { console.log(err) })
  // }, 1000 * 5)
  await page.waitForSelector('.lmt__language_select--target .lmt__language_select__active',
    queryWait)

  while (await hasSelector(page, '.dl_cookieBanner--buttonSelected')) {
    await page.click('.dl_cookieBanner--buttonSelected')
    await sleepMs(1000)
  }

  if (options.sourceLanguage) {
    await sleepMs(defaultDelay)
    await page.click('.lmt__language_select--source .lmt__language_select__active')
    await sleepMs(defaultDelay)
    await page.click(`.lmt__language_select__menu_source [dl-test="translator-lang-option-${options.sourceLanguage}"]`)
  }
  await sleepMs(defaultDelay)
  await page.click('.lmt__language_select--target .lmt__language_select__active')
  await sleepMs(defaultDelay)
  await page.click(`.lmt__language_select__menu_target [dl-test="translator-lang-option-${targetLanguage}"]`)
  await sleepMs(defaultDelay)

  await page.click('.lmt__source_textarea')
  await sleepMs(defaultDelay)
  await page.keyboard.type(text)
  await waitForTranslation()

  if (options.formality) {
    if (!await hasSelector(page, '.lmt__formalitySwitch__toggler')) {
      throw new Error('Cannot switch formality')
    }

    await page.evaluate(() => {
      const node = document.querySelector('.lmt__formalitySwitch')
      if (!node) return
      node.classList.add('dl_visible')
      node.classList.add('dl_visible_2')
      node.classList.add('lmt__formalitySwitch--is-open_0')
      node.classList.add('lmt__formalitySwitch--is-open')
    })

    await sleepMs(defaultDelay)
    if (options.formality === 'formal') {
      await page.click('.lmt__formalitySwitch__toggler')
      await page.waitForSelector('.lmt__formalitySwitch__menu', queryWait)
      await page.click('.lmt__formalitySwitch__menu_item_container:nth-child(1) .lmt__formalitySwitch__menu_item')
    } else if (options.formality === 'informal') {
      await page.click('.lmt__formalitySwitch__toggler')
      await page.waitForSelector('.lmt__formalitySwitch__menu', queryWait)
      await page.click('.lmt__formalitySwitch__menu_item_container:nth-child(2) .lmt__formalitySwitch__menu_item')
    }

    await waitForTranslation()
  }

  const result = await page.evaluate(() => {
    const node = document.querySelector('.lmt__target_textarea') as HTMLTextAreaElement
    if (!node) return ''
    return node.value
  })
  await page.close()
  return result
}

const pQueue = new PQueue({
  concurrency: process.env.DEAPL_CONCURRENCY ? parseInt(process.env.DEAPL_CONCURRENCY, 10) : 1,
})

export function setConcurrency(concurrency: number) {
  pQueue.concurrency = concurrency
}

export default async function translate(text: string, options: Options) {
  return pQueue.add(() => {
    try {
      return translatePhrase(text, options)
    } catch (err) {
      console.log('err', err)
      return Promise.resolve()
    }
  })
}
