import restify from 'restify'
import translate from './translate'

console.log('version: 0.1.3')
const server = restify.createServer()

server.use(restify.plugins.acceptParser(server.acceptable))
server.use(restify.plugins.queryParser())
server.use(restify.plugins.jsonBodyParser())

server.post('/translate2/:target', async (req, res, next) => {
    console.log(req.params, req.body)
    try {
        let result = await translate(req.body['text'], {
            targetLanguage: req.params['target'],
            sourceLanguage: req.body['srcLang'],
        })

        res.json({
            result,
        })
    } catch (err) {
        console.log('translation error:', err)
        res.send(500)
    }
})

const port = 9000
server.listen(port, () => {
    console.log('translate server listening on ', port)
})
