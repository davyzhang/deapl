import translate, { kill, setConcurrency } from "./translate";

export default function test() {
    setConcurrency(3)
    const f1 = () => {
        translate('This is a test', {
            targetLanguage: 'de-DE',
        }).then((text) => {
            console.log(text === 'Dies ist ein Test')
        })
    }
    const f2 = () => {
        translate('Hallo', {
            sourceLanguage: 'de',
            targetLanguage: 'en-US',
        }).then((text) => {
            console.log(text === 'Hello')
        })
    }

    const f3 = () => {
        translate('You lie', {
            sourceLanguage: 'en',
            targetLanguage: 'de-DE',
            formality: 'formal',
        }).then((text) => {
            console.log(text === 'Sie lügen')
        })
    }

    const f4 = () => {
        translate('You lie', {
            sourceLanguage: 'en',
            targetLanguage: 'de-DE',
            formality: 'informal',
        }).then((text) => {
            console.log(text === 'Du lügst')
        })
    }

    const f5 = () => {
        translate('You lie', {
            sourceLanguage: 'en',
            targetLanguage: 'da-DK',
        }).then((text) => {
            console.log(text === 'Du lyver')
        })
    }
    const f6 = () => {
        translate('You lie', {
            sourceLanguage: 'en',
            targetLanguage: 'de-DE',
            formality: 'informal',
        }).then((text) => {
            console.log(text === 'Du lügst')
            kill()
        })
    }
    f1()
    f2()
    f3()
    f4()
    f5()
    f6()
}

test()
