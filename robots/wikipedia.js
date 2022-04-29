const superAgent = require('superagent');
const readline = require('readline-sync');
const unicode = require('unidecode');

async function Wikipedia(content) {
    const images = [];
    var ctn = '';
    var title = '';
    var summary = '';
    var pageid = '';
    var url = '';
    const links = [];
    const references = [];
    var structure


    console.log('Fetching from Wikipedia...')
    var RealText = await getRealText(content.searchTerm)
    title = RealText;
    console.log('Searching content...')
    await getContent();
    console.log('Building Structure to others Robots')
    structure = buildStructure();


    async function getRealText(text) {
        const res = await superAgent.get('https://en.wikipedia.org/w/api.php').query({
            'action' : 'opensearch',
            'search' : ''+text,
            'limit' : 5,
            'namespace': 0,
            'format' : "json"
        })
        if(res.body[1].length == 0) {
            console.log('Your search term don\'t return any result')
            console.log('Tip: Search your therm in English or pre-search valid Words')
            console.log('Exiting Programm....')
            process.exit()
        }
        let sugestions = []
        res.body[1].forEach(e => {
            sugestions.push(unicode(e))
        });
        let index = await selectTerm(sugestions)
        if(index == -1) {
            console.log('You don\'t selected any key')
            console.log('Exiting Program....')
            process.exit()
        }
        url = res.body[3][index]
        return res.body[1][index]
    }

    async function selectTerm(prefix) {
        return readline.keyInSelect(prefix, 'Choose if any of these keys is the desired search :')
    }

    async function getContent() {
        const ret = await superAgent.get('https://en.wikipedia.org/w/api.php').query({
            'action' : 'query',
            'prop' : 'extracts|images|llinks|info|extlinks',
            'redirects' : 1,
            'exsectionformat' : 'wiki',
            'explaintext' : true,
            'titles' : RealText,
            'format' : "json"
        })
        let value
        map = new Map(Object.entries(ret.body.query.pages));
        map.forEach(function(e){
            value = e;
        });
        value.links.forEach(e => {
            links.push(e.title)
        });
        value.extlinks.forEach(e => {
            references.push(e['*'])
        });
        pageid = value.pageid;
        ctn = value.extract;
        summary = value.extract.split('\n\n\n')[0]
        console.log("Fetching Images...")
        for (let i = 0; i < value.images.length; i++) {
            await getURLImage(value.images[i].title);
        }
    }

    async function getURLImage(title) {
        const ret = await superAgent.get('https://en.wikipedia.org/w/api.php').query({
            'action':'query',
            'prop': 'imageinfo',
            'titles':title,
            'format':"json",
            'iiprop':'url'
        })
        values = [];
        map = new Map(Object.entries(ret.body.query.pages));
        map.forEach(function(e){
            e.imageinfo.forEach(function(e){
                values.push(e.url)
            });
        });
        values.forEach(function(e){
            images.push(e);
        });
    }

    async function buildStructure() {
        return {
            content: ctn,
            images:  images,
            links: links,
            pageid:pageid,
            references:references,
            summary: summary,
            title: title,
            url: url
        }
    }

}


module.exports = Wikipedia